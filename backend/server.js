// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------------- MONGODB ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ---------------- GEMINI ----------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------------- MONGODB SCHEMA ----------------
const tripSchema = new mongoose.Schema({
  destination: String,
  startDate: String,
  endDate: String,
  days: String,
  budget: String,
  interests: String,
  summary: String,
  itinerary: [String],
  budgetBreakdown: {
    stay: String,
    food: String,
    transport: String,
    activities: String,
  },
  tip: String,
  weather: String,
  createdAt: { type: Date, default: Date.now },
});

const Trip = mongoose.model("Trip", tripSchema);

// ---------------- ROUTES ----------------
app.get("/", (req, res) => {
  res.send("PlanMate backend is running!");
});

app.post("/generate-plan", async (req, res) => {
  try {
    const { destination, startDate, endDate, budget, interests } = req.body;

    if (!destination || !startDate || !endDate || !budget || !interests) {
      return res.status(400).json({ error: "Please fill all fields" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (isNaN(totalDays) || totalDays <= 0) {
      return res.status(400).json({ error: "Invalid travel dates selected." });
    }

    const totalBudget = parseInt(budget);

    // ---------------- AI PROMPT ----------------
    const prompt = `
You are a smart AI travel planner.
Generate a personalized travel plan for the following trip:
Destination: ${destination}
Start Date: ${startDate}
End Date: ${endDate}
Trip Duration: ${totalDays} days
Budget: ₹${budget}
Interests: ${interests}
Return ONLY valid JSON in this format:
{
  "summary": "short trip summary",
  "itinerary": [
    "Day 1: ...",
    "Day 2: ..."
  ],
  "tip": "one useful travel tip"
}
Rules:
- Itinerary must have exactly ${totalDays} unique days.
- Each day should have different activities based on the destination and interests.
- Tailor it to the user's budget.
- Do not include markdown or explanations.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let aiPlan = {
      summary: `Your ${totalDays}-day trip to ${destination} is ready.`,
      itinerary: [],
      tip: `Carry comfortable clothing and plan your days wisely while visiting ${destination}.`
    };

    try {
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      console.log("Gemini raw response:", text);

      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace("```json", "").replace("```", "").trim();
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/```/g, "").trim();
      }

      const parsed = JSON.parse(cleanedText);
      aiPlan.summary = parsed.summary || aiPlan.summary;

      if (Array.isArray(parsed.itinerary) && parsed.itinerary.length === totalDays) {
        aiPlan.itinerary = parsed.itinerary;
      }

      aiPlan.tip = parsed.tip || aiPlan.tip;

    } catch (err) {
      console.error("Gemini JSON parse failed or invalid itinerary, using smart fallback:", err);

      const activitiesList = [
        "visit a famous temple",
        "try local cuisine",
        "explore markets",
        "take a city tour",
        "relax at a park",
        "attend a cultural event"
      ];

      aiPlan.itinerary = Array.from({ length: totalDays }, (_, i) => {
        const activity = activitiesList[i % activitiesList.length];
        return `Day ${i + 1}: ${activity} in ${destination} based on your interest in ${interests}.`;
      });
    }

    // ---------------- WEATHER ----------------
    let weatherInfo = "Weather info not available";
    try {
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&appid=${process.env.OPENWEATHER_KEY}&units=metric`
      );
      const temp = weatherRes.data.main.temp;
      const description = weatherRes.data.weather[0].description;
      weatherInfo = `Current temperature: ${temp}°C, ${description}`;
    } catch (err) {
      console.log("OpenWeather fetch failed:", err.message);
    }

    // ---------------- BUDGET ----------------
    const stay = Math.round(totalBudget * 0.4);
    const food = Math.round(totalBudget * 0.2);
    const transport = Math.round(totalBudget * 0.15);
    const activities = Math.round(totalBudget * 0.25);

    // ---------------- FINAL PLAN ----------------
    const plan = {
      destination,
      startDate,
      endDate,
      days: totalDays.toString(),
      budget,
      interests,
      summary: aiPlan.summary,
      itinerary: aiPlan.itinerary,
      budgetBreakdown: {
        stay: `₹${stay}`,
        food: `₹${food}`,
        transport: `₹${transport}`,
        activities: `₹${activities}`,
      },
      tip: aiPlan.tip,
      weather: weatherInfo,
    };

    // ---------------- SAVE TO MONGODB ----------------
    try {
      const savedTrip = await Trip.create(plan);
      res.json(savedTrip);
    } catch (mongoErr) {
      console.error("MongoDB save failed, returning plan without saving:", mongoErr);
      res.json(plan); // send plan even if DB save fails
    }

  } catch (error) {
    console.error("Error generating AI plan:", error);
    res.status(500).json({ error: "Something went wrong while generating the plan." });
  }
});

// ---------------- GET ALL TRIPS ----------------
app.get("/trips", async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch trips." });
  }
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
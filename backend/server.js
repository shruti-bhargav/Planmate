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

console.log("Gemini key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

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
    console.log("Generate plan route hit!");

    const { destination, startDate, endDate, budget, interests } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const timeDifference = end.getTime() - start.getTime();
    let totalDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)) + 1;

    if (isNaN(totalDays) || totalDays <= 0) {
      return res.status(400).json({ error: "Invalid travel dates selected." });
    }

    const totalBudget = parseInt(budget);

    // ---------------- AI PROMPT ----------------
    const prompt = `
You are a smart travel planner AI.

Generate a personalized travel plan for the following trip:

Destination: ${destination}
Start Date: ${startDate}
End Date: ${endDate}
Trip Duration: ${totalDays} days
Budget: ₹${budget}
Interests: ${interests}

Return the response ONLY in valid JSON format like this:

{
  "summary": "short trip summary",
  "itinerary": [
    "Day 1: ...",
    "Day 2: ..."
  ],
  "tip": "one useful travel tip"
}

Rules:
- itinerary must contain exactly ${totalDays} days
- make the plan realistic, personalized, and engaging
- tailor it to the user's interests and budget
- do not include markdown
- do not include explanation outside JSON
`;

    // ---------------- GEMINI WITH FALLBACK ----------------
    let aiPlan;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([prompt]);
      const text = result.response.text();

      console.log("Gemini raw response:", text);

      let cleanedText = text.trim();

      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace("```json", "").replace("```", "").trim();
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/```/g, "").trim();
      }

      aiPlan = JSON.parse(cleanedText);

      if (!Array.isArray(aiPlan.itinerary)) {
        aiPlan.itinerary = Array.from(
          { length: totalDays },
          (_, i) =>
            `Day ${i + 1}: Explore ${destination} based on your interests in ${interests}.`
        );
      }

      if (!aiPlan.summary) {
        aiPlan.summary = `Your ${totalDays}-day trip to ${destination} from ${startDate} to ${endDate} is planned around your interests in ${interests} with an estimated budget of ₹${budget}.`;
      }

      if (!aiPlan.tip) {
        aiPlan.tip = `Carry comfortable clothing and plan your days wisely while visiting ${destination}.`;
      }
    } catch (geminiError) {
      console.error("Gemini failed, using fallback:", geminiError.message);

      aiPlan = {
        summary: `Your ${totalDays}-day trip to ${destination} from ${startDate} to ${endDate} is planned around your interests in ${interests} with an estimated budget of ₹${budget}.`,
        itinerary: Array.from(
          { length: totalDays },
          (_, i) =>
            `Day ${i + 1}: Explore ${destination} based on your interests in ${interests}.`
        ),
        tip: `Carry comfortable clothing and plan your days wisely while visiting ${destination}.`,
      };
    }

    // ---------------- WEATHER PART ----------------
    let weatherInfo = "Weather info not available";

    try {
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          destination
        )}&appid=${process.env.OPENWEATHER_KEY}&units=metric`
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
      summary: aiPlan.summary || `Your ${totalDays}-day trip to ${destination} is ready.`,
      itinerary: Array.isArray(aiPlan.itinerary)
        ? aiPlan.itinerary
        : Array.from(
            { length: totalDays },
            (_, i) =>
              `Day ${i + 1}: Explore ${destination} based on your interests in ${interests}.`
          ),
      budgetBreakdown: {
        stay: `₹${stay || 0}`,
        food: `₹${food || 0}`,
        transport: `₹${transport || 0}`,
        activities: `₹${activities || 0}`,
      },
      tip:
        aiPlan.tip ||
        `Carry comfortable clothing and plan your days wisely while visiting ${destination}.`,
      weather: weatherInfo,
    };

    // ---------------- SAVE TO MONGODB ----------------
    const savedTrip = await Trip.create(plan);
    console.log("Trip saved to MongoDB successfully!");

    res.json(savedTrip);
  } catch (error) {
    console.error("FULL ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ---------------- VIEW SAVED TRIPS ----------------
app.get("/trips", async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch trips." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
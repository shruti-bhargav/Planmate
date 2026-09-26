"use client";
import { useState } from "react";

type PlanResponse = {
  destination: string;
  days: string;
  startDate: string;
  endDate: string;
  budget: string;
  interests: string;
  summary: string;
  itinerary: string[];
  budgetBreakdown: {
    stay: string;
    food: string;
    transport: string;
    activities: string;
  };
  tip: string;
  weather: string;
};

export default function Home() {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState("");
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function generatePlan() {
    if (!destination || !startDate || !endDate || !budget || !interests) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("https://planmate-l807.onrender.com/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, startDate, endDate, budget, interests }),
      });

      const data = await res.json();

      console.log("Backend response:", data);

      if (!res.ok || data.error) {
        alert(data.error || "Failed to generate plan.");
        return;
      }

      // Ensure itinerary is always an array
      if (!Array.isArray(data.itinerary)) {
        data.itinerary = [];
      }

      setPlan(data);
    } catch (error) {
      console.error("Error generating plan:", error);
      alert("Something went wrong while generating the plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-4 py-10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-start">
        {/* LEFT PANEL */}
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-8 border border-white">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PlanMate AI ✈️
          </h1>
          <p className="text-gray-600 mb-8">
            Enter your travel details to get a personalized itinerary, budget breakdown, and travel tips.
          </p>

          <div className="space-y-4">
            <input
              placeholder="Destination (e.g. Goa)"
              className="border p-4 w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                className="border p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="border p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <input
              placeholder="Budget in INR (e.g. 20000)"
              className="border p-4 w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
            <input
              placeholder="Interests (e.g. beaches, food)"
              className="border p-4 w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
            <button
              onClick={generatePlan}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-semibold transition"
            >
              {loading ? "Generating your trip..." : "Generate Travel Plan"}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">
          {!plan ? (
            <div className="bg-white/80 shadow-2xl rounded-3xl p-8 border border-white min-h-[500px] flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Your smart itinerary will appear here 🌍
              </h2>
              <p className="text-gray-600">
                Fill in your trip details and PlanMate AI will create a personalized travel experience for you.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white/80 shadow-2xl rounded-3xl p-6 border border-white">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Your Travel Plan 🌍</h2>
                <div className="grid gap-2 text-gray-700">
                  <p><strong>Destination:</strong> {plan.destination}</p>
                  <p><strong>Start Date:</strong> {plan.startDate}</p>
                  <p><strong>End Date:</strong> {plan.endDate}</p>
                  <p><strong>Trip Duration:</strong> {plan.days} days</p>
                  <p><strong>Budget:</strong> ₹{plan.budget}</p>
                  <p><strong>Interests:</strong> {plan.interests}</p>
                  <p><strong>Weather:</strong> {plan.weather}</p>
                </div>
                <p className="mt-4 text-gray-600">{plan.summary}</p>
              </div>

              <div className="bg-white/80 shadow-2xl rounded-3xl p-6 border border-white">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Day-wise Itinerary</h3>
                <div className="space-y-3">
                  {plan.itinerary.length > 0 ? (
                    plan.itinerary.map((day, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">{day}</div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600">
                      Could not generate itinerary properly.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/80 shadow-2xl rounded-3xl p-6 border border-white">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Budget Breakdown 💰</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
                    <p className="text-sm text-gray-500">Stay</p>
                    <p className="text-lg font-bold">{plan.budgetBreakdown.stay}</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100">
                    <p className="text-sm text-gray-500">Food</p>
                    <p className="text-lg font-bold">{plan.budgetBreakdown.food}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                    <p className="text-sm text-gray-500">Transport</p>
                    <p className="text-lg font-bold">{plan.budgetBreakdown.transport}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                    <p className="text-sm text-gray-500">Activities</p>
                    <p className="text-lg font-bold">{plan.budgetBreakdown.activities}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-2xl rounded-3xl p-6">
                <h3 className="text-xl font-bold mb-2">Travel Tip ☀️</h3>
                <p>{plan.tip}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
"use client";
import { useState } from "react";

type PlanResponse = {
  destination: string;
  days: string;
  startDate: string;
  weather: string;
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

      const res = await fetch("http://127.0.0.1:5000/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
          startDate,
          endDate,
          budget,
          interests,
        }),
      });

      const data = await res.json();

console.log("Backend response:", data);

if (!res.ok || data.error) {
  alert(data.error || "Failed to generate plan.");
  return;
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
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-start">
        
        {/* LEFT PANEL */}
        <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl p-8 border border-white">
          <p className="text-sm font-medium text-indigo-600 mb-2 uppercase tracking-widest">
            AI Travel Planner
          </p>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Plan your next trip with
            <span className="block text-indigo-600">PlanMate AI ✈️</span>
          </h1>

          <p className="text-gray-600 mb-8">
            Enter your travel details and get a personalized itinerary,
            budget breakdown, and travel tips in seconds.
          </p>

          <div className="space-y-4">
            <input
              className="border border-gray-300 rounded-2xl p-4 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              placeholder="Destination (e.g. Goa)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                className="border border-gray-300 rounded-2xl p-4 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <input
                type="date"
                className="border border-gray-300 rounded-2xl p-4 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <input
              className="border border-gray-300 rounded-2xl p-4 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              placeholder="Budget in INR (e.g. 20000)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />

            <input
              className="border border-gray-300 rounded-2xl p-4 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              placeholder="Interests (e.g. beaches, food, adventure)"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />

            <button
              onClick={generatePlan}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-semibold text-lg transition shadow-lg"
            >
              {loading ? "Generating your trip..." : "Generate Travel Plan"}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">
          {!plan ? (
            <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl p-8 border border-white min-h-[500px] flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Your smart itinerary will appear here 🌍
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Fill in your trip details on the left and PlanMate AI will
                create a personalized travel experience for you.
              </p>
              <p className="mt-3 text-gray-700 font-medium">
                
              </p>

              <div className="mt-8 grid gap-4">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <p className="font-semibold text-indigo-700">✔ Personalized itinerary</p>
                </div>
                <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
                  <p className="font-semibold text-sky-700">✔ Budget breakdown</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                  <p className="font-semibold text-purple-700">✔ Travel tips</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl p-6 border border-white">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  Your Travel Plan 🌍
                </h2>

                <div className="grid gap-2 text-gray-700">
                  <p><span className="font-semibold">Destination:</span> {plan.destination}</p>
                  <p><span className="font-semibold">Start Date:</span> {plan.startDate}</p>
                  <p><span className="font-semibold">End Date:</span> {plan.endDate}</p>
                  <p><span className="font-semibold">Trip Duration:</span> {plan.days} days</p>
                  <p><span className="font-semibold">Budget:</span> ₹{plan.budget}</p>
                  <p><span className="font-semibold">Interests:</span> {plan.interests}</p>
                  <p><span className="font-semibold">Weather:</span> {plan.weather}</p>
                </div>

                <p className="mt-4 text-gray-600 leading-relaxed">
                  {plan.summary}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl p-6 border border-white">
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  Day-wise Itinerary
                </h3>
                <div className="space-y-3">
                  {Array.isArray(plan.itinerary) && plan.itinerary.length > 0 ? (
  plan.itinerary.map((item, index) => (
    <div
      key={index}
      className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100"
    >
      {item}
    </div>
  ))
) : (
  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600">
    Could not generate itinerary properly. Please try again.
  </div>
)}
                  
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl p-6 border border-white">
  <h3 className="text-xl font-bold mb-4 text-gray-900">
    Budget Breakdown 💰
  </h3>

  {plan.budgetBreakdown ? (
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
  ) : (
    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600">
      Budget breakdown could not be generated properly.
    </div>
  )}
</div>

              <div className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-2xl rounded-3xl p-6">
                <h3 className="text-xl font-bold mb-2">Travel Tip ☀️</h3>
                <p className="leading-relaxed">{plan.tip}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
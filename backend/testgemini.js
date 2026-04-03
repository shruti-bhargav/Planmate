require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  try {
    console.log("Gemini key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent("Say hello in one sentence.");
    const response = await result.response;
    const text = response.text();

    console.log("Gemini success:");
    console.log(text);
  } catch (error) {
    console.error("========== FULL GEMINI ERROR ==========");
    console.error("Message:", error.message);
    console.error("Name:", error.name);
    console.error("Stack:", error.stack);
    console.error("Full object:", error);
    console.error("========== END ERROR ==========");
  }
}

testGemini();
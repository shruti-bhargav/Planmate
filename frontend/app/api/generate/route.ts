import OpenAI from "openai";

export async function POST(req: Request) {

  const body = await req.json();

  const { destination, days, interests } = body;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
  Create a ${days}-day travel itinerary for ${destination}.
  Interests: ${interests}.
  Include places to visit, food suggestions and activities.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "user", content: prompt }
    ],
  });

  return Response.json({
    plan: completion.choices[0].message.content,
  });
}
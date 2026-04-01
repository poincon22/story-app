import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Texte manquant" });

  try {
    const response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "nova",
      input: text,
      response_format: "mp3",
      speed: 0.9,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    res.json({ audio: buffer.toString("base64") });
  } catch (err) {
    console.error("TTS error:", err.message);
    res.status(500).json({ error: "Erreur lors de la synthese vocale" });
  }
}

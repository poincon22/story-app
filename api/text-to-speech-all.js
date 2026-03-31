import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VOICES = [
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
  { id: "fable", name: "Fable" },
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "onyx", name: "Onyx" },
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Texte manquant" });

  try {
    const results = await Promise.all(
      VOICES.map(async ({ id, name }) => {
        const response = await openai.audio.speech.create({
          model: "tts-1-hd",
          voice: id,
          input: text,
          response_format: "mp3",
          speed: 0.9,
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        return { voice: name, audio: buffer.toString("base64") };
      })
    );

    const audioMap = {};
    for (const { voice, audio } of results) {
      audioMap[voice] = audio;
    }
    res.json({ audioMap });
  } catch (err) {
    console.error("TTS error:", err.message);
    res.status(500).json({ error: "Erreur lors de la synthese vocale" });
  }
}

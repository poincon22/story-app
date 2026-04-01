import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Collect raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Create a File-like object for the OpenAI API
    const file = new File([buffer], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "fr",
    });

    // Whisper hallucinate quand l'audio est vide/silencieux
    const hallucinations = [
      "sous-titres", "amara.org", "sous-titrage", "soustitres",
      "transcrit par", "traduit par", "merci d'avoir regardé",
    ];
    const lower = transcription.text.toLowerCase();
    const isHallucination = hallucinations.some((h) => lower.includes(h));

    res.json({ text: isHallucination ? "" : transcription.text });
  } catch (err) {
    console.error("Transcription error:", err.message);
    res.status(500).json({ error: "Erreur lors de la transcription" });
  }
}

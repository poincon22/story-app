import dotenv from "dotenv";
dotenv.config({ override: true });

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import express from "express";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VOICES = [
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
  { id: "fable", name: "Fable" },
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "onyx", name: "Onyx" },
];

// List available voices
app.get("/api/voices", (req, res) => {
  res.json({ voices: VOICES });
});

// Generate a children's story from a context
app.post("/api/generate-story", async (req, res) => {
  const { context } = req.body;
  if (!context) return res.status(400).json({ error: "Contexte manquant" });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Tu es un conteur pour enfants de 5 ans. Ecris une histoire courte (environ 300 mots) basee sur ce contexte : "${context}".

Regles :
- Langage simple et joyeux, adapte a un enfant de 5 ans
- Phrases courtes et faciles a comprendre
- Une morale positive a la fin
- Des personnages attachants
- Pas de contenu effrayant ou violent
- Ecris UNIQUEMENT l'histoire, sans titre ni commentaire`,
        },
      ],
    });

    const story = message.content[0].text;
    res.json({ story });
  } catch (err) {
    console.error("Story generation error:", err.message);
    res.status(500).json({ error: "Erreur lors de la generation de l'histoire" });
  }
});

// Generate audio for all voices in parallel using OpenAI TTS
app.post("/api/text-to-speech-all", async (req, res) => {
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
});

// Transcribe audio to text using Whisper
app.post("/api/transcribe", express.raw({ type: "*/*", limit: "25mb" }), async (req, res) => {
  try {
    const file = new File([req.body], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "fr",
    });

    res.json({ text: transcription.text });
  } catch (err) {
    console.error("Transcription error:", err.message);
    res.status(500).json({ error: "Erreur lors de la transcription" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

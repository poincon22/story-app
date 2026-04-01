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
  const { context, mode = "story", duration = 60, age = 4, language = "fr" } = req.body;
  if (!context) return res.status(400).json({ error: "Contexte manquant" });

  const wordsPerMinute = 130;
  const targetWords = Math.round((duration / 60) * wordsPerMinute);
  const maxTokens = Math.max(500, Math.round(targetWords * 2));

  const storyPrompts = {
    fr: `Tu es un conteur pour enfants de ${age} ans. Ecris une histoire d'environ ${targetWords} mots basee sur ce contexte : "${context}".

Regles :
- L'histoire doit faire environ ${targetWords} mots (c'est important, respecte cette longueur)
- Le vocabulaire, la complexite et les themes doivent etre adaptes a un enfant de ${age} ans
- Phrases courtes et faciles a comprendre
- Une morale positive a la fin
- Des personnages attachants
- Pas de contenu effrayant ou violent
- Ecris UNIQUEMENT l'histoire en francais, sans titre ni commentaire`,
    en: `You are a storyteller for ${age}-year-old children. Write a story of about ${targetWords} words based on this context: "${context}".

Rules:
- The story must be about ${targetWords} words long (this is important, respect this length)
- The vocabulary, complexity and themes must be appropriate for a ${age}-year-old child
- Short and easy to understand sentences
- A positive moral at the end
- Lovable characters
- No scary or violent content
- Write ONLY the story in English, no title or commentary`,
  };

  const comptinePrompts = {
    fr: `Tu es un auteur de comptines pour enfants de ${age} ans. Ecris une comptine chantee d'environ ${targetWords} mots basee sur ce theme : "${context}".

Regles :
- La comptine doit faire environ ${targetWords} mots (c'est important, respecte cette longueur)
- Le vocabulaire doit etre adapte a un enfant de ${age} ans
- Les vers doivent rimer entre eux
- Le rythme doit etre regulier et chantant, facile a memoriser
- Utilise des repetitions et des refrains
- Le ton doit etre joyeux et entrainant
- Pas de contenu effrayant ou violent
- Ecris UNIQUEMENT la comptine en francais, sans titre ni commentaire
- Chaque vers sur une ligne separee`,
    en: `You are a nursery rhyme writer for ${age}-year-old children. Write a singable nursery rhyme of about ${targetWords} words based on this theme: "${context}".

Rules:
- The rhyme must be about ${targetWords} words long (this is important, respect this length)
- The vocabulary must be appropriate for a ${age}-year-old child
- Lines must rhyme with each other
- The rhythm must be regular and singable, easy to memorize
- Use repetitions and choruses
- The tone must be cheerful and catchy
- No scary or violent content
- Write ONLY the nursery rhyme in English, no title or commentary
- Each verse on a separate line`,
  };

  const prompts = mode === "comptine" ? comptinePrompts : storyPrompts;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompts[language] || prompts.fr,
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
    const lang = req.query.lang || "fr";
    const file = new File([req.body], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: lang,
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

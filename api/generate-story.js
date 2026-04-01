import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { context, duration = 60, age = 4, language = "fr" } = req.body;
  if (!context) return res.status(400).json({ error: "Contexte manquant" });

  const wordsPerMinute = 130;
  const targetWords = Math.round((duration / 60) * wordsPerMinute);
  const maxTokens = Math.max(500, Math.round(targetWords * 2));

  const prompts = {
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
}

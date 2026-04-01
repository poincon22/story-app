import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { context, duration = 60 } = req.body;
  if (!context) return res.status(400).json({ error: "Contexte manquant" });

  const wordsPerMinute = 130;
  const targetWords = Math.round((duration / 60) * wordsPerMinute);
  const maxTokens = Math.max(500, Math.round(targetWords * 2));

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: `Tu es un conteur pour enfants de 5 ans. Ecris une histoire d'environ ${targetWords} mots basee sur ce contexte : "${context}".

Regles :
- L'histoire doit faire environ ${targetWords} mots (c'est important, respecte cette longueur)
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
}

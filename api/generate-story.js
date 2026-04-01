import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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
}

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { story, instructions, language = "fr" } = req.body;
  if (!story || !instructions) return res.status(400).json({ error: "Histoire et instructions requises" });

  const prompts = {
    fr: `Voici une histoire pour enfants :

"""
${story}
"""

L'utilisateur souhaite les modifications suivantes : "${instructions}"

Reecris l'histoire en appliquant ces modifications. Garde le meme style, la meme longueur approximative et le meme niveau de langage. Ecris UNIQUEMENT l'histoire modifiee, sans titre ni commentaire.`,
    en: `Here is a children's story:

"""
${story}
"""

The user wants the following changes: "${instructions}"

Rewrite the story applying these changes. Keep the same style, approximate length, and language level. Write ONLY the modified story, no title or commentary.`,
  };

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompts[language] || prompts.fr,
        },
      ],
    });

    const refined = message.content[0].text;
    res.json({ story: refined });
  } catch (err) {
    console.error("Refine story error:", err.message);
    res.status(500).json({ error: "Erreur lors de la modification de l'histoire" });
  }
}

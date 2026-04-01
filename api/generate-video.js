import Anthropic from "@anthropic-ai/sdk";
import RunwayML from "@runwayml/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const runway = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { context, age = 4, language = "fr" } = req.body;
  if (!context) return res.status(400).json({ error: "Contexte manquant" });

  try {
    // Step 1: Generate story split into scenes
    const prompt = language === "fr"
      ? `Tu es un scenariste de films pour enfants de ${age} ans. A partir de ce contexte : "${context}", ecris une courte histoire en exactement 4 scenes.

Pour chaque scene, fournis :
- "narration": le texte raconte a voix haute (2-3 phrases simples)
- "visual": une description visuelle detaillee EN ANGLAIS pour generer une video (decor, personnages, actions, style "colorful cartoon for children")

Reponds UNIQUEMENT en JSON valide, sans commentaire :
[{"narration":"...","visual":"..."},{"narration":"...","visual":"..."},{"narration":"...","visual":"..."},{"narration":"...","visual":"..."}]`
      : `You are a film screenwriter for ${age}-year-old children. From this context: "${context}", write a short story in exactly 4 scenes.

For each scene, provide:
- "narration": the text to be read aloud (2-3 simple sentences)
- "visual": a detailed visual description in English for video generation (setting, characters, actions, style "colorful cartoon for children")

Respond ONLY with valid JSON, no commentary:
[{"narration":"...","visual":"..."},{"narration":"...","visual":"..."},{"narration":"...","visual":"..."},{"narration":"...","visual":"..."}]`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].text;
    const scenes = JSON.parse(text);

    // Step 2: Start all video generations in parallel
    const videoTasks = await Promise.all(
      scenes.map(async (scene) => {
        const task = await runway.imageToVideo.create({
          model: "gen4_turbo",
          promptText: scene.visual,
          ratio: "1280:720",
          duration: 5,
        });
        return { taskId: task.id, narration: scene.narration };
      })
    );

    res.json({ scenes: videoTasks });
  } catch (err) {
    console.error("Video generation error:", err.message);
    res.status(500).json({ error: "Erreur lors de la generation du film" });
  }
}

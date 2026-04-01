const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_BASE_URL = "https://api.sunoapi.org";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { context, language = "fr", age = 4 } = req.body;
  if (!context) return res.status(400).json({ error: "Contexte manquant" });

  const prompt = language === "fr"
    ? `Une comptine joyeuse pour enfant de ${age} ans sur le theme : ${context}`
    : `A cheerful nursery rhyme for a ${age}-year-old child about: ${context}`;

  const style = language === "fr"
    ? "comptine pour enfants, joyeux, acoustique, voix douce feminine, francais"
    : "children nursery rhyme, cheerful, acoustic, soft female voice, english";

  try {
    const genRes = await fetch(`${SUNO_BASE_URL}/api/v1/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customMode: false,
        instrumental: false,
        model: "V4_5ALL",
        prompt,
        style,
        callBackUrl: "https://example.com/callback",
      }),
    });

    const genData = await genRes.json();
    if (genData.code !== 200) throw new Error(genData.msg || "Suno generation failed");

    res.json({ taskId: genData.data.taskId });
  } catch (err) {
    console.error("Suno start error:", err.message);
    res.status(500).json({ error: "Erreur lors du lancement de la chanson" });
  }
}

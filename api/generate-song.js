const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_BASE_URL = "https://api.sunoapi.org";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, language = "fr" } = req.body;
  if (!text) return res.status(400).json({ error: "Texte manquant" });

  const style = language === "fr"
    ? "comptine pour enfants, joyeux, acoustique, voix douce feminine"
    : "children nursery rhyme, cheerful, acoustic, soft female voice";

  try {
    const genRes = await fetch(`${SUNO_BASE_URL}/api/v1/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customMode: true,
        instrumental: false,
        model: "V4_5ALL",
        style,
        title: "Comptine",
        prompt: text,
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

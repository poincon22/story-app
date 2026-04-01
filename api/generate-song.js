const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_BASE_URL = "https://api.sunoapi.org";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { context, language = "fr", age = 4 } = req.body;
  if (!context) return res.status(400).json({ error: "Contexte manquant" });

  const prompt = language === "fr"
    ? `Une comptine chantee joyeuse pour un enfant de ${age} ans. Le theme est : ${context}. Vocabulaire simple et adapte a un enfant de ${age} ans, melodie entrainante et facile a retenir, paroles en francais.`
    : `A cheerful sung nursery rhyme for a ${age}-year-old child. The theme is: ${context}. Simple vocabulary appropriate for a ${age}-year-old, catchy and easy to remember melody, lyrics in English.`;

  const style = language === "fr"
    ? "comptine pour enfants, joyeux, acoustique, voix douce, francais, melodie simple"
    : "children nursery rhyme, cheerful, acoustic, soft voice, english, simple melody";

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

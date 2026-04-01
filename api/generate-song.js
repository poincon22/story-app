const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_BASE_URL = "https://api.sunoapi.org";

async function generateSunoSong(lyrics, language) {
  const style = language === "fr"
    ? "comptine pour enfants, joyeux, acoustique, voix douce feminine"
    : "children nursery rhyme, cheerful, acoustic, soft female voice";

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
      prompt: lyrics,
    }),
  });

  const genData = await genRes.json();
  if (genData.code !== 200) throw new Error(genData.msg || "Suno generation failed");
  const taskId = genData.data.taskId;

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));

    const statusRes = await fetch(
      `${SUNO_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`,
      { headers: { Authorization: `Bearer ${SUNO_API_KEY}` } }
    );
    const statusData = await statusRes.json();
    const status = statusData.data?.status;

    if (status === "SUCCESS") {
      const songs = statusData.data.response?.data || [];
      if (songs.length > 0 && songs[0].audio_url) {
        return songs[0].audio_url;
      }
      throw new Error("No audio URL in Suno response");
    }
    if (status === "FAILED") {
      throw new Error("Suno generation failed");
    }
  }
  throw new Error("Suno generation timeout");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, language = "fr" } = req.body;
  if (!text) return res.status(400).json({ error: "Texte manquant" });

  try {
    const audioUrl = await generateSunoSong(text, language);
    res.json({ audioUrl });
  } catch (err) {
    console.error("Suno error:", err.message);
    res.status(500).json({ error: "Erreur lors de la generation de la chanson" });
  }
}

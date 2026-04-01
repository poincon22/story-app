const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_BASE_URL = "https://api.sunoapi.org";

export default async function handler(req, res) {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: "taskId manquant" });

  try {
    const statusRes = await fetch(
      `${SUNO_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`,
      { headers: { Authorization: `Bearer ${SUNO_API_KEY}` } }
    );
    const statusData = await statusRes.json();
    const status = statusData.data?.status;

    if (status === "SUCCESS") {
      const songs = statusData.data.response?.sunoData || [];
      if (songs.length > 0 && songs[0].audioUrl) {
        return res.json({ status: "SUCCESS", audioUrl: songs[0].audioUrl });
      }
      return res.json({ status: "FAILED" });
    }

    res.json({ status: status || "PENDING" });
  } catch (err) {
    console.error("Suno poll error:", err.message);
    res.status(500).json({ error: "Erreur lors de la verification" });
  }
}

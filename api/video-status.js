import RunwayML from "@runwayml/sdk";

const runway = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

export default async function handler(req, res) {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: "taskId manquant" });

  try {
    const task = await runway.tasks.retrieve(taskId);

    if (task.status === "SUCCEEDED") {
      return res.json({ status: "SUCCESS", videoUrl: task.output[0] });
    }
    if (task.status === "FAILED") {
      return res.json({ status: "FAILED" });
    }

    res.json({ status: "PENDING", progress: task.progress || 0 });
  } catch (err) {
    console.error("Video status error:", err.message);
    res.status(500).json({ error: "Erreur lors de la verification" });
  }
}

const VOICES = [
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
  { id: "fable", name: "Fable" },
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "onyx", name: "Onyx" },
];

export default function handler(req, res) {
  res.json({ voices: VOICES });
}

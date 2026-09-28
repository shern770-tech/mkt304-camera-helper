
const STUDY_GUIDE = require("./study-guide");

function extractText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const c of item.content || []) {
      if (typeof c.text === "string") chunks.push(c.text);
    }
  }
  return chunks.join("\n");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured." });
    return;
  }

  const image = req.body?.image;
  if (!image || !image.startsWith("data:image/")) {
    res.status(400).json({ error: "Missing camera image." });
    return;
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.6-sol";

  const prompt = `
You are answering an instructor-authorized MKT 304 multiple-choice question.
Read the question and all visible A/B/C/D choices in the image.

Use ONLY the source guide below as the course-specific authority.
If the image is unreadable, any answer choice is cut off, or the guide does not support
a confident answer, return ?.

Return EXACTLY ONE CHARACTER: A, B, C, D, or ?
No explanation. No punctuation. No markdown.

SOURCE GUIDE:
${STUDY_GUIDE}
`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    const api = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: image }
          ]
        }],
        max_output_tokens: 8
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    const data = await api.json();

    if (!api.ok) {
      res.status(api.status).json({ error: data?.error?.message || "OpenAI API request failed." });
      return;
    }

    const raw = extractText(data).trim().toUpperCase();
    const match = raw.match(/[ABCD?]/);
    res.status(200).json({ answer: match ? match[0] : "?" });
  } catch (err) {
    const message = err && err.name === "AbortError"
      ? "OpenAI request timed out."
      : "Server error while answering the image.";
    res.status(500).json({ error: message });
  }
};

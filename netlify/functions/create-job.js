// netlify/functions/create-job.js

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const LTX_API_BASE = process.env.LTX_API_BASE || "https://api.ltx.video";
const LTX_API_KEY = process.env.LTX_API_KEY;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { message: "Method not allowed" });
  }

  if (!LTX_API_KEY) {
    return json(500, { message: "Missing LTX_API_KEY in environment" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { audioUrl, style, vibe } = body;

    if (!audioUrl || !style) {
      return json(400, { message: "audioUrl and style are required" });
    }

    // Build prompt from style + vibe
    const promptParts = [];
    if (style === "anime_city") {
      promptParts.push(
        "Neon anime city at night, cinematic lighting, rain, reflections, moody atmosphere"
      );
    } else if (style === "cyberpunk_heist") {
      promptParts.push(
        "Gritty cyberpunk heist, futuristic skyscrapers, glowing signage, fast cuts, tense mood"
      );
    } else if (style === "dreamscape") {
      promptParts.push(
        "Soft dreamscape, floating islands, pastel colors, slow flowing camera moves"
      );
    } else if (style === "abstract") {
      promptParts.push(
        "Abstract audio visualizer, fluid shapes, bright trails, beat-synced pulses"
      );
    }
    if (vibe && vibe.trim().length > 0) {
      promptParts.push(vibe.trim());
    }
    const prompt = promptParts.join(". ");

    // Payload for LTX audio-to-video /v1/audio-to-video
    // Adjust the field names to match the LTX docs exactly.
    const payload = {
      audio_url: audioUrl,
      prompt,
      duration: 20, // seconds; you can adjust later
      aspect_ratio: "16:9",
    };

    const res = await fetch(`${LTX_API_BASE}/v1/audio-to-video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LTX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("LTX create error:", res.status, text);
      return json(500, { message: "Failed to create LTX job" });
    }

    const data = await res.json();
    // Guessing a common pattern: { id: "job_id", status: "pending" }
    const jobId = data.id || data.job_id;

    if (!jobId) {
      console.error("Unexpected LTX response:", data);
      return json(500, { message: "Missing job id from LTX" });
    }

    return json(200, { jobId });
  } catch (err) {
    console.error("create-job error:", err);
    return json(500, { message: "Internal server error" });
  }
};

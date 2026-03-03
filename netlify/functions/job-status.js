// netlify/functions/job-status.js

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
  const params = event.queryStringParameters || {};
  const jobId = params.jobId;

  if (!jobId) {
    return json(400, { status: "ERROR", message: "Missing jobId" });
  }

  if (!LTX_API_KEY) {
    return json(500, { status: "ERROR", message: "Missing LTX_API_KEY" });
  }

  try {
    const res = await fetch(
      `${LTX_API_BASE}/v1/audio-to-video/${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LTX_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("LTX status error:", res.status, text);
      return json(500, {
        status: "ERROR",
        message: "Failed to fetch LTX status",
      });
    }

    const data = await res.json();
    // We need to align with LTX's actual schema.
    // We'll assume something like:
    // { status: "pending"|"running"|"succeeded"|"failed", video_url?: "..." }

    const ltxStatus = (data.status || "").toLowerCase();

    if (
      ltxStatus === "pending" ||
      ltxStatus === "running" ||
      ltxStatus === "processing"
    ) {
      return json(200, { status: "PROCESSING" });
    }

    if (ltxStatus === "failed" || ltxStatus === "error") {
      return json(200, {
        status: "ERROR",
        message: data.error || "LTX job failed",
      });
    }

    if (
      ltxStatus === "succeeded" ||
      ltxStatus === "completed" ||
      ltxStatus === "ready"
    ) {
      const videoUrl =
        data.video_url || data.result_url || data.output_url;

      if (!videoUrl) {
        console.error("No video URL in completed LTX job:", data);
        return json(500, {
          status: "ERROR",
          message: "Job completed but no video URL found",
        });
      }

      return json(200, {
        status: "READY",
        videoUrl,
      });
    }

    // Unknown status – keep polling
    return json(200, { status: "PROCESSING" });
  } catch (err) {
    console.error("job-status error:", err);
    return json(500, { status: "ERROR", message: "Internal server error" });
  }
};

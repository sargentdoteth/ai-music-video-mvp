import React, { useState, useEffect } from "react";

const STATUS = {
  IDLE: "IDLE",
  UPLOADING: "UPLOADING",
  PROCESSING: "PROCESSING",
  READY: "READY",
  ERROR: "ERROR",
};

const STYLE_PRESETS = [
  { value: "anime_city", label: "Neon Anime City" },
  { value: "cyberpunk_heist", label: "Cyberpunk Heist" },
  { value: "dreamscape", label: "Soft Dreamscape" },
  { value: "abstract", label: "Abstract Visualizer" },
];

function App() {
  const [file, setFile] = useState(null);
  const [style, setStyle] = useState(STYLE_PRESETS[0].value);
  const [vibe, setVibe] = useState("");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [jobId, setJobId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState("");

  // Poll job status when we have a jobId
  useEffect(() => {
    if (!jobId || status !== STATUS.PROCESSING) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/.netlify/functions/job-status?jobId=${encodeURIComponent(jobId)}`
        );
        const data = await res.json();
        if (data.status === "READY") {
          setVideoUrl(data.videoUrl);
          setStatus(STATUS.READY);
          clearInterval(interval);
        } else if (data.status === "ERROR") {
          setError(data.message || "Something went wrong.");
          setStatus(STATUS.ERROR);
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setVideoUrl(null);

    if (!file) {
      setError("Please upload a song file first.");
      return;
    }

    try {
      setStatus(STATUS.UPLOADING);

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("style", style);
      formData.append("vibe", vibe);

      const res = await fetch("/.netlify/functions/create-job", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to start generation.");
      }

      const data = await res.json();
      setJobId(data.jobId);
      setStatus(STATUS.PROCESSING);
    } catch (err) {
      console.error(err);
      setError("Could not start generation. Please try again.");
      setStatus(STATUS.ERROR);
    }
  };

  const isBusy =
    status === STATUS.UPLOADING || status === STATUS.PROCESSING;

  const statusText = (() => {
    switch (status) {
      case STATUS.UPLOADING:
        return "Uploading your song…";
      case STATUS.PROCESSING:
        return "Creating your cinematic video…";
      case STATUS.READY:
        return "Your video is ready!";
      case STATUS.ERROR:
        return "Error";
      default:
        return "Idle";
    }
  })();

  return (
    <div className="app-container">
      <div className="card">
        <h1>AI Music Video (MVP)</h1>
        <p className="subtitle">
          Upload a short song, pick a style, and get a cinematic video mock.
        </p>

        <div className="status-pill">
          <span className="status-dot" />
          {statusText}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="label">Song file</div>
            <input
              type="file"
              accept="audio/*"
              className="input-file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="small">
              For MVP, keep under ~60–90 seconds for best speed.
            </div>
          </div>

          <div className="input-group">
            <div className="label">Style</div>
            <select
              className="select"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              {STYLE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <div className="label">Vibe (optional)</div>
            <textarea
              className="textarea"
              placeholder="e.g. lonely hero walking through neon rain, slow camera moves…"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
            />
          </div>

          {error && (
            <div className="small" style={{ color: "#f97373" }}>
              {error}
            </div>
          )}

          <button className="button" type="submit" disabled={isBusy}>
            {isBusy ? "Working…" : "Generate mock video"}
          </button>
        </form>

        {videoUrl && (
          <div className="video-wrapper">
            <video controls src={videoUrl} />
          </div>
        )}

        <p className="small" style={{ marginTop: 12 }}>
          This is an MVP demo using a mocked generator. In production, this
          will call a real AI video API.
        </p>
      </div>
    </div>
  );
}

export default App;

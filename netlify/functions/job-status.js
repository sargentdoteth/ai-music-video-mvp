exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const jobId = params.jobId;

  if (!jobId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ status: "ERROR", message: "Missing jobId" }),
    };
  }

  // Since we're not using a DB, we'll fake timing based on the timestamp in jobId.
  // jobId format: job_<timestamp>_<rand>
  const parts = jobId.split("_");
  const createdAt = Number(parts[1]) || Date.now();
  const elapsed = Date.now() - createdAt;

  // Ready after ~15 seconds
  const isReady = elapsed > 15000;

  if (!isReady) {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: "PROCESSING" }),
    };
  }

  // Demo video URL – replace with your own hosted sample if you like
  const demoVideoUrl =
    "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4";

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "READY",
      videoUrl: demoVideoUrl,
    }),
  };
};

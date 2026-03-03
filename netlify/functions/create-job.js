exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  // In a real app, you'd parse FormData and upload the audio somewhere.
  // Netlify Functions don't parse multipart by default, so for MVP we'll
  // just pretend and create a job ID.

  const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  // You could store job state in a DB; for now we just encode a "ready time".
  const readyAt = Date.now() + 15000; // 15 seconds from now

  return {
    statusCode: 200,
    body: JSON.stringify({ jobId, readyAt }),
  };
};

import express from "express";

const router = express.Router();

// Use environment variable in production  for the deployment mlService ,
// Use the localhost when using the main mlService 
const ML_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "No text provided" });
    }

    console.log("Calling ML service at:", `${ML_URL}/predict`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 sec (3 min) for first request

    const mlResponse = await fetch(`${ML_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!mlResponse.ok) {
      throw new Error(`ML service returned ${mlResponse.status}`);
    }

    const mlData = await mlResponse.json();

    let structure =
      mlData.prediction === "Real"
        ? "Well-structured"
        : "Poorly-structured";

    let confidence = Math.round((mlData.confidence || 0) * 100);

    return res.json({
      structure,
      confidence,
      factCheck: mlData.factCheck || {
        verdict: "INSUFFICIENT_INFORMATION",
        reason: "Not available"
      }
    });

  } catch (error) {
    console.error("ML Service Error:", error.message);

    return res.status(500).json({
      message: "ML service unavailable",
      error: error.message
    });
  }
});

export default router;
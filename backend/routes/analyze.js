import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "No text provided" });
    }

    // Structure check from Python ML
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const mlResponse = await fetch("http://127.0.0.1:8000/predict", {
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
      
      let structure = mlData.prediction === "Real" ? "Well-structured" : "Poorly-structured";
      let confidence = Math.round(mlData.confidence * 100);
      
      // Scale confidence to make it more readable (optional)
      if (confidence < 70) {
        confidence = Math.min(confidence + 15, 85);
      }
      
      return res.json({ 
        structure, 
        confidence,
        factCheck: mlData.factCheck || { verdict: 'INSUFFICIENT_INFORMATION', reason: 'Not available' }
      });
      
    } catch (mlError) {
      console.log('Python API error:', mlError.message);
      return res.status(500).json({ message: "ML service unavailable: " + mlError.message });
    }

  } catch (error) {
    console.error("Analysis Error:", error.message);
    return res.status(500).json({ message: "Error analyzing article" });
  }
});

export default router;

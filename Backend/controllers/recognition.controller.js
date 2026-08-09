import { recognizeFace } from "../services/recognition.service.js";

export const recognizeVisitor = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const result = await recognizeFace(req.file.path);

    if (!result.faceDetected) {
      return res.status(200).json({ success: false, message: "No face detected" });
    }

    if (req.query.verbose === "true") {
      return res.json({
        success: true,
        status: result.known ? "known" : "unknown",
        person: result.name,
        confidence: result.confidence,
      });
    }

    // ESP32-friendly response: keep this intentionally small and easy to parse.
    if (result.known) {
      return res.json({ known: true, name: result.name });
    }

    return res.json({ known: false });
  } catch (error) {
    // If the face models or native TF bindings are not available,
    // return a 503 with a clear action for the operator.
    const msg = error && error.message ? String(error.message).toLowerCase() : "";
    if (
      msg.includes("models") ||
      msg.includes("not loaded") ||
      msg.includes("tfjs") ||
      msg.includes("could not be found") ||
      msg.includes("binding")
    ) {
      return res.status(503).json({
        success: false,
        error: "Face recognition models or native bindings are not ready. Run `npm run download:models` and restart the server.",
      });
    }

    return next(error);
  }
};

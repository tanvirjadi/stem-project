import { Router } from "express";
import { recognizeVisitor } from "../controllers/recognition.controller.js";
import { uploadIncomingImage } from "../services/upload.service.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const incomingDir = path.join(projectRoot, "uploads", "incoming");

const router = Router();

// Middleware: accept JSON `{ image: '<data-url-or-base64>' }` and convert to a file
const handleBase64Json = async (req, res, next) => {
	try {
		if (req.is("application/json") && req.body && req.body.image) {
			await fs.mkdir(incomingDir, { recursive: true });

			const raw = req.body.image;
			// If data URL, extract metadata and base64 payload
			const dataUrlMatch = String(raw).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
			const mime = dataUrlMatch ? dataUrlMatch[1] : "image/jpeg";
			const base64 = dataUrlMatch ? dataUrlMatch[2] : raw;
			const ext = (mime.split("/")[1] || "jpeg").replace("jpeg", "jpg");

			const fileName = `visitor-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
			const filePath = path.join(incomingDir, fileName);

			const buffer = Buffer.from(base64, "base64");
			await fs.writeFile(filePath, buffer);

			// Provide a minimal `req.file` shape expected by the controller
			req.file = {
				path: filePath,
				mimetype: mime,
				originalname: fileName,
				filename: fileName,
				size: buffer.length,
			};
		}
		return next();
	} catch (err) {
		return next(err);
	}
};

// ESP32-CAM integration point:
// - Multipart/form-data with field name "image" (handled by multer)
// - Or application/json with `{ image: '<base64 or data-url>' }` (handled by handleBase64Json)
router.post("/", handleBase64Json, uploadIncomingImage.single("image"), recognizeVisitor);

export default router;

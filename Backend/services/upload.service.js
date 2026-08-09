import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const incomingDir = path.join(projectRoot, "uploads", "incoming");

fs.mkdirSync(incomingDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, incomingDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg").toLowerCase() || ".jpg";
    cb(null, `visitor-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const imageOnly = (req, file, cb) => {
  if (!file.mimetype?.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  return cb(null, true);
};

export const uploadIncomingImage = multer({
  storage,
  fileFilter: imageOnly,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  },
});

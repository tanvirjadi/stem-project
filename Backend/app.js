import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import recognizeRoutes from "./routes/recognize.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const jsonLimit = process.env.MAX_JSON_BYTES || "10mb";
const urlencodedLimit = process.env.MAX_URLENCODED_BYTES || "10mb";

app.use(cors());
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: urlencodedLimit }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/recognize", recognizeRoutes);

// Local image files stay private to this backend. Do not expose uploads/trusted.
app.use("/incoming", express.static(path.join(__dirname, "uploads", "incoming")));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error.name === "MulterError") {
    return res.status(400).json({ error: error.message });
  }

  if (error.message?.includes("Only image files")) {
    return res.status(400).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;

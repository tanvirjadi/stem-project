import dotenv from "dotenv";
import app from "../app.js";
import { loadFaceModels } from "./services/faceRecognition.service.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

const start = async () => {
  await loadFaceModels();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ESP32-CAM security server running on http://0.0.0.0:${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

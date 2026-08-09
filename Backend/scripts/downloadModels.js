import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const modelDir = process.env.FACE_MODEL_PATH
  ? path.resolve(process.env.FACE_MODEL_PATH)
  : path.join(projectRoot, "models");

const baseUrl = "https://raw.githubusercontent.com/vladmandic/face-api/master/model";
const manifests = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "face_landmark_68_model-weights_manifest.json",
  "face_recognition_model-weights_manifest.json",
  // Tiny face detector helps with small/low-quality captures
  "tiny_face_detector_model-weights_manifest.json",
];

const download = async (fileName) => {
  const response = await fetch(`${baseUrl}/${fileName}`);
  if (!response.ok) {
    throw new Error(`Failed to download ${fileName}: ${response.status}`);
  }
  await fs.writeFile(path.join(modelDir, fileName), Buffer.from(await response.arrayBuffer()));
  console.log(`Downloaded ${fileName}`);
};

const main = async () => {
  await fs.mkdir(modelDir, { recursive: true });

  const weightFiles = new Set();
  for (const manifest of manifests) {
    await download(manifest);
    const content = JSON.parse(await fs.readFile(path.join(modelDir, manifest), "utf8"));
    for (const group of content) {
      for (const weightFile of group.paths || []) {
        weightFiles.add(weightFile);
      }
    }
  }

  for (const weightFile of weightFiles) {
    await download(weightFile);
  }

  console.log(`Models saved to ${modelDir}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

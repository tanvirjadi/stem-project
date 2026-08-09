import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure global require is available for ESM context (needed for face-api loadFromDisk)
if (typeof globalThis.require === "undefined") {
  globalThis.require = createRequire(import.meta.url);
}
// Polyfill __dirname and __filename on globalThis to avoid ReferenceError in WASM backend init
if (typeof globalThis.__filename === "undefined") globalThis.__filename = __filename;
if (typeof globalThis.__dirname === "undefined") globalThis.__dirname = __dirname;

import fs from "fs/promises";
import { writeFile as writeFileSync } from "fs";
import { dirname } from "path";

const projectRoot = path.join(__dirname, "..");

const modelPath = process.env.FACE_MODEL_PATH
  ? path.resolve(process.env.FACE_MODEL_PATH)
  : path.join(projectRoot, "models");

let faceapi = null;
let canvasApi = null;
let modelsReady = false;

export const loadFaceModels = async () => {
  try {
    // Load the TFJS pure-JS backend (avoid native binaries on this environment)
    const tf = await import('@tensorflow/tfjs');

    // Force TFJS to use browser platform path internally in face-api.esm.js
    // to bypass the empty Node.js 'util' shim error (this.util.TextEncoder is not a constructor)
    tf.env().set('IS_BROWSER', true);

    // Wait for the environment and default backend (CPU) to prepare
    await tf.ready();

    canvasApi = await import("canvas");
    faceapi = await import("@vladmandic/face-api/dist/face-api.esm.js");

    const { Canvas, Image, ImageData } = canvasApi.default || canvasApi;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    // Tiny face detector can help with difficult / small faces
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);

    modelsReady = true;
    console.log(`Face recognition models loaded from ${modelPath}`);
  } catch (error) {
    modelsReady = false;
    console.warn("Face recognition models are not ready:", error.message);
    console.warn("Run npm run download:models, then restart the server.");
  }
};

export const extractEmbedding = async (imagePath) => {
  if (!modelsReady) {
    throw new Error("Face recognition models are not loaded");
  }

  const canvas = canvasApi.default || canvasApi;
  const imageBuffer = await fs.readFile(imagePath);
  const image = await canvas.loadImage(imageBuffer);
  // Preprocess: resize image to a reasonable max dimension to improve detection
  // Increased from 800 to 1024 to preserve detail for small/distant faces
  const maxDim = Number(process.env.FACE_MAX_DIM || 1024);
  const { width: origW, height: origH } = image;
  let targetW = origW;
  let targetH = origH;
  if (Math.max(origW, origH) > maxDim) {
    const scale = maxDim / Math.max(origW, origH);
    targetW = Math.round(origW * scale);
    targetH = Math.round(origH * scale);
  }

  const canvasEl = canvas.createCanvas(targetW, targetH);
  const ctx = canvasEl.getContext("2d");
  ctx.drawImage(image, 0, 0, targetW, targetH);

  const debugDir = path.join(projectRoot, "uploads", "debug");

  const autoContrast = (canvasIn) => {
    const c = canvasIn;
    const ctx2 = c.getContext("2d");
    const imgd = ctx2.getImageData(0, 0, c.width, c.height);
    const data = imgd.data;
    let min = 255;
    let max = 0;
    for (let i = 0; i < data.length; i += 4) {
      // luminance
      const l = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
      if (l < min) min = l;
      if (l > max) max = l;
    }
    const range = max - min || 1;
    for (let i = 0; i < data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        data[i + ch] = Math.max(0, Math.min(255, Math.round(((data[i + ch] - min) * 255) / range)));
      }
    }
    ctx2.putImageData(imgd, 0, 0);
    return c;
  };

  const flipHorizontal = (canvasIn) => {
    const c = canvas.createCanvas(canvasIn.width, canvasIn.height);
    const ctx2 = c.getContext("2d");
    ctx2.scale(-1, 1);
    ctx2.drawImage(canvasIn, -canvasIn.width, 0);
    return c;
  };

  const rotateCanvas = (canvasIn, degrees) => {
    const radians = (degrees * Math.PI) / 180;
    const w = canvasIn.width;
    const h = canvasIn.height;
    const c = canvas.createCanvas(w, h);
    const ctx2 = c.getContext("2d");
    ctx2.translate(w / 2, h / 2);
    ctx2.rotate(radians);
    ctx2.drawImage(canvasIn, -w / 2, -h / 2, w, h);
    return c;
  };

  // Debug info
  console.debug(`Loaded ${imagePath} original=${origW}x${origH} resized=${targetW}x${targetH} bytes=${imageBuffer.length}`);

  // Enhanced detection strategy: Try multiple detectors with progressively lower thresholds
  try {
    // Create multiple image variants for robustness
    const variants = [
      canvasEl,
      autoContrast(canvasEl),
      flipHorizontal(canvasEl),
      autoContrast(flipHorizontal(canvasEl))
    ];

    let detection = null;

    // Strategy: Try each variant with multiple detection approaches
    for (let variantIdx = 0; variantIdx < variants.length && !detection; variantIdx++) {
      const variant = variants[variantIdx];

      // Attempt 1: SSD Mobilenet with standard confidence
      const ssdPrimary = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
      detection = await faceapi.detectSingleFace(variant, ssdPrimary).withFaceLandmarks().withFaceDescriptor();
      if (detection) {
        console.debug(`✓ Detected with SSD(0.5) on variant ${variantIdx} for ${imagePath}`);
        break;
      }

      // Attempt 2: SSD Mobilenet with lower confidence for small/distant faces
      const ssdLower = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 });
      detection = await faceapi.detectSingleFace(variant, ssdLower).withFaceLandmarks().withFaceDescriptor();
      if (detection) {
        console.debug(`✓ Detected with SSD(0.25) on variant ${variantIdx} for ${imagePath}`);
        break;
      }

      // Attempt 3: SSD Mobilenet with very low confidence
      const ssdAggressive = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 });
      detection = await faceapi.detectSingleFace(variant, ssdAggressive).withFaceLandmarks().withFaceDescriptor();
      if (detection) {
        console.debug(`✓ Detected with SSD(0.1) on variant ${variantIdx} for ${imagePath}`);
        break;
      }

      // Attempt 4: TinyFaceDetector (designed for small/distant faces)
      // Try multiple input sizes for flexibility
      for (const inputSize of [416, 320, 208]) {
        const tinyOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize,
          scoreThreshold: 0.25
        });
        detection = await faceapi.detectSingleFace(variant, tinyOptions).withFaceLandmarks().withFaceDescriptor();
        if (detection) {
          console.debug(`✓ Detected with TinyFaceDetector(size=${inputSize},score=0.25) on variant ${variantIdx} for ${imagePath}`);
          break;
        }
      }
      if (detection) break;

      // Attempt 5: TinyFaceDetector with even lower threshold for very difficult cases
      for (const inputSize of [416, 320, 208]) {
        const tinyAggressive = new faceapi.TinyFaceDetectorOptions({
          inputSize,
          scoreThreshold: 0.1
        });
        detection = await faceapi.detectSingleFace(variant, tinyAggressive).withFaceLandmarks().withFaceDescriptor();
        if (detection) {
          console.debug(`✓ Detected with TinyFaceDetector(size=${inputSize},score=0.1) on variant ${variantIdx} for ${imagePath}`);
          break;
        }
      }
      if (detection) break;
    }

    if (!detection) {
      try {
        // Save debug image for inspection
        await fs.mkdir(debugDir, { recursive: true });
        const outPath = path.join(debugDir, path.basename(imagePath));
        const buf = canvasEl.toBuffer ? canvasEl.toBuffer('image/jpeg', { quality: 0.8 }) : null;
        if (buf) writeFileSync(outPath, buf);
        console.warn(`All detection strategies failed for ${imagePath}. Saved debug copy to ${outPath}`);
      } catch (e) {
        console.warn(`Failed to save debug image for ${imagePath}: ${e.message || e}`);
      }
      return null;
    }

    return Array.from(detection.descriptor);
  } catch (err) {
    console.error(`Error during face detection for ${imagePath}:`, err.message || err);
    return null;
  }
};

export const euclideanDistance = (a, b) => {
  if (a.length !== b.length) {
    throw new Error("Face embeddings have different dimensions");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
};

export const distanceToConfidence = (distance) => {
  return Number(Math.max(0, Math.min(1, 1 - distance)).toFixed(2));
};

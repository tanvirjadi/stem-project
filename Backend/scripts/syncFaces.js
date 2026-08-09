import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import readline from "node:readline/promises";
import process from "node:process";
import crypto from "node:crypto";
import prisma from "../services/prisma.service.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const trustedDir = path.join(projectRoot, "uploads", "trusted");

const mimeByExtension = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const statusOptions = ["ADULT", "CHILD", "HOMEOWNER", "VISITOR", "OTHER"];

const toName = (fileName) => {
  const baseName = path.basename(fileName, path.extname(fileName));
  return baseName
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const askInput = async (reader, question, defaultValue = "") => {
  const defaultHint = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await reader.question(`${question}${defaultHint}: `);
  return answer.trim() || defaultValue;
};

const askYesNo = async (reader, question, defaultValue = true) => {
  const defaultHint = defaultValue ? " [Y/n]" : " [y/N]";
  const answer = (await reader.question(`${question}${defaultHint}: `)).trim().toLowerCase();
  if (answer === "" ) return defaultValue;
  return answer === "y" || answer === "yes";
};

const askStatus = async (reader, defaultValue = "OTHER") => {
  const label = statusOptions.join("/");
  while (true) {
    const answer = await askInput(reader, `Status (${label})`, defaultValue);
    if (statusOptions.includes(answer.toUpperCase())) {
      return answer.toUpperCase();
    }
    console.log(`Invalid status. Choose one of: ${statusOptions.join(", ")}`);
  }
};

const main = async () => {
  await fs.mkdir(trustedDir, { recursive: true });

  const files = await fs.readdir(trustedDir);
  const imageFiles = files.filter((file) => mimeByExtension[path.extname(file).toLowerCase()]);

  if (imageFiles.length === 0) {
    console.log("No trusted face images found in uploads/trusted.");
    return;
  }

  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    for (const fileName of imageFiles) {
      const fullPath = path.join(trustedDir, fileName);
      const displayName = toName(fileName);
      const [firstNameGuess, ...lastNameParts] = displayName.split(" ");
      const defaultFirstName = firstNameGuess || "";
      const defaultLastName = lastNameParts.join(" ") || "";
      const defaultMime = mimeByExtension[path.extname(fileName).toLowerCase()] || "";

      console.log("\nSyncing image:", fileName);
      console.log("Default name:", displayName || "(none)");

      const firstName = await askInput(reader, "First name", defaultFirstName);
      const lastName = await askInput(reader, "Last name", defaultLastName);
      const email = await askInput(reader, "Email", "");
      const plainPassword = await askInput(reader, "Password", "");
      const hponeNumber = await askInput(reader, "Phone number", "");
      const status = await askStatus(reader, "OTHER");
      const active = await askYesNo(reader, "Active", true);
      const imageMimetype = await askInput(reader, "Image MIME type", defaultMime);

      const password = plainPassword
        ? crypto.createHash("sha256").update(plainPassword).digest("hex")
        : null;

      await prisma.trustedFace.upsert({
        where: { image: fullPath },
        update: {
          firstName,
          lastName: lastName || null,
          email: email || null,
          password,
          hponeNumber: hponeNumber || null,
          imageMimetype: imageMimetype || null,
          status,
          active,
        },
        create: {
          firstName,
          lastName: lastName || null,
          email: email || null,
          password,
          hponeNumber: hponeNumber || null,
          image: fullPath,
          imageMimetype: imageMimetype || null,
          status,
          active,
        },
      });

      console.log(`Synced ${fileName} as ${firstName}${lastName ? ` ${lastName}` : ""}`);
    }

    console.log(`\nDone. Synced ${imageFiles.length} trusted face image(s).`);
  } finally {
    reader.close();
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

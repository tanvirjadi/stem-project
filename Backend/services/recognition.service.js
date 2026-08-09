import prisma from "./prisma.service.js";
import {
  distanceToConfidence,
  euclideanDistance,
  extractEmbedding,
} from "./faceRecognition.service.js";

const threshold = () => Number(process.env.FACE_MATCH_THRESHOLD || 0.6);

export const recognizeFace = async (incomingImagePath) => {
  const visitorEmbedding = await extractEmbedding(incomingImagePath);

  if (!visitorEmbedding) {
    return { faceDetected: false };
  }

  const trustedFaces = await prisma.trustedFace.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  let bestMatch = null;
  let bestDistance = Infinity;

  for (const trustedFace of trustedFaces) {
    const trustedEmbedding = await extractEmbedding(trustedFace.image);

    if (!trustedEmbedding) {
      continue;
    }

    const distance = euclideanDistance(visitorEmbedding, trustedEmbedding);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = trustedFace;
    }
  }

  const confidence = Number.isFinite(bestDistance) ? distanceToConfidence(bestDistance) : 0;
  const isKnown = Boolean(bestMatch && bestDistance <= threshold());

  return {
    faceDetected: true,
    known: isKnown,
    name: isKnown ? bestMatch.firstName : null,
    confidence,
  };
};

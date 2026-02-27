import { Request, Response } from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as secchiSortService from "../services/secchiSortService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ensureUploadDir = async (dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const parseBase64Payload = (input: string): { buffer: Buffer; extension: string } => {
  // Supports both raw base64 and data URLs like: data:image/jpeg;base64,....
  const dataUrlMatch = input.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
  if (dataUrlMatch) {
    const mime = dataUrlMatch[1];
    const b64 = dataUrlMatch[2];
    return {
      buffer: Buffer.from(b64, "base64"),
      extension: mime === "image/png" ? "png" : "jpg",
    };
  }

  // Assume raw base64; default to jpg
  return {
    buffer: Buffer.from(input, "base64"),
    extension: "jpg",
  };
};

export const predict = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64 } = req.body as { imageBase64?: string };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({
        success: false,
        error: "imageBase64 is required",
      });
      return;
    }

    const { buffer, extension } = parseBase64Payload(imageBase64);

    // Protect the server from extremely large decoded images.
    // Note: base64 inflates size by ~33%, so this guards the actual bytes written.
    const maxBytes = Number.parseInt(process.env.SECCHI_MAX_IMAGE_BYTES || "12000000", 10); // 12MB default
    if (Number.isFinite(maxBytes) && maxBytes > 0 && buffer.length > maxBytes) {
      res.status(413).json({
        success: false,
        error: `Image too large. Please upload a smaller photo (max ${Math.round(maxBytes / (1024 * 1024))}MB).`,
      });
      return;
    }

    // Very small sanity check to catch empty payloads
    if (!buffer || buffer.length < 16) {
      res.status(400).json({
        success: false,
        error: "imageBase64 is invalid",
      });
      return;
    }

    // Save under citizen-science-api/public/uploads/secchi
    const publicDir = path.resolve(__dirname, "../../public");
    const uploadDir = path.join(publicDir, "uploads", "secchi");
    await ensureUploadDir(uploadDir);

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const prediction = await secchiSortService.predictSecchiFromImagePath(filePath);

    res.json({
      success: true,
      prediction: {
        label: prediction.label,
        confidence: prediction.confidence,
      },
    });
  } catch (error) {
    console.error("Error predicting secchi:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

import { Request, Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as objectStorageService from "../services/objectStorageService.js";

const MAX_UPLOAD_BYTES_DEFAULT = 25 * 1024 * 1024; // 25MB

const getMaxUploadBytes = (): number => {
  const raw = process.env.SECCHI_MAX_UPLOAD_BYTES;
  if (!raw) return MAX_UPLOAD_BYTES_DEFAULT;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : MAX_UPLOAD_BYTES_DEFAULT;
};

const isAllowedContentType = (contentType: string): boolean => {
  return contentType === "image/jpeg" || contentType === "image/png";
};

const extensionForContentType = (contentType: string): string => {
  if (contentType === "image/png") return "png";
  return "jpg";
};

export const requestUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { contentType, sizeBytes } = req.body as { contentType?: string; sizeBytes?: number };

    if (!contentType || typeof contentType !== "string") {
      res.status(400).json({ success: false, error: "contentType is required" });
      return;
    }

    if (!isAllowedContentType(contentType)) {
      res.status(400).json({
        success: false,
        error: `Unsupported contentType. Allowed: image/jpeg, image/png`,
      });
      return;
    }

    const maxBytes = getMaxUploadBytes();
    if (typeof sizeBytes === "number" && Number.isFinite(sizeBytes) && sizeBytes > maxBytes) {
      res.status(413).json({ success: false, error: `File too large (max ${maxBytes} bytes)` });
      return;
    }

    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const ext = extensionForContentType(contentType);

    const uploadId = crypto.randomUUID();
    const key = `secchi/raw/${userId}/${yyyy}/${mm}/${uploadId}.${ext}`;

    const presigned = await objectStorageService.createPresignedPutUrl({
      key,
      contentType,
    });

    res.json({
      success: true,
      upload: {
        uploadId,
        bucket: presigned.bucket,
        key: presigned.key,
        url: presigned.url,
        headers: presigned.headers,
        expiresInSeconds: presigned.expiresInSeconds,
        maxUploadBytes: maxBytes,
      },
    });
  } catch (error) {
    console.error("Error creating presigned upload URL:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const completeUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.body as { key?: string };

    if (!key || typeof key !== "string") {
      res.status(400).json({ success: false, error: "key is required" });
      return;
    }

    const head = await objectStorageService.headObject({ key });

    const maxBytes = getMaxUploadBytes();
    if (typeof head.sizeBytes === "number" && head.sizeBytes > maxBytes) {
      // Safety: delete oversized objects to avoid storage abuse.
      await objectStorageService.deleteObject({ key });
      res.status(413).json({ success: false, error: `File too large (max ${maxBytes} bytes)` });
      return;
    }

    if (head.contentType && !isAllowedContentType(head.contentType)) {
      await objectStorageService.deleteObject({ key });
      res.status(400).json({ success: false, error: `Unsupported contentType: ${head.contentType}` });
      return;
    }

    res.json({
      success: true,
      object: {
        bucket: head.bucket,
        key: head.key,
        sizeBytes: head.sizeBytes,
        contentType: head.contentType,
        eTag: head.eTag,
        lastModified: head.lastModified,
      },
    });
  } catch (error) {
    console.error("Error completing upload:", error);
    // HeadObject returns 404/NotFound when key is missing
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.toLowerCase().includes("notfound") ? 404 : 500;
    res.status(status).json({ success: false, error: message });
  }
};

import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export interface PresignedPut {
  url: string;
  headers: Record<string, string>;
  bucket: string;
  key: string;
  expiresInSeconds: number;
}

export interface HeadObjectResult {
  bucket: string;
  key: string;
  sizeBytes?: number;
  contentType?: string;
  eTag?: string;
  lastModified?: Date;
}

const getRequiredEnv = (name: string, fallbackValue?: string): string => {
  const value = process.env[name] ?? fallbackValue;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const getS3Config = () => {
  // Prefer explicit S3_* vars; fall back to AWS_* (matches NREC docs)
  const endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  return {
    endpoint: getRequiredEnv("S3_ENDPOINT", endpoint),
    accessKeyId: getRequiredEnv("S3_ACCESS_KEY_ID", accessKeyId),
    secretAccessKey: getRequiredEnv("S3_SECRET_ACCESS_KEY", secretAccessKey),
    region: process.env.S3_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    bucket: getRequiredEnv("S3_BUCKET"),
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "true").toLowerCase() === "true",
  };
};

let s3ClientSingleton: S3Client | undefined;

export const getS3Client = (): { client: S3Client; bucket: string } => {
  if (!s3ClientSingleton) {
    const cfg = getS3Config();
    s3ClientSingleton = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: cfg.forcePathStyle,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }

  const cfg = getS3Config();
  return { client: s3ClientSingleton, bucket: cfg.bucket };
};

export const createPresignedPutUrl = async (params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<PresignedPut> => {
  const { client, bucket } = getS3Client();

  const expiresInSeconds = params.expiresInSeconds ?? Number(process.env.S3_PRESIGN_EXPIRES_SECONDS || 300);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    url,
    headers: {
      "Content-Type": params.contentType,
    },
    bucket,
    key: params.key,
    expiresInSeconds,
  };
};

export const headObject = async (params: { key: string }): Promise<HeadObjectResult> => {
  const { client, bucket } = getS3Client();

  const result = await client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: params.key,
    })
  );

  return {
    bucket,
    key: params.key,
    sizeBytes: result.ContentLength,
    contentType: result.ContentType,
    eTag: result.ETag,
    lastModified: result.LastModified,
  };
};

export const downloadToFile = async (params: { key: string; destPath: string }): Promise<void> => {
  const { client, bucket } = getS3Client();
  const result = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: params.key })
  );

  const body = result.Body;
  if (!body) {
    throw new Error(`Empty body for object ${params.key}`);
  }

  // AWS SDK v3 returns a Node.js Readable in the Node runtime.
  const stream = body as Readable;
  await pipeline(stream, createWriteStream(params.destPath));
};

export const deleteObject = async (params: { key: string }): Promise<void> => {
  const { client, bucket } = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: params.key,
    })
  );
};

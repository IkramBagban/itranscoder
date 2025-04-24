import { S3Client } from "@aws-sdk/client-s3";
import { RedisManager } from "@repo/cloud-services-manager";
import { config } from "dotenv";
config();

const BUCKET_NAME = process.env.BUCKET_NAME || "itranscode";
const AWS_USER_ACCESS_KEY = process.env.AWS_USER_ACCESS_KEY;
const AWS_USER_SECRET_KEY = process.env.AWS_USER_SECRET_KEY;

console.log("env vars in lambda/services", {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  port: process.env.REDIS_PORT as unknown as number,
  BUCKET_NAME,
  AWS_USER_ACCESS_KEY,
  AWS_USER_SECRET_KEY,
});
export const redisManager = RedisManager.getInstance({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  port: (process.env.REDIS_PORT as unknown as number) || 14029,
});

export const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_USER_SECRET_KEY!,
  },
});

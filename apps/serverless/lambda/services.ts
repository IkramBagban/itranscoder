import { S3Client } from "@aws-sdk/client-s3";
import { RedisManager } from "@repo/cloud-services-manager";
import { config } from "dotenv";
config();


export const redisManager = RedisManager.getInstance({
  host: process.env.REDIS_HOST!,
  password: process.env.REDIS_PASSWORD!,
  port: (process.env.REDIS_PORT as unknown as number) || 14029,
});

export const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_USER_SECRET_KEY!,
  },
});

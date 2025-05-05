import { QueueManager, RedisManager } from "@repo/cloud-services-manager";

export const redisManager = RedisManager.getInstance({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  port: process.env.REDIS_PORT,
});

export const queueManager = QueueManager.getInstance({
  region: process.env.SQS_REGION,
  accessKeyId: process.env.AWS_USER_ACCESS_KEY,
  secretAccessKey: process.env.AWS_USER_SECRET_KEY,
  queueUrl: process.env.SQS_QUEUE_URL,
});

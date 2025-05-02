import { ECSManager, QueueManager, RedisManager } from "@repo/cloud-services-manager";

export const redisManager = RedisManager.getInstance({
  host: process.env.REDIS_HOST!,
  password: process.env.REDIS_PASSWORD!,
  port: process.env.REDIS_PORT as unknown as number,
});

export const ecsManager: ECSManager = ECSManager.getInstance({
  accessKeyId: process.env.AWS_USER_ACCESS_KEY!,
  secretAccessKey: process.env.AWS_USER_SECRET_KEY!,
  region: process.env.SQS_REGION!,
  taskDefinition: process.env.ECS_TASK_DEFINITION!,
  cluster: process.env.ECS_CLUSTER!,
});

export const queueManager: QueueManager = QueueManager.getInstance({
  accessKeyId: process.env.AWS_USER_ACCESS_KEY!,
  secretAccessKey: process.env.AWS_USER_SECRET_KEY!,
  region: process.env.SQS_REGION!,
  queueUrl: process.env.SQS_QUEUE_URL!,
});

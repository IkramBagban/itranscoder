import { ECSManager } from "@repo/cloud-services-manager";

export const ecsManager: ECSManager = ECSManager.getInstance({
  accessKeyId: process.env.AWS_USER_ACCESS_KEY!,
  secretAccessKey: process.env.AWS_USER_SECRET_KEY!,
  region: process.env.SQS_REGION!,
  taskDefinition: process.env.ECS_TASK_DEFINITION!,
  cluster: process.env.ECS_CLUSTER!,
});

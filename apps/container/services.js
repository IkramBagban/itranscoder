import { RedisManager } from "@repo/cloud-services-manager";

export const redisManager = RedisManager.getInstance({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  port: process.env.REDIS_PORT,
});

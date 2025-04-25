import { redisManager } from "../services";

export const updateJobDetails = async (
  jobId: string,
  jobDetails: Record<string, any>
) => {
  const existingJobDetails = await redisManager.get(`job:${jobId}`);

  await redisManager.set(`job:${jobId}`, {
    ...existingJobDetails,
    ...jobDetails,
  });
};

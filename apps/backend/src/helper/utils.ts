import { ecsManager, redisManager } from "../services";

export const JOB_STATUS = {
  PENDING: "PENDING",
  TRANSCODING: "TRANSCODING",
  TRANSCODED: "TRANSCODED",
  FAILED: "FAILED",
  RETRYING: "RETRYING",
};

export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAYS = [30, 60, 120];

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

export const getJobDetails = async (jobId: string) => {
  return (await redisManager.get(`job:${jobId}`)) || {};
};

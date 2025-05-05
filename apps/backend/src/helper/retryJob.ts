import { ecsManager, redisManager } from "../services";
import { runTranscoderContainer } from "./dockerContainerRunner";
import {
  getJobDetails,
  JOB_STATUS,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAYS,
  updateJobDetails,
} from "./utils";
ecsManager;

export const executeRetry = async (
  jobId: string,
  bucketName: string,
  key: string
) => {
  try {
    console.log(`Executing retry for job ${jobId}`);

    // Update job status before retrying
    await updateJobDetails(jobId, {
      status: JOB_STATUS.PENDING,
      retry_started_at: new Date().toISOString(),
    });

    // runTranscoderContainer(
    //   key,
    //   jobId,
    //   "true",
    //   (await getJobDetails(jobId)).retry_count.toString()
    // );

    // Run the transcoder task again
    await ecsManager.runTask({
      BUCKET_NAME: bucketName,
      KEY: key,
      JOB_ID: jobId,
      AWS_USER_ACCESS_KEY: process.env.AWS_USER_ACCESS_KEY!,
      AWS_USER_SECRET_KEY: process.env.AWS_USER_SECRET_KEY!,
      SQS_QUEUE_URL: process.env.SQS_QUEUE_URL!,
      SQS_REGION: process.env.SQS_REGION!,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      REDIS_PORT: process.env.REDIS_PORT,
      IS_RETRY: "true",
      RETRY_COUNT: (await getJobDetails(jobId)).retry_count.toString(),
    });

    console.log(`Retry task started for job ${jobId}`);
    return true;
  } catch (error) {
    console.error(`Failed to execute retry for job ${jobId}:`, error);

    await updateJobDetails(jobId, {
      status: JOB_STATUS.FAILED,
      // @ts-ignore
      error: `Failed to execute retry: ${error.message || error}`,
      updated_at: new Date().toISOString(),
    });

    return false;
  }
};

export const scheduleRetry = async (
  jobId: string,
  bucketName: string,
  key: string,
  error: Error
) => {
  try {
    const jobDetails = await getJobDetails(jobId);

    const retryCount = jobDetails.retry_count || 0;

    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      console.log(
        `Job ${jobId} has exceeded maximum retry attempts (${MAX_RETRY_ATTEMPTS})`
      );
      await updateJobDetails(jobId, {
        status: JOB_STATUS.FAILED,
        error: `Failed after ${retryCount} retry attempts. Last error: ${error.message || error}`,
        last_error: error.message || error,
        retry_exhausted: true,
        updated_at: new Date().toISOString(),
      });
      return false;
    }

    const delaySeconds =
      RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    const nextRetryTime = new Date(
      Date.now() + delaySeconds * 1000
    ).toISOString();

    await updateJobDetails(jobId, {
      status: JOB_STATUS.RETRYING,
      retry_count: retryCount + 1,
      last_error: error.message || error,
      next_retry_at: nextRetryTime,
      updated_at: new Date().toISOString(),
    });

    console.log(
      `Scheduling retry #${retryCount + 1} for job ${jobId} in ${delaySeconds} seconds`
    );

    setTimeout(() => {
      executeRetry(jobId, bucketName, key).catch((err) => {
        console.error(`Error executing retry for job ${jobId}:`, err);
      });
    }, delaySeconds * 1000);

    return true;
  } catch (error) {
    console.error(`Error scheduling retry for job ${jobId}:`, error);
    return false;
  }
};

export const monitorFailedJobs = async () => {
  console.log("Checking for failed jobs...");

  const failedJobIds = await redisManager.getKeysByPattern("job:*");

  for (const jobKey of failedJobIds) {
    const jobId = jobKey.split(":")[1];
    const jobDetails = await redisManager.get(jobKey);

    if (
      jobDetails &&
      jobDetails.status === "FAILED" &&
      !jobDetails.retry_exhausted &&
      !jobDetails.retry_scheduled
    ) {
      console.log(`Found failed job ${jobId} that needs retry`);

      // Mark as retry scheduled to avoid duplicate retries
      await updateJobDetails(jobId, {
        retry_scheduled: true,
        retry_scheduled_at: new Date().toISOString(),
      });

      // Schedule the retry
      const bucketName = jobDetails.bucket_name || process.env.BUCKET_NAME;
      const key = jobDetails.key;
      const error = new Error(jobDetails.error || "Unknown error");

      await scheduleRetry(jobId, bucketName, key, error);
    }
  }
};

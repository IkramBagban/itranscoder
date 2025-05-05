import dotenv from "dotenv";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
import fsOld from "node:fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { redisManager } from "./services.js";
import { JOB_STATUS, Resolution, RESOLUTIONS } from "./constants.js";

dotenv.config();

const bucketName = "itranscode";
const transcodedBucketName = "itrascoded-videos";

const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_USER_SECRET_KEY!,
  },
});

export const updateJobDetails = async (jobId: string, jobDetails: any) => {
  const existing = (await redisManager.get(`job:${jobId}`)) || {};
  await redisManager.set(`job:${jobId}`, { ...existing, ...jobDetails });
};

const main = async () => {
  const isRetry = process.env.IS_RETRY === "true";
  const retryCount = isRetry ? parseInt(process.env.RETRY_COUNT || "0") : 0;
  await updateJobDetails(process.env.JOB_ID!, {
    status: JOB_STATUS.TRANSCODING,
    started_at: new Date().toISOString(),
    is_retry: isRetry,
    retry_count: retryCount,
  });
  try {
    const resolutionProgressMap: Record<string, number> = RESOLUTIONS.reduce(
      (acc: Record<string, number>, res) => {
        acc[res.name] = 0;
        return acc;
      },
      {}
    );

    const command: GetObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME || bucketName,
      Key: process.env.KEY!,
    });

    let result: any;
    try {
      result = await s3Client.send(command);
    } catch (error: unknown) {
      console.error("Error fetching from S3:", error);
      await updateJobDetails(process.env.JOB_ID!, {
        status: JOB_STATUS.FAILED,
        error: "Failed to fetch original video from S3",
        error_details:
          (error as Error).message || (error as unknown as string).toString(),
        failure_stage: "download",
        completed_at: new Date().toISOString(),
      });
      process.exit(1);
    }

    const originalFilePath = "original-video.mp4";
    await fs.writeFile(originalFilePath, result.Body);
    const originalVideoPath = path.resolve(originalFilePath);

    const baseName = path.basename(
      command.input.Key!,
      path.extname(command.input.Key!)
    );
    const ext = path.extname(command.input.Key!);

    await redisManager.set(`job:${process.env.JOB_ID!}:transcodedVideos`, []);
    const failedResolutions: {
      resolution: string;
      error: string;
      stage: string;
    }[] = [];

    const promises = RESOLUTIONS.map((resolution) => {
      const output = `${baseName}-${resolution.name}${ext}`;
      const outputPath = path.resolve(output);

      return new Promise(async (resolve) => {
        try {
          await new Promise((ffmpegResolve, ffmpegReject) => {
            ffmpeg(originalVideoPath)
              .output(outputPath)
              .videoCodec("libx264")
              .audioCodec("aac")
              .size(`${resolution.width}x${resolution.height}`)
              .on("progress", async (progress) => {
                resolutionProgressMap[resolution.name] =
                  progress.percent as number;
                const values = Object.values(resolutionProgressMap);
                const overallProgress =
                  values.reduce((a, b) => a + b, 0) / RESOLUTIONS.length;

                await updateJobDetails(process.env.JOB_ID!, {
                  status: JOB_STATUS.TRANSCODING,
                  [`progress_${resolution.name}`]: progress.percent,
                  progress: overallProgress,
                });
              })
              .on("start", () => {
                console.log(`Start transcoding ${resolution.name}`, outputPath);
              })
              .on("end", async () => {
                try {
                  const putObjCommand = new PutObjectCommand({
                    Bucket: transcodedBucketName,
                    Key: output,
                    Body: fsOld.createReadStream(outputPath),
                  });

                  await s3Client.send(putObjCommand);

                  const videoEntry = {
                    resolution: resolution.name,
                    url: output,
                  };

                  const currentList =
                    (await redisManager.get(
                      `job:${process.env.JOB_ID!}:transcodedVideos`
                    )) || [];

                  currentList.push(videoEntry);
                  await redisManager.set(
                    `job:${process.env.JOB_ID!}:transcodedVideos`,
                    currentList
                  );

                  await updateJobDetails(process.env.JOB_ID!, {
                    [`progress_${resolution.name}`]: 100,
                  });

                  // @ts-ignore
                  ffmpegResolve();
                } catch (uploadError) {
                  console.error(
                    `Upload error for ${resolution.name}:`,
                    uploadError
                  );
                  failedResolutions.push({
                    resolution: resolution.name,
                    error:
                      (uploadError as Error).message ||
                      (uploadError as unknown as string).toString(),
                    stage: "upload",
                  });
                  ffmpegReject(uploadError);
                }
              })
              .on("error", (err) => {
                console.error(`Error in ${resolution.name} transcoding:`, err);
                failedResolutions.push({
                  resolution: resolution.name,
                  error:
                    (err as Error).message ||
                    (err as unknown as string).toString(),
                  stage: "transcoding",
                });

                ffmpegReject(err);
              })
              .run();
          });

          await fs
            .unlink(outputPath)
            .catch((err) =>
              console.error(`Error deleting ${outputPath}:`, err)
            );
          // @ts-ignore
          resolve();
        } catch (error) {
          console.error(`Failed to process ${resolution.name}:`, error);
          // @ts-ignore
          resolve();
        }
      });
    });

    await Promise.all(promises);

    await fs
      .unlink(originalFilePath)
      .catch((err) =>
        console.error(`Error deleting ${originalFilePath}:`, err)
      );

    const transcodedVideos =
      (await redisManager.get(`job:${process.env.JOB_ID!}:transcodedVideos`)) ||
      [];

    if (failedResolutions.length > 0 && transcodedVideos.length === 0) {
      throw new Error(
        `All transcoding tasks failed: ${JSON.stringify(failedResolutions)}`
      );
    } else if (failedResolutions.length > 0) {
      console.warn(
        `Some resolutions failed: ${JSON.stringify(failedResolutions)}`
      );
    }

    await updateJobDetails(process.env.JOB_ID!, {
      status: JOB_STATUS.TRANSCODED,
      transcodedVideos,
      progress: 100,
      completed_at: new Date().toISOString(),
      partial_failure: failedResolutions.length > 0,
      failed_resolutions:
        failedResolutions.length > 0 ? failedResolutions : undefined,
    });

    await redisManager.del(`job:${process.env.JOB_ID!}:transcodedVideos`);

    console.log("All transcoding tasks completed successfully.");
  } catch (error) {
    console.error("Main error:", error);
    await updateJobDetails(process.env.JOB_ID!, {
      status: JOB_STATUS.FAILED,
      error:
        (error as Error).message || (error as unknown as string).toString(),
      error_details: (error as Error).stack,
      completed_at: new Date().toISOString(),
    });
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

main();

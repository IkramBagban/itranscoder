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
import { RESOLUTIONS } from "./constants.js";

dotenv.config();

const bucketName = "itranscode";
const transcodedBucketName = "itrascoded-videos";

const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY,
    secretAccessKey: process.env.AWS_USER_SECRET_KEY,
  },
});

export const updateJobDetails = async (jobId, jobDetails) => {
  const existing = (await redisManager.get(`job:${jobId}`)) || {};
  await redisManager.set(`job:${jobId}`, { ...existing, ...jobDetails });
};

const main = async () => {
  await updateJobDetails(process.env.JOB_ID, {
    status: "TRANSCODING",
  });
  try {
    const resolutionProgressMap = RESOLUTIONS.reduce((acc, res) => {
      acc[res.name] = 0;
      return acc;
    }, {});

    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME || bucketName,
      Key: process.env.KEY,
    });

    let result;
    try {
      result = await s3Client.send(command);
    } catch (error) {
      console.error("Error fetching from S3:", error);
      await updateJobDetails(process.env.JOB_ID, {
        status: "FAILED",
        error: "Failed to fetch original video from S3",
      });
      return;
    }

    const originalFilePath = "original-video.mp4";
    await fs.writeFile(originalFilePath, result.Body);
    const originalVideoPath = path.resolve(originalFilePath);

    const baseName = path.basename(
      command.input.Key,
      path.extname(command.input.Key)
    );
    const ext = path.extname(command.input.Key);

    await redisManager.set(`job:${process.env.JOB_ID}:transcodedVideos`, []);

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
                resolutionProgressMap[resolution.name] = progress.percent;
                const values = Object.values(resolutionProgressMap);
                const overallProgress =
                  values.reduce((a, b) => a + b, 0) / RESOLUTIONS.length;

                await updateJobDetails(process.env.JOB_ID, {
                  status: "TRANSCODING",
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
                    url:output,
                  };

                  const currentList =
                    (await redisManager.get(
                      `job:${process.env.JOB_ID}:transcodedVideos`
                    )) || [];

                  currentList.push(videoEntry);
                  await redisManager.set(
                    `job:${process.env.JOB_ID}:transcodedVideos`,
                    currentList
                  );

                  await updateJobDetails(process.env.JOB_ID, {
                    [`progress_${resolution.name}`]: 100,
                  });

                  // console.log(`Completed ${resolution.name}: ${output}`);
                  ffmpegResolve();
                } catch (uploadError) {
                  console.error(
                    `Upload error for ${resolution.name}:`,
                    uploadError
                  );
                  ffmpegReject(uploadError);
                }
              })
              .on("error", (err) => {
                console.error(`Error in ${resolution.name} transcoding:`, err);
                ffmpegReject(err);
              })
              .run();
          });

          await fs
            .unlink(outputPath)
            .catch((err) =>
              console.error(`Error deleting ${outputPath}:`, err)
            );
          resolve();
        } catch (error) {
          console.error(`Failed to process ${resolution.name}:`, error);
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
      (await redisManager.get(`job:${process.env.JOB_ID}:transcodedVideos`)) ||
      [];

    await updateJobDetails(process.env.JOB_ID, {
      status: "TRANSCODED",
      transcodedVideos,
      progress: 100,
    });

    await redisManager.del(`job:${process.env.JOB_ID}:transcodedVideos`);

    console.log("All transcoding tasks completed successfully.");
  } catch (error) {
    console.error("Main error:", error);
    await updateJobDetails(process.env.JOB_ID, {
      status: "FAILED",
      error: error.message,
    });
  } finally {
    process.exit(0);
  }
};

main();
console.log("new docker image loaded");
import dotenv from "dotenv";

dotenv.config();

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import fs from "fs/promises";
import fsOld from "node:fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

const bucketName = "itranscode";

console.log("initializing s3 client");
const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY,
    secretAccessKey: process.env.AWS_USER_SECRET_KEY,
  },
});

console.log("initialized s3client");

const RESOLUTIONS = [
  { name: "360p", width: 480, height: 360 },
  { name: "480p", width: 858, height: 480 },
  { name: "720p", width: 1280, height: 720 },
];

const main = async () => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME || bucketName,
      // key: process.env.key,
      Key: process.env.KEY || "videos/airdopsv2.mkv",
    });

    let result;
    try {
      result = await s3Client.send(command);
    } catch (error) {
      console.log("error send", error);
    }
    console.log("res", result);
    const originalFilePath = `original-video.mp4`;
    await fs.writeFile(originalFilePath, result.Body);
    const originalVideoPath = path.resolve(originalFilePath);

    const promises = RESOLUTIONS.map((resolution) => {
      const output = `${command.input.Key?.split("/")?.[1] || "video"}-${resolution.name}.mp4`;
      // const output = `output-video-${resolution.name}.mp4`;
      console.log(path.resolve(output));

      return new Promise((resolve) => {
        ffmpeg(originalVideoPath)
          .output(output)
          .withVideoCodec("libx264")
          .withAudioCodec("aac")
          .withSize(`${resolution.width}x${resolution.height}`)
          .on("start", () => {
            console.log(
              "checking if file exists:",
              path.resolve(output),
              fsOld.existsSync(path.resolve(output))
            );
            console.log("start", `${resolution.width}x${resolution.height}`);
          })
          .on("end", async () => {
            console.log("output", output);
            const putObjCommand = new PutObjectCommand({
              Bucket: "itrascoded-videos",
              Key: output,
              Body: fsOld.createReadStream(path.resolve(output)),
            });

            await s3Client.send(putObjCommand);
            console.log("File upload seusccccessfuly");

            resolve();
          })
          .format("mp4")
          .run();
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.log("ERRORR", error);
  }
};

main().finally(() => process.exit(0));

import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 } from "uuid";
import { config } from "dotenv";
import { cors } from "hono/cors";
import { redisManager, s3Client } from "./services";
import * as path from "path";
config(); 

const app = new Hono();
app.use(cors());

const BUCKET_NAME = process.env.BUCKET_NAME || "itranscode";
const AWS_USER_ACCESS_KEY = process.env.AWS_USER_ACCESS_KEY;
const AWS_USER_SECRET_KEY = process.env.AWS_USER_SECRET_KEY;

app.get("/", (c) => c.text("Hello Hono!"));

app.post("/upload/get-presigned-url", async (c) => {
  try {
    const body = await c.req.json();
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      console.warn("Missing fileName or contentType in the request body");
      return c.json({ message: "fileName and contentType are required" }, 400);
    }

    const jobId = v4();
    const key = `videos/${jobId}${path.extname(fileName)}`;

    console.log("Generating presigned URL for file:", {
      fileName,
      key,
      contentType,
    });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 5 * 60,
    });

    console.log("Presigned URL generated:", presignedUrl);

    await redisManager.set(`job:${jobId}`, {
      status: "UPLOADING",
      fileName,
      progress: 0,
      fileExt: path.extname(fileName),
      transcodedVideos: [],
    });

    return c.json(
      {
        message: "Presigned URL generated successfully",
        data: { presignedUrl, jobId, key },
      },
      200
    );
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return c.json(
      { message: "Failed to generate presigned URL", error: error.message },
      500
    );
  }
});

app.get("/poll/progress", async (c) => {
  try {
    const { jobId } = c.req.query();

    if (!jobId) {
      return c.json({ message: "jobId is required" }, 400);
    }

    console.log("Fetching progress for jobId:", jobId);

    const jobDetails = await redisManager.get(`job:${jobId}`);

    if (!jobDetails) {
      return c.json({ message: `No job found for jobId: ${jobId}` }, 404);
    }

    return c.json(
      {
        message: "Progress fetched successfully",
        data: {
          jobId,
          progress: jobDetails.progress || 0,
          status: jobDetails.status || "PENDING",
          ...jobDetails,
        },
      },
      200
    );
  } catch (error) {
    console.error("Error fetching job progress:", error);
    return c.json(
      // @ts-ignore
      { message: "Failed to fetch job progress", error: error.message },
      500
    );
  }
});

export const handler = handle(app);

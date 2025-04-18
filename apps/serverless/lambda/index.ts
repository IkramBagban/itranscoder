import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 } from "uuid";
import { config } from "dotenv";
import { cors } from "hono/cors";
config();


const app = new Hono()
app.use(cors());

const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY!,
    secretAccessKey:
      process.env.AWS_USER_SECRET_KEY!
  },
});

app.get('/', (c) => c.text('Hello Hono!'))

app.post("/upload/get-presigned-url", async (c) => {
  const body = await c.req.json();
  const { fileName, contentType } = body;
  const jobId = v4();
  const key = `videos/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME || "itranscode",
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  });

  return c.json({
    message: "Presigned URL generated successfully",
    data: { presignedUrl, jobId },
  });
});

export const handler = handle(app);

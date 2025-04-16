import dotenv from "dotenv";
import { queueManager } from "./queue-manager";
import { ecsManager } from "./ecs-manager";
import express from "express";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const safeJSONParse = (json: string) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.log("Invalid json: ", error);
    return null;
  }
};

const sleep = async (ms: number) => await new Promise((r) => setTimeout(r, ms));

dotenv.config();

const main = async () => {
  console.log("running main");
  while (1) {
    const Messages = await queueManager.receiveMessages();
    if (!Messages) {
      console.log("There is no message in queue.");

      await sleep(2000); //adding a short delay to reduce cpu usage when the q is empty
      continue;
    }

    for (const message of Messages) {
      const { MessageId, Body } = message;
      console.log("------------------------------------");
      console.log("message detail", { MessageId, Body });

      if (!Body) {
        console.log("Body is undefined");
        continue;
      }
      const event = safeJSONParse(Body);
      console.log("event", event);

      if (!event) continue;
      if (event?.Event === "s3:TestEvent" && event?.Service === "Amazon S3") {
        queueManager.deleteMessage(message.ReceiptHandle!);
        continue;
      }

      for (const rec of event.Records) {
        const { s3 } = rec;
        const {
          object: { key },
          bucket,
        } = s3;
        console.log("key", key);
        const res = await ecsManager.runTask(bucket.name, key);
        console.log("res", res);
        await queueManager.deleteMessage(message.ReceiptHandle!);
      }
    }
  }
};

main();

const app = express();
console.log("process.env.AWS_USER_ACCESS_KEY", process.env.AWS_USER_ACCESS_KEY);

const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_USER_SECRET_KEY!,
  },
});
app.use(express.json());

app.post("/upload/get-presigned-url", async (req, res) => {
  console.log(req.body);
  const { fileName, contentType } = req.body;
  const puttCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME || 'itranscode',
    Key: `videos/${fileName}`,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, puttCommand);

  res.json({ message: "Get presigned url successfully.", data: presignedUrl });
});

app.listen(9302, () => console.log("listening on port 9302"));

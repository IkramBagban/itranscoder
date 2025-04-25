import dotenv from "dotenv";
dotenv.config();

import { runTranscoderContainer } from "./helper/dockerContainerRunner";
import { ecsManager, queueManager } from "./services";
import { updateJobDetails } from "./helper/utils";
import path from "path";
const safeJSONParse = (json: string) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.log("Invalid json: ", error);
    return null;
  }
};

const sleep = async (ms: number) => await new Promise((r) => setTimeout(r, ms));

const main = async () => {
  console.log("running main");


  // just for debugging purpose
  let msgCount = 0;
  let recCounts = 0

  while (1) {
    const Messages = await queueManager.receiveMessages();
    console.log("messages", Messages);
    console.log("[INFO] count ====>  ", {msgCount, recCounts});
    if (!Messages) {
      // console.log("There is no message in queue.");

      await sleep(2000); //adding a short delay to reduce cpu usage when the q is empty
      continue;
    }



    for (const message of Messages) {
      const { MessageId, Body } = message;
      console.log("------------------------------------");
      console.log("message detail", { MessageId, Body });
      msgCount++;

      if (!Body) {
        console.log("Body is undefined");
        continue;
      }
      const event = safeJSONParse(Body);
      console.log("event", event);
      console.log("event.Records", event.Records);

      if (!event) {
        console.log("continuing...");
        continue;
      }
      if (event?.Event === "s3:TestEvent" && event?.Service === "Amazon S3") {
        queueManager.deleteMessage(message.ReceiptHandle!);
        continue;
      }

      for (const rec of event.Records) {
        recCounts++;
        const { s3 } = rec;
        const {
          object: { key },
          bucket,
        } = s3;
        const keyWithExt = key.split("videos/")[1];

        const jobId = path.basename(keyWithExt, path.extname(keyWithExt));

        console.log("key & jobId", { key, jobId, keyWithExt });

        // const res = await runTranscoderContainer(key, jobId);
        // const res = await ecsManager.runTask(bucket.name, key, jobId);
        const res = await ecsManager.runTask({
          BUCKET_NAME: bucket.name,
          KEY: key,
          JOB_ID: jobId,
          AWS_USER_ACCESS_KEY: process.env.AWS_USER_ACCESS_KEY!,
          AWS_USER_SECRET_KEY: process.env.AWS_USER_SECRET_KEY!,
          SQS_QUEUE_URL: process.env.SQS_QUEUE_URL!,
          SQS_REGION: process.env.SQS_REGION!,
          REDIS_HOST: process.env.REDIS_HOST,
          REDIS_PASSWORD: process.env.REDIS_PASSWORD,
          REDIS_PORT: process.env.REDIS_PORT,
        });

        console.log("res", res);
        await queueManager.deleteMessage(message.ReceiptHandle!);
      }
    }
  }
};

main();

import dotenv from "dotenv";
import { queueManager, ecsManager } from "@repo/cloud-services-manager";
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

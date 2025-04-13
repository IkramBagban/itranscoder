import dotenv from "dotenv";
import { queueManager } from "./queue-manager";
import { runTranscoderContainer } from "./dockerContainerRunner";

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
    const { Messages } = await queueManager.receiveMessage();
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
        console.log("Skipping S3 TestEvent.");
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

        try {
          await runTranscoderContainer(key);
          queueManager.deleteMessage(message.ReceiptHandle!);
        } catch (error) {
          console.log("error", error);
        }
      }
    }
  }
};

main();

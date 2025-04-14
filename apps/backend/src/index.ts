import dotenv from "dotenv";
import { queueManager } from "./queue-manager";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

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

const AWS_USER_ACCESS_KEY = process.env.AWS_USER_ACCESS_KEY;
const AWS_USER_SECRET_KEY = process.env.AWS_USER_SECRET_KEY;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const SQS_REGION = process.env.SQS_REGION;

const ecsClient = new ECSClient({
  region: SQS_REGION,

  credentials: {
    accessKeyId: AWS_USER_ACCESS_KEY!,
    secretAccessKey: AWS_USER_SECRET_KEY!,
  },
});

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

        const runTaskCommand = new RunTaskCommand({
          taskDefinition: process.env.TASK_DEFINATION,
          cluster: process.env.CLUSTER,
          launchType: "FARGATE",
          networkConfiguration: {
            awsvpcConfiguration: {
              assignPublicIp: "ENABLED",
              securityGroups: ["sg-09ba32f18825550b7"],
              subnets: [
                "subnet-02f3cd99b1bc58d61",
                "subnet-066c2f0e0e0807e40",
                "subnet-088303cf63a24c118",
              ],
            },
          },
          overrides: {
            containerOverrides: [
              {
                name: "itrascoder-container",
                environment: [
                  { name: "BUCKET_NAME", value: bucket.name },
                  { name: "KEY", value: key },
                  { name: "AWS_USER_ACCESS_KEY", value: AWS_USER_ACCESS_KEY },
                  { name: "AWS_USER_SECRET_KEY", value: AWS_USER_SECRET_KEY },
                  { name: "SQS_QUEUE_URL", value: SQS_QUEUE_URL },
                  { name: "SQS_REGION", value: SQS_REGION },
                ],
              },
            ],
          },
        });

        const res = await ecsClient.send(runTaskCommand);
        console.log("res", res);
        await queueManager.deleteMessage(message.ReceiptHandle!);
      }
    }
  }
};

main();

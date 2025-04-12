import { ReceiveMessageCommand, SQS, SQSClient } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
import { queueManager } from "./queue-manager";

dotenv.config();

const main = async () => {
  while (1) {
    const { Messages } = await queueManager.receiveMessage();
    if (!Messages) {
      console.log("There is no message in queue.");
      continue;
    }

    for (const message of Messages) {
      const { MessageId, Body } = message;
      console.log("------------------------------------");
      console.log("message detail", { MessageId, Body });
    }
  }
};

main();

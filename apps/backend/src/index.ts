// @ts-nocheck
import { ReceiveMessageCommand, SQS, SQSClient } from "@aws-sdk/client-sqs";
import dotenv from 'dotenv'

dotenv.config()

const AWS_USER_ACCESS_KEY = process.env.AWS_USER_ACCESS_KEY;
const AWS_USER_SECRET_KEY = process.env.AWS_USER_SECRET_KEY;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const SQS_REGION = process.env.SQS_REGION;

console.log({
  AWS_USER_ACCESS_KEY,
  AWS_USER_SECRET_KEY,
  SQS_QUEUE_URL,
  SQS_REGION,
});

const sqsClient: SQSClient = new SQSClient({
  region: SQS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY,
    secretAccessKey: process.env.AWS_USER_SECRET_KEY,
  },
});

const main = async () => {
  const command = new ReceiveMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    WaitTimeSeconds: 20
  });

  while (1) {
    const { Messages } = await sqsClient.send(command);
    if (!Messages) {
      console.log("There is no message in queue.");
      continue;
    }

    for (const message of Messages) {
      const { MessageId, Body } = message;
      console.log('------------------------------------')
      console.log("message detail", { MessageId, Body });
    }
  }
};

main();

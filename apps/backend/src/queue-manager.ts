import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import dotenv from "dotenv";

dotenv.config();

export class QueueManager {
  client: SQSClient;

  constructor() {
    const AWS_USER_ACCESS_KEY = process.env.AWS_USER_ACCESS_KEY;
    const AWS_USER_SECRET_KEY = process.env.AWS_USER_SECRET_KEY;
    const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
    const SQS_REGION = process.env.SQS_REGION;

    this.client = new SQSClient({
      region: SQS_REGION,

      credentials: {
        accessKeyId: AWS_USER_ACCESS_KEY!,
        secretAccessKey: AWS_USER_SECRET_KEY!,
      },
    });
  }

  async receiveMessage() {
    const command = new ReceiveMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      WaitTimeSeconds: 20,
      MaxNumberOfMessages: 5,
      VisibilityTimeout: 20, // secs to hide msg during processing
    });
    return await this.client.send(command);
  }

  async deleteMessage(receiptHandle: string) {
    const command = new DeleteMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      ReceiptHandle: receiptHandle,
    });

    const deleteExecCommandRes = await this.client.send(command);
    console.log(`delete ${deleteExecCommandRes.$metadata.requestId} in`, deleteExecCommandRes.$metadata.attempts);
  }
}

export const queueManager = new QueueManager();

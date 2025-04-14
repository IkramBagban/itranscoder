import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  Message,
} from "@aws-sdk/client-sqs";
import dotenv from "dotenv";

dotenv.config();

type SQSConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  queueUrl: string;
};

export class QueueManager {
  private readonly client: SQSClient;
  private readonly queueUrl: string;

  constructor() {
    const config = QueueManager.getValidatedSQSConfig();

    this.queueUrl = config.queueUrl;

    this.client = new SQSClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  private static getValidatedSQSConfig(): SQSConfig {
    const {
      AWS_USER_ACCESS_KEY,
      AWS_USER_SECRET_KEY,
      SQS_QUEUE_URL,
      SQS_REGION,
    } = process.env;

    if (
      !AWS_USER_ACCESS_KEY ||
      !AWS_USER_SECRET_KEY ||
      !SQS_QUEUE_URL ||
      !SQS_REGION
    ) {
      throw new Error("Missing required AWS SQS environment variables.");
    }

    return {
      region: SQS_REGION,
      accessKeyId: AWS_USER_ACCESS_KEY,
      secretAccessKey: AWS_USER_SECRET_KEY,
      queueUrl: SQS_QUEUE_URL,
    };
  }

  async receiveMessages(): Promise<Message[] | undefined> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        WaitTimeSeconds: 20,
        MaxNumberOfMessages: 5,
        VisibilityTimeout: 30,
      });

      const response = await this.client.send(command);
      console.log("Messages received", response.Messages?.length ?? 0);
      return response.Messages;
    } catch (error) {
      console.log("Failed to receive messages", error);
      return undefined;
    }
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      const res = await this.client.send(command);
      console.log("Message deleted", `requestId=${res.$metadata.requestId}`);
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  }
}

export const queueManager = new QueueManager();

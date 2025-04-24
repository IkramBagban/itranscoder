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
  private static instance: QueueManager;

  private constructor(config: SQSConfig) {
    console.log("Initializing SQS");

    this.queueUrl = config.queueUrl;

    this.client = new SQSClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  static getInstance(config?: Partial<SQSConfig>): QueueManager {
    if (!QueueManager.instance) {
      const validated = this.getValidatedSQSConfig(config);
      QueueManager.instance = new QueueManager(validated);
    }
    return QueueManager.instance;
  }

  private static getValidatedSQSConfig(config?: Partial<SQSConfig>): SQSConfig {
    const finalConfig = {
      region: config?.region || process.env.SQS_REGION,
      accessKeyId: config?.accessKeyId || process.env.AWS_USER_ACCESS_KEY,
      secretAccessKey:
        config?.secretAccessKey || process.env.AWS_USER_SECRET_KEY,
      queueUrl: config?.queueUrl || process.env.SQS_QUEUE_URL,
    };

    const missing: string[] = [];
    for (const [key, value] of Object.entries(finalConfig)) {
      if (!value) missing.push(key);
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required AWS SQS config values: ${missing.join(", ")}`
      );
    }

    return finalConfig as SQSConfig;
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


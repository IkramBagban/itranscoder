import { ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

export class QueueManager {
  client: SQSClient;
  private recieveCommand;

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

    this.recieveCommand = new ReceiveMessageCommand({
      QueueUrl:  SQS_QUEUE_URL,
      WaitTimeSeconds: 20,
    });
  }

  async receiveMessage() {
    return await this.client.send(this.recieveCommand);
  }
}

export const queueManager = new QueueManager();

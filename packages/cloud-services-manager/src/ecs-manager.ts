import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import dotenv from "dotenv";

dotenv.config();

type ECSConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  taskDefinition: string;
  cluster: string;
};

export class ECSManager {
  private readonly client: ECSClient;
  private readonly taskDefinition: string;
  private readonly cluster: string;

  constructor() {
    const config = ECSManager.getValidatedECSConfig();

    this.client = new ECSClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.taskDefinition = config.taskDefinition;
    this.cluster = config.cluster;
  }

  private static getValidatedECSConfig(): ECSConfig {
    const {
      AWS_USER_ACCESS_KEY,
      AWS_USER_SECRET_KEY,
      ECS_TASK_DEFINITION,
      ECS_CLUSTER,
      SQS_REGION,
    } = process.env;

    if (
      !AWS_USER_ACCESS_KEY ||
      !AWS_USER_SECRET_KEY ||
      !ECS_TASK_DEFINITION ||
      !ECS_CLUSTER ||
      !SQS_REGION
    ) {
      throw new Error("Missing required ECS environment variables.");
    }

    return {
      region: SQS_REGION,
      accessKeyId: AWS_USER_ACCESS_KEY,
      secretAccessKey: AWS_USER_SECRET_KEY,
      taskDefinition: ECS_TASK_DEFINITION,
      cluster: ECS_CLUSTER,
    };
  }

  async runTask(bucketName: string, key: string): Promise<void> {
    console.log("running task ", arguments);
    try {
      const runTaskCommand = new RunTaskCommand({
        taskDefinition: this.taskDefinition,
        cluster: this.cluster,
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
                { name: "BUCKET_NAME", value: bucketName },
                { name: "KEY", value: key },
                {
                  name: "AWS_USER_ACCESS_KEY",
                  value: process.env.AWS_USER_ACCESS_KEY!,
                },
                {
                  name: "AWS_USER_SECRET_KEY",
                  value: process.env.AWS_USER_SECRET_KEY!,
                },
                { name: "SQS_QUEUE_URL", value: process.env.SQS_QUEUE_URL! },
                { name: "SQS_REGION", value: process.env.SQS_REGION! },
              ],
            },
          ],
        },
      });
      
      const res = await this.client.send(runTaskCommand);
      console.log("Task started");
    } catch (error) {
      console.error("Failed to run ECS task:", error);
    }
  }
}

export const ecsManager = new ECSManager();

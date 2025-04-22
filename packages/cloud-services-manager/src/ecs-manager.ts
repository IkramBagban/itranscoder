import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

type ECSConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  taskDefinition: string;
  cluster: string;
};

type TaskEnvVars = {
  BUCKET_NAME: string;
  KEY: string;
  AWS_USER_ACCESS_KEY: string;
  AWS_USER_SECRET_KEY: string;
  SQS_QUEUE_URL: string;
  SQS_REGION: string;
  REDIS_HOST?: string;
  REDIS_PASSWORD?: string;
  REDIS_PORT?: string;
  JOB_ID: string;
};

export class ECSManager {
  private readonly client: ECSClient;
  private readonly taskDefinition: string;
  private readonly cluster: string;

  private constructor(config: ECSConfig) {
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

  static getInstance(config: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    taskDefinition: string;
    cluster: string;
  }): ECSManager {
    const missingKeys = Object.entries(config)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      throw new Error(
        `Missing ECS configuration values: ${missingKeys.join(", ")}`
      );
    }

    return new ECSManager(config);
  }

  async runTask(envVars: TaskEnvVars): Promise<void> {
    try {
      const environment = Object.entries(envVars).map(([name, value]) => ({
        name,
        value,
      }));

      console.log("environment", environment);
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
              environment,
            },
          ],
        },
      });

      const response = await this.client.send(runTaskCommand);
      console.log("ECS Task started successfully", response);
    } catch (error) {
      console.error("Failed to run ECS task:", error);
    }
  }
}

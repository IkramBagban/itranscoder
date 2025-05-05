import Docker from "dockerode";

const docker = new Docker({ socketPath: "//./pipe/docker_engine" });

export const runTranscoderContainer = async (
  key: string,
  jobId: string,
  IS_RETRY: string | null = null,
  RETRY_COUNT: string | null = null
) => {
  const envs = [
    `KEY=${key}`,
    `JOB_ID=${jobId}`,
    `BUCKET_NAME=${process.env.BUCKET_NAME || "itranscode"}`,
    `SQS_REGION=${process.env.SQS_REGION}`,
    `AWS_USER_ACCESS_KEY=${process.env.AWS_USER_ACCESS_KEY}`,
    `AWS_USER_SECRET_KEY=${process.env.AWS_USER_SECRET_KEY}`,
    `REDIS_HOST=${process.env.REDIS_HOST}`,
    `REDIS_PASSWORD=${process.env.REDIS_PASSWORD}`,
    `REDIS_PORT=${process.env.REDIS_PORT}`,
    IS_RETRY ? `IS_RETRY=${IS_RETRY}` : "",
    RETRY_COUNT ? `RETRY_COUNT=${RETRY_COUNT}` : "",
  ]
  console.log("running transcoder", envs);
  try {
    const container = await docker.createContainer({
      Image: "itranscode-registery",
      Env: envs.filter(Boolean) as string[],
    });

    await container.start();
    console.log(`Container started`);

    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    logStream.on("data", (chunk) => {
      process.stdout.write(`[container] ${chunk.toString()}`);
    });

    // logStream.on("end", () => {
    //   console.log(`Container logs stream ended for key: ${key}`);
    // });

    await container.wait();
    // console.log(`Container finished processing: ${key}`);

    await container.remove();
    
    console.log("Container removed");
  } catch (err) {
    console.error("Error running container:", err);
  }
};

import Docker from "dockerode";

const docker = new Docker({ socketPath: "//./pipe/docker_engine" });

export const runTranscoderContainer = async (key: string) => {
  console.log("running transcoder");
  try {
    const container = await docker.createContainer({
      Image: "transcode-img",
      Env: [
        `key=${key}`,
        `AWS_USER_ACCESS_KEY=${process.env.AWS_USER_ACCESS_KEY}`,
        `AWS_USER_SECRET_KEY=${process.env.AWS_USER_SECRET_KEY}`,
        `BUCKET_NAME=${process.env.BUCKET_NAME}`,
      ],
      HostConfig: {
        Binds: [
          `C:/Users/DELL/Desktop/itranscode/apps/backend/videos:/usr/src/app/videos`,
          `C:/Users/DELL/Desktop/itranscode/apps/backend/transcoded:/usr/src/app/transcoded`,
        ],
      },
    });

    console.log("Starting container");

    await container.start();
    console.log(`Container started for key: ${key}`);

    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    logStream.on("data", (chunk) => {
      process.stdout.write(`[container:${key}] ${chunk.toString()}`);
    });

    logStream.on("end", () => {
      console.log(`Container logs stream ended for key: ${key}`);
    });

    await container.wait();
    console.log(`Container finished processing: ${key}`);

    await container.remove();
    console.log("Container removed");
  } catch (err) {
    console.error("Error running container:", err);
  }
};

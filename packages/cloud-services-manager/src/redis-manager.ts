import {
  createClient,
  RedisClientType,
  RedisFunctions,
  RedisModules,
} from "redis";

export interface RedisConfig {
  username?: string;
  host?: string;
  port?: number;
  password?: string;
}

export class RedisManager {
  private static instance: RedisManager;
  private readonly redisClient: RedisClientType<RedisModules, RedisFunctions>;

  private constructor(config: RedisConfig) {
    const validated = RedisManager.validateConfig(config);

    console.log("Initializing Redis cache with:", {
      host: validated.host,
      port: validated.port,
    });

    this.redisClient = createClient({
      username: validated.username || "default",
      password: validated.password,
      socket: {
        host: validated.host,
        port: validated.port,
      },
    });

    this.redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    this.connect();
  }

  private static validateConfig(config: RedisConfig): Required<RedisConfig> {
    const { host, port, password, username } = config;
    console.log('redis config',config )

    const missing: string[] = [];
    if (!host) missing.push("host");
    if (!port) missing.push("port");
    if (!password) missing.push("password");

    if (missing.length > 0) {
      throw new Error(`Missing Redis config values: ${missing.join(", ")}`);
    }

    return {
      host: host!,
      port: port!,
      password: password!,
      username: username || "default",
    };
  }

  private async connect() {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
      console.log("Redis connected successfully.");
    }
  }

  static getInstance(config?: {
    username?: string;
    host?: string;
    port?: number;
    password?: string;
  }): RedisManager {
    if (!RedisManager.instance) {
      if (!config) {
        throw new Error(
          "RedisManager: No config provided. Please call getInstance(config) with Redis connection info."
        );
      }
      RedisManager.instance = new RedisManager(config);
    }
    return RedisManager.instance;
  }

  async set(key: string, value: any): Promise<boolean> {
    try {
      await this.redisClient.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set key "${key}":`, error);
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to get key "${key}":`, error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete key "${key}":`, error);
      return false;
    }
  }
}

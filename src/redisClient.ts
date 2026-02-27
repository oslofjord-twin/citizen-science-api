import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load env from the API project root regardless of where the process is started from.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Allow turning off Redis for local development.
const createNoopRedis = (): Redis => {
	const noop: any = {
		get: async () => null,
		set: async () => "OK",
		del: async () => 0,
		expire: async () => 0,
		on: () => noop,
		quit: async () => undefined,
	};
	return noop as Redis;
};

const redis: Redis =
	process.env.DISABLE_REDIS === "true"
		? createNoopRedis()
		: new Redis(process.env.REDIS_URL || "redis://localhost:6379");

if (process.env.DISABLE_REDIS === "true") {
	// eslint-disable-next-line no-console
	console.log("ℹ️ Redis disabled (DISABLE_REDIS=true)");
} else {
	redis.on("connect", () => console.log("✅ Connected to Redis"));
	redis.on("error", (err) => console.error("❌ Redis error:", err));
}

export default redis;

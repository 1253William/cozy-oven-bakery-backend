import Redis from "ioredis";

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL environment variable is not defined");
}
const redisClient = new Redis(process.env.REDIS_URL!,
    {
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        retryStrategy(times) {
            if (times > 3) return null; // stop retrying
            return Math.min(times * 200, 1000);
        }
    }
    );

redisClient.on("connect", () => {
    console.log("Connected to Redis Cloud");
});

redisClient.on("ready", () => {
    console.log("Redis ready");
});

redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
});

redisClient.on("close", () => {
    console.warn("Redis connection closed");
});

export default redisClient;
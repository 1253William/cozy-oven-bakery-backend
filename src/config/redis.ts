import Redis from "ioredis";

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL environment variable is not defined");
}
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => {
    console.log("Connected to Redis Cloud");
});

redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
});

export default redisClient;
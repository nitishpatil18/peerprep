import Redis from "ioredis";

let client = null;

export function getRedis() {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error("REDIS_URL not set in .env");
    process.exit(1);
  }
  client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });
  client.on("connect", () => console.log("redis connected"));
  client.on("error", (e) => console.error("redis error:", e.message));
  return client;
}

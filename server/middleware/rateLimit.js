// server/middleware/rateLimit.js
// Simple in-memory rate limiter shared by Netlify functions.
// NOTE: Serverless environments are ephemeral; for production use a shared store (Redis).

import { createClient } from 'redis';

const inMemory = new Map();
let redisClient = null;
let redisAvailable = false;

async function getRedisClient() {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL || process.env.REDIS; // support multiple env var names
  if (!url) return null;
  redisClient = createClient({ url });
  redisClient.on('error', (err) => {
    console.error('Redis client error', err);
    redisAvailable = false;
  });
  try {
    await redisClient.connect();
    redisAvailable = true;
    return redisClient;
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message || err);
    redisClient = null;
    redisAvailable = false;
    return null;
  }
}

/**
 * Async rate limiter. Uses Redis when REDIS_URL is configured, otherwise falls back to in-memory.
 * Throws an Error with statusCode=429 when exceeded.
 */
export async function checkRateLimit(ip, key = 'global', limit = 5, windowMs = 60 * 1000) {
  const mapKey = `${key}::${ip}`;
  const redis = await getRedisClient();
  if (redis && redisAvailable) {
    const redisKey = `rl:${key}:${ip}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, Math.ceil(windowMs / 1000));
    }
    if (count > limit) {
      const err = new Error('Rate limit exceeded');
      err.statusCode = 429;
      throw err;
    }
    return;
  }

  // fallback in-memory
  const now = Date.now();
  const entry = inMemory.get(mapKey) || { count: 0, first: now };
  if (now - entry.first > windowMs) {
    entry.count = 1;
    entry.first = now;
  } else {
    entry.count += 1;
  }
  inMemory.set(mapKey, entry);
  if (entry.count > limit) {
    const err = new Error('Rate limit exceeded');
    err.statusCode = 429;
    throw err;
  }
}

export async function resetRateLimit(ip, key = 'global') {
  const mapKey = `${key}::${ip}`;
  const redis = await getRedisClient();
  if (redis && redisAvailable) {
    const redisKey = `rl:${key}:${ip}`;
    await redis.del(redisKey);
    return;
  }
  inMemory.delete(mapKey);
}

export default { checkRateLimit, resetRateLimit };

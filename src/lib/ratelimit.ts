import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Lazy init so missing Upstash env fails at request time with a clear
// error (caught as fail-open in proxy.ts) instead of crashing build/import.
let _redis: Redis | null = null;
let _ratelimit: Ratelimit | null = null;
let _authRatelimit: Ratelimit | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Upstash Redis is not configured (UPSTASH_REDIS_REST_URL/TOKEN)");
  }
  _redis = new Redis({ url, token });
  return _redis;
}

function getRatelimit(): Ratelimit {
  if (!_ratelimit) {
    _ratelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(100, "1m"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    });
  }
  return _ratelimit;
}

function getAuthRatelimit(): Ratelimit {
  if (!_authRatelimit) {
    _authRatelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "1m"),
      analytics: true,
      prefix: "@upstash/ratelimit/auth",
    });
  }
  return _authRatelimit;
}

// Same `.limit()` shape as Ratelimit so callers (proxy.ts) don't change.
export const redis = {
  get instance() {
    return getRedis();
  },
} as unknown as Redis;

export const ratelimit = {
  limit: (...args: Parameters<Ratelimit["limit"]>) => getRatelimit().limit(...args),
} as Ratelimit;

export const authRatelimit = {
  limit: (...args: Parameters<Ratelimit["limit"]>) => getAuthRatelimit().limit(...args),
} as Ratelimit;

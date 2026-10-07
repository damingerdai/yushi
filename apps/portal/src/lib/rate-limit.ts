import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-client-IP limits for the expensive server actions. Limiting is active only
 * when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, which the
 * Vercel Upstash integration injects; local development stays unlimited.
 */
const limits = {
  "commit-message": { requests: 10, window: "1 h" },
  "pull-request": { requests: 30, window: "1 h" },
} as const;

export type RateLimitedRoute = keyof typeof limits;

let redis: Redis | undefined;
const limiters = new Map<RateLimitedRoute, Ratelimit>();

function getLimiter(route: RateLimitedRoute): Ratelimit | undefined {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    return undefined;
  redis ??= Redis.fromEnv();
  let limiter = limiters.get(route);
  if (!limiter) {
    const { requests, window } = limits[route];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `yushi:ratelimit:${route}`,
    });
    limiters.set(route, limiter);
  }
  return limiter;
}

/** Vercel's edge proxy overwrites these headers, so clients cannot spoof them. */
export function clientIp(headers: Pick<Headers, "get">): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

/**
 * Returns a serializable error when the client exceeds the action's limit, or
 * undefined to continue. Redis outages fail open: availability beats counting.
 */
export async function checkRateLimit(
  route: RateLimitedRoute,
  headers: Pick<Headers, "get">,
): Promise<{ error: string; retryAfter: number } | undefined> {
  const limiter = getLimiter(route);
  if (!limiter) return undefined;
  try {
    const { success, reset } = await limiter.limit(clientIp(headers));
    if (success) return undefined;
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { error: "Too many requests. Please try again later.", retryAfter };
  } catch (error) {
    console.error(`Rate limit check failed for ${route}:`, error);
    return undefined;
  }
}

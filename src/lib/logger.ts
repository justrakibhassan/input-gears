/**
 * Secure Logging Utility
 * Prevents sensitive information disclosure in production
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  [key: string]: unknown;
}

/**
 * List of patterns to redact from logs
 */
const SENSITIVE_PATTERNS = [
  /password/gi,
  /token/gi,
  /secret/gi,
  /api[_-]?key/gi,
  /credit[_-]?card/gi,
  /stripe/gi,
  /ssn/gi,
  /bank/gi,
];

/**
 * Redact sensitive information from log message
 */
function redactSensitiveData(obj: unknown): unknown {
  if (typeof obj === "string") {
    let redacted = obj;
    SENSITIVE_PATTERNS.forEach((pattern) => {
      redacted = redacted.replace(pattern, "[REDACTED]");
    });
    return redacted;
  }

  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map((item) => redactSensitiveData(item));
    }

    const redactedObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (
        SENSITIVE_PATTERNS.some((pattern) => {
          pattern.lastIndex = 0;
          return pattern.test(key);
        })
      ) {
        redactedObj[key] = "[REDACTED]";
      } else {
        redactedObj[key] = redactSensitiveData(
          (obj as Record<string, unknown>)[key],
        );
      }
    }
    return redactedObj;
  }

  return obj;
}

/**
 * Safe logging that prevents information disclosure
 */
export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[DEBUG] ${message}`,
        context ? redactSensitiveData(context) : "",
      );
    }
  },

  info: (message: string, context?: LogContext) => {
    console.log(
      `[INFO] ${message}`,
      context ? redactSensitiveData(context) : "",
    );
  },

  warn: (message: string, context?: LogContext) => {
    console.warn(
      `[WARN] ${message}`,
      context ? redactSensitiveData(context) : "",
    );
  },

  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const sanitizedError = redactSensitiveData({
      message: errorMessage,
      // Only log stack trace in development
      ...(process.env.NODE_ENV === "development" &&
        error instanceof Error && { stack: error.stack }),
    });

    console.error(
      `[ERROR] ${message}`,
      sanitizedError,
      context ? redactSensitiveData(context) : "",
    );

    // TODO: Send to external logging service (Sentry, DataDog, etc.)
    // Example:
    // if (process.env.NODE_ENV === "production") {
    //   Sentry.captureException(error, { tags: { context } });
    // }
  },
};

/**
 * Create a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

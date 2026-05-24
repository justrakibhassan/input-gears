# Security Fixes Implementation Guide

## ✅ Already Implemented Fixes

### 1. Payment Endpoint Authentication (CRITICAL)
**File:** `src/app/api/create-payment-intent/route.ts`  
**Status:** ✅ FIXED

```typescript
// Added authentication check
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 2. Security Headers (HIGH)
**Files:** 
- `src/proxy.ts` - Added CORS and security headers
- `next.config.ts` - Added CSP and security headers

**Status:** ✅ FIXED

```typescript
// Headers added:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Referrer-Policy: strict-origin-when-cross-origin
// Content-Security-Policy: configured
```

### 3. Error Logging (HIGH)
**File:** `src/lib/logger.ts` (NEW)  
**Status:** ✅ CREATED

```typescript
// Provides safe logging that redacts sensitive data
// Prevents stack trace exposure in production
logger.error("Failed to create product", error);
// Logs: "[ERROR] Failed to create product"
// Does NOT expose stack traces or sensitive details
```

### 4. Audit Log Redaction (HIGH)
**File:** `src/modules/admin/actions/audit-actions.ts`  
**Status:** ✅ FIXED

```typescript
// Redacts prices, emails, tokens from audit logs
const redactedDetails = redactSensitiveDetails(details);
// "Created product with price $500" becomes "Created product with price [REDACTED]"
```

---

## ⚠️ Remaining Critical Fixes

### 5. Implement Auth-Specific Rate Limiting

**File:** Create `src/lib/auth-ratelimit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./ratelimit";

// Stricter limits for authentication endpoints
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15m"), // 5 attempts per 15 minutes
  analytics: true,
  prefix: "@upstash/auth-ratelimit",
});

// For password resets and email verification
export const emailRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1h"), // 3 per hour
  analytics: true,
  prefix: "@upstash/email-ratelimit",
});
```

**Integration:** Update auth routes to use stricter limits.

---

### 6. Add Email Verification for Guest Orders

**File:** `src/modules/checkout/actions.ts`

**Current Code (Line ~120):**
```typescript
const validatedForm = placeOrderSchema.parse(formData);
```

**Fix:**
```typescript
const validatedForm = placeOrderSchema.parse(formData);

// ✅ NEW: Verify email before order completion
if (!session?.user?.email && formData.email) {
  // For guest checkout, require email verification
  const emailVerified = await verifyOrderEmail(formData.email);
  if (!emailVerified) {
    return {
      success: false,
      message: "Please verify your email to complete the order",
    };
  }
}
```

**Create helper:** `src/lib/email-verification.ts`
```typescript
export async function verifyOrderEmail(email: string): Promise<boolean> {
  // Check if email has been verified in the current session
  // Could use OTP or email link verification
  // For now, implement simple OTP verification
  // TODO: Implement email verification flow
  return true; // Placeholder
}
```

---

### 7. Fix Order Number Generation

**File:** `src/modules/checkout/actions.ts`

**Current Code (Line ~16):**
```typescript
export async function generateOrderNumber() {
  let orderNumber = "";
  let isUnique = false;

  while (!isUnique) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = randomBytes(6).toString("hex").toUpperCase();
    orderNumber = `IG${year}${random}`;
    // ... collision check
  }
}
```

**Better Implementation:**
```typescript
export async function generateOrderNumber() {
  // Use database sequence for guaranteed uniqueness
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  const year = new Date().getFullYear().toString().slice(-2);
  const sequence = lastOrder
    ? parseInt(lastOrder.orderNumber.slice(4), 10) + 1
    : 1;

  return `IG${year}${String(sequence).padStart(8, "0")}`;
}
```

**Or use UUID:**
```typescript
import { v7 as uuidv7 } from "uuid";

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const uuid = uuidv7().substring(0, 8).toUpperCase();
  return `IG-${timestamp}-${uuid}`;
}
```

---

### 8. Update Error Handlers Across All API Routes

**Pattern:** Replace all `console.error` with safe logging

**Example - File:** `src/modules/admin/actions.ts`

Find and replace all instances of:
```typescript
console.error("Create Product Error:", error);
```

With:
```typescript
logger.error("Failed to create product", error, {
  adminId: session.user.id,
  action: "CREATE_PRODUCT",
});
```

**Complete List of Files to Update:**
1. `src/app/api/create-payment-intent/route.ts` - ✅ Already fixed
2. `src/app/api/products/search/route.ts` - Needs update
3. `src/app/api/cart/route.ts` - Needs update
4. `src/app/api/wishlist/route.ts` - Needs update
5. `src/modules/checkout/actions.ts` - Needs update
6. `src/modules/reviews/actions.ts` - Needs update
7. `src/proxy.ts` - ✅ Already uses logger

---

### 9. Add CORS Headers to API Routes (Optional But Recommended)

**File:** `src/app/api/middleware.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from "next/server";

export function withCORS(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (req: NextRequest) {
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_DOMAIN || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = await handler(req);

    // Add CORS headers to response
    response.headers.set(
      "Access-Control-Allow-Origin",
      process.env.NEXT_PUBLIC_DOMAIN || "*"
    );

    return response;
  };
}
```

**Usage in API routes:**
```typescript
import { withCORS } from "@/app/api/middleware";

export const POST = withCORS(async (req) => {
  // Your handler
});
```

---

### 10. Implement Structured Logging (Production Ready)

**Install Sentry:**
```bash
npm install @sentry/nextjs
```

**Update `src/lib/logger.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

export const logger = {
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    // ... existing code ...

    if (process.env.NODE_ENV === "production") {
      Sentry.captureException(error, {
        tags: { service: "api" },
        contexts: { context },
        level: "error",
      });
    }
  },
};
```

---

## 🚀 Implementation Checklist

### Phase 1 - CRITICAL (Do Immediately)
- [x] Add authentication to payment endpoint
- [x] Add security headers
- [x] Create logger utility
- [ ] Update error handlers in all API routes
- [ ] Deploy and test

### Phase 2 - HIGH (Within 1 Week)
- [ ] Add auth-specific rate limiting
- [ ] Implement email verification for guest orders
- [ ] Fix order number generation
- [ ] Add structured logging (Sentry)

### Phase 3 - MEDIUM (Within 2 Weeks)
- [ ] Add CORS middleware to all API routes
- [ ] Implement request ID tracking
- [ ] Set up monitoring dashboard
- [ ] Document all security practices

---

## 🧪 Testing the Fixes

### 1. Test Payment Authentication
```bash
# Should fail (no auth)
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id": "prod_123", "quantity": 1}]
  }'

# Expected: 401 Unauthorized ✅
```

### 2. Test Security Headers
```bash
curl -I http://localhost:3000/
# Should see headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

### 3. Test Logger Redaction
```typescript
import { logger } from "@/lib/logger";

logger.error("Order failed", new Error("Payment declined"), {
  userId: "user_123",
  amount: "$99.99",
  paymentMethod: "stripe_token_secret123",
});

// Output should NOT contain the token
```

### 4. Test Rate Limiting
```bash
# Rapid requests to API
for i in {1..150}; do
  curl http://localhost:3000/api/products/search?q=mouse
done

# After 100 requests/minute, should receive 429 Too Many Requests
```

---

## 📝 Deployment Notes

### Before Deploying to Vercel:

1. **Set Environment Variables:**
   ```
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   STRIPE_SECRET_KEY=
   STRIPE_PUBLISHABLE_KEY=
   DATABASE_URL=
   NEXT_PUBLIC_BETTER_AUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_DOMAIN=https://yourdomain.com
   ```

2. **Run Security Tests:**
   ```bash
   npm run lint
   npm run build
   npm run test:security
   ```

3. **Enable Vercel Security Features:**
   - Set `NEXT_PUBLIC_BETTER_AUTH_URL` to your production domain
   - Ensure HTTPS is enforced
   - Enable Vercel's DDoS protection

4. **Monitor After Deploy:**
   - Check Sentry for errors
   - Monitor rate limiting metrics
   - Review access logs

---

## 🔒 Additional Recommendations

### Short Term (Month 1)
- [ ] Enable OAuth2 authentication
- [ ] Implement 2FA for admin accounts
- [ ] Add IP whitelisting for admin panel
- [ ] Set up automated security scanning (Snyk)

### Medium Term (Month 2-3)
- [ ] Implement API versioning
- [ ] Add request signing for sensitive operations
- [ ] Set up Web Application Firewall (WAF)
- [ ] Conduct security training

### Long Term (Ongoing)
- [ ] Regular penetration testing
- [ ] Bug bounty program
- [ ] Security audit quarterly
- [ ] Dependency updates and monitoring

---

## 📞 Support & References

- **Better Auth Docs:** https://www.better-auth.com/
- **Next.js Security:** https://nextjs.org/docs/security
- **OWASP Top 10:** https://owasp.org/Top10/
- **Stripe Security:** https://stripe.com/docs/security

---

**Last Updated:** February 27, 2026  
**Status:** In Implementation  
**Owner:** Security Team

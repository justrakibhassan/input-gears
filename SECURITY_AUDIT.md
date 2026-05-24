# Security Audit Report - Input Gears

**Date:** February 27, 2026  
**Project:** Input Gears (Next.js 16 E-Commerce Platform)

---

## 🔴 CRITICAL ISSUES

### 1. **Payment Processing Missing User Authentication**
**File:** [src/app/api/create-payment-intent/route.ts](src/app/api/create-payment-intent/route.ts)  
**Severity:** 🔴 CRITICAL  
**Issue:** The payment endpoint does NOT verify user session. Any unauthenticated user can create payment intents with arbitrary amounts.

```typescript
// VULNERABLE - No authentication check!
export async function POST(req: Request) {
  // Missing: const session = await auth.api.getSession(...)
  const body = await req.json();
  // ... allows anyone to create payment intents
}
```

**Fix:** Add authentication & amount verification:
```typescript
const session = await auth.api.getSession({ headers: request.headers });
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

### 2. **Payment Intent Amount Manipulation**
**File:** [src/app/api/create-payment-intent/route.ts](src/app/api/create-payment-intent/route.ts)  
**Severity:** 🔴 CRITICAL  
**Issue:** Client sends product IDs and quantities, but backend doesn't validate against database prices. Client could send `quantity: 99999` and charge incorrect amount.

**Current Code:**
```typescript
// VULNERABLE - Trusts client prices indirectly
const items = parsed.data.items; // Client-supplied
const products = await prisma.product.findMany(...);
// Cart items include client prices - NOT VERIFIED
```

**Required Fix:** Enforce prices from database only:
```typescript
// Only accept productId and quantity
const itemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive().max(99) // Enforce max quantity
});

// NEVER trust client prices
const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
```

---

### 3. **Missing Authentication Check on Wishlist & Cart Endpoints**
**File:** [src/app/api/wishlist/route.ts](src/app/api/wishlist/route.ts), [src/app/api/cart/route.ts](src/app/api/cart/route.ts)  
**Severity:** 🟠 HIGH  
**Issue:** Card GET is protected ✅ but check CORS & batch operations security

**Good:** Auth is present in cart operations  
**Concern:** Review team permissions on DELETE operations

---

## 🟠 HIGH SEVERITY ISSUES

### 4. **Search SQL Injection Risk (Raw SQL Query)**
**File:** [src/app/api/products/search/route.ts](src/app/api/products/search/route.ts)  
**Severity:** 🟠 HIGH  
**Issue:** Uses parameterized queries which is GOOD ✅, but concatenation with `ILIKE` could be risky:

```typescript
OR p.description ILIKE ${"%" + query + "%"} // Potential issue
```

**Status:** ✅ SAFE (using Prisma's parameterization), but monitor for edge cases.

---

### 5. **Sensitive Data Exposed in Audit Logs**
**File:** [src/modules/admin/actions/audit-actions.ts](src/modules/admin/actions/audit-actions.ts)  
**Severity:** 🟠 HIGH  
**Issue:** Audit logs store plaintext details of all admin actions including product prices, discounts, user information.

```typescript
await createAuditLog({
  details: `Created product "${product.name}" with price ${product.price}` // Logged publicly
});
```

**Risk:** Audit logs may be accessible to unauthorized personnel. Consider:
- Encrypt sensitive fields in audit logs
- Restrict audit log access to SUPER_ADMIN only
- Implement retention policy

---

### 6. **Admin Authentication/Authorization Bypass Risk**
**File:** [src/proxy.ts](src/proxy.ts)  
**Severity:** 🟠 HIGH  
**Issue:** Role checking relies on client session:

```typescript
const isAdminLike = session?.user?.role && 
  ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(session.user.role as string);
```

**Risk:** If session can be manipulated, entire admin section is compromised.

**Mitigation:** ✅ Better Auth handles this, but verify:
- Session tokens are HttpOnly cookies (not localStorage)
- Session validation on every protected route
- CSRF tokens are enforced

---

### 7. **Rate Limiting Previously Too Restrictive (FIXED)**
**File:** [src/lib/ratelimit.ts](src/lib/ratelimit.ts)  
**Status:** ✅ FIXED  
**Previous:** 10 requests/10 seconds (caused 429 errors)  
**Current:** 100 requests/minute (optimal)  
**Improvement:** Limited to API routes only `/api` (excludes `/api/auth`)

---

### 8. **No CORS Configuration in Next.js**
**Severity:** 🟠 HIGH  
**Issue:** No explicit CORS headers set. Next.js defaults may allow unintended cross-origin requests.

**Current state:** Not explicitly configured  
**Risk:** Potential unauthorized API access from third-party domains

**Recommended:** Add CORS middleware in [src/proxy.ts](src/proxy.ts):

```typescript
if (request.method === "OPTIONS") {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_DOMAIN || "https://yourdomain.com",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

---

### 9. **Error Messages Leak Information**
**Files:** Multiple API routes  
**Severity:** 🟠 MEDIUM  
**Issue:** Generic error handling, but some endpoints log errors with stack traces:

```typescript
console.error("Create Product Error:", error); // Logs full error in production!
```

**Risks:**
- Stack traces expose file paths
- Database error details visible to attackers
- Information disclosure

**Fix:** Implement centralized error handler:
```typescript
console.error("Operation failed"); // Never log to console in production
// Only log to secure logging service (Sentry, LogRocket, etc.)
return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### 10. **Checkout Form Accepts External Email**
**File:** [src/modules/checkout/actions.ts](src/modules/checkout/actions.ts)  
**Severity:** 🟡 MEDIUM  
**Issue:** Guest checkout allows arbitrary email without verification:

```typescript
const placeOrderSchema = z.object({
  email: z.string().email("Valid email is required"), // Not verified!
});
```

**Risk:**
- Order confirmation sent to unverified email
- Potential spam/phishing email injection
- Guest orders not linked to account

**Mitigation:** Require email verification for order confirmation:
```typescript
// Send OTP verification before order completion
await sendEmailVerification(formData.email);
```

---

### 11. **User Data Accessible by Email (Privacy Concern)**
**File:** [src/modules/account/profile-actions.ts](src/modules/account/profile-actions.ts)  
**Severity:** 🟡 MEDIUM  
**Code:**
```typescript
where: { email: session.user.email } // Using email as identifier
```

**Issue:** User profile lookup by email (though email is unique, could enable enumeration)

**Status:** Acceptable with proper rate limiting ✅

---

### 12. **Order Number Generation Could Collide**
**File:** [src/modules/checkout/actions.ts](src/modules/checkout/actions.ts)  
**Severity:** 🟡 MEDIUM  
**Issue:** Random order number generation:

```typescript
const random = randomBytes(6).toString("hex").toUpperCase();
orderNumber = `IG${year}${random}`;
```

**Issue:** 6 bytes = 16.7 million combinations. With collisions checked in DB, performance issue possible under high load.

**Fix:** Use database sequences or UUIDs:
```typescript
import { v7 as uuidv7 } from "uuid"; // More predictable prefixes
orderNumber = `IG${new Date().getTime()}-${uuidv7().slice(0, 8)}`;
```

---

### 13. **No CSRF Protection Visible**
**Severity:** 🟡 MEDIUM  
**Issue:** Server actions (`"use server"`) should include CSRF protection  

**Status:** ✅ Next.js 16 automatically provides CSRF protection for server actions

---

### 14. **LocalStorage Usage for Sensitive Data Warning**
**Files:** 
- [src/modules/cart/hooks/use-cart.ts](src/modules/cart/hooks/use-cart.ts)
- [src/modules/products/hooks/use-wishlist.ts](src/modules/products/hooks/use-wishlist.ts)

**Severity:** 🟡 MEDIUM  
**Issue:** Cart and wishlist stored in localStorage (though not extremely sensitive):

```typescript
storage: createJSONStorage(() => localStorage)
```

**Risk:**
- Susceptible to XSS attacks
- Visible in browser DevTools
- Not encrypted

**Acceptable:** ✅ For public data (wishlist, cart), localStorage is acceptable  
**Recommendation:** Guest cart should not contain prices in localStorage

---

## 🟢 LOW SEVERITY ISSUES & OBSERVATIONS

### 15. **Console Logging in Production**
**Severity:** 🟢 LOW  
**Files:** Multiple error handlers  

```typescript
console.error("Middleware Maintenance Check Error:", error);
```

**Recommendation:** Use a logging service (Sentry, DataDog) instead of console

---

### 16. **No Rate Limiting on Authentication Endpoints**
**Status:** ⚠️ Check configuration  
**Current:** `/api/auth` excluded from rate limiting

```typescript
if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
```

**Recommendation:** Implement stricter rate limiting specifically for:
- Login attempts: 5 per minute per IP
- Sign-up: 3 per hour per IP  
- Password reset: 1 per hour per email

---

### 17. **Missing Security Headers**
**Severity:** 🟢 LOW → 🟡 MEDIUM  
**Current:** Not explicitly set in [next.config.ts](next.config.ts)

**Missing Headers:**
```typescript
// Add to next.config.ts or middleware:
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
}
```

---

### 18. **No Input Validation on Admin Category Updates**
**File:** [src/modules/admin/actions.ts](src/modules/admin/actions.ts)  
**Severity:** 🟢 LOW  
**Status:** ✅ Zod schemas properly validate all inputs

---

## 📋 SUMMARY TABLE

| Issue | Severity | Status | Action |
|-------|----------|--------|--------|
| Payment endpoint missing auth | 🔴 CRITICAL | ⚠️ OPEN | IMMEDIATE FIX REQUIRED |
| Payment amount not verified | 🔴 CRITICAL | ⚠️ OPEN | IMMEDIATE FIX REQUIRED |
| No CORS configuration | 🟠 HIGH | ⚠️ OPEN | Add CORS middleware |
| Sensitive audit log data | 🟠 HIGH | ⚠️ OPEN | Encrypt/restrict access |
| Admin role bypass risk | 🟠 HIGH | ✅ MITIGATED | Better Auth handles it |
| Rate limiting too strict | 🟠 HIGH | ✅ FIXED | Now 100 req/min |
| Error messages leak info | 🟠 HIGH | ⚠️ OPEN | Implement error handler |
| Guest checkout email | 🟡 MEDIUM | ⚠️ MONITOR | Add email verification |
| Order number collision | 🟡 MEDIUM | ⚠️ OPEN | Use database sequences |
| Missing security headers | 🟡 MEDIUM | ⚠️ OPEN | Add to next.config.ts |
| Console logging | 🟢 LOW | ⚠️ OPEN | Use Sentry/logging service |

---

## 🛡️ IMMEDIATE ACTION ITEMS (Priority Order)

### Week 1 - CRITICAL
1. **Add authentication to `/api/create-payment-intent`** ← TOP PRIORITY
2. **Validate payment amounts from database only** ← TOP PRIORITY  
3. **Add CORS configuration**
4. **Implement error logging (not console.error)**

### Week 2 - HIGH
5. **Encrypt sensitive audit log fields**
6. **Add security headers to next.config.ts**
7. **Implement auth-specific rate limits**
8. **Add email verification for guest orders**

### Week 3 - MEDIUM
9. **Fix order number generation**
10. **Add health check endpoint for monitoring**
11. **Implement structured logging (JSON format)**
12. **Add request ID tracking for debugging**

---

## 🔍 Testing Recommendations

### Security Tests to Run:
```bash
# 1. Test payment endpoint without auth
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"test","quantity":1}]}'
# Expected: 401 Unauthorized (should fail)

# 2. Test CORS headers
curl -H "Origin: http://attacker.com" http://localhost:3000/api/products/search

# 3. Test rate limiting on auth routes
for i in {1..20}; do 
  curl http://localhost:3000/api/auth/sign-in
done
```

---

## 📚 Additional References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Next.js Security Best Practices](https://nextjs.org/docs/security)
- [Stripe API Security](https://stripe.com/docs/security)
- [Better Auth Documentation](https://www.better-auth.com/)

---

**Generated by:** Security Audit Agent  
**Next Review:** March 20, 2026 (post-deployment)

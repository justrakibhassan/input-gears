# Security Best Practices Guide - Input Gears

This guide helps developers maintain security standards in the Input Gears project.

---

## 🔐 Quick Security Reference

### 1. Safe Error Logging

**DO:**
```typescript
import { logger } from "@/lib/logger";

try {
  // ... code
} catch (error) {
  logger.error("Operation failed", error, {
    userId: session.user.id,
  });
}
```

**DON'T:**
```typescript
console.error("Error:", error);  // ❌ Exposes stack trace
console.log(user.email);         // ❌ Logs sensitive data
throw new Error(error.message);  // ❌ Exposes details
```

---

### 2. Input Validation

**DO:**
```typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  quantity: z.number().int().positive().max(99),
}).strict(); // ✅ Reject unknown fields

const data = schema.parse(input);
```

**DON'T:**
```typescript
const schema = z.object({...}).passthrough(); // ❌ Accepts unknown fields
if (!email.includes('@')) { /* validate */ }  // ❌ Custom validation
```

---

### 3. Authentication Checks

**DO:**
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  // ... process authenticated request
}
```

**DON'T:**
```typescript
export async function POST(req: Request) {
  const body = req.json();
  // ... process without checking authentication ❌
}
```

---

### 4. Database Queries

**DO:**
```typescript
// Using Prisma (parameterized queries) ✅
const user = await prisma.user.findUnique({
  where: { email: userInput },
});

// Using raw SQL with parameters ✅
const results = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;
```

**DON'T:**
```typescript
// String concatenation ❌
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
// SQL injection vulnerability!
```

---

### 5. Audit Logging

**DO:**
```typescript
import { createAuditLog } from "@/modules/admin/actions/audit-actions";

await createAuditLog({
  adminId: session.user.id,
  action: "UPDATE_PRODUCT",
  entityType: "PRODUCT",
  entityId: productId,
  details: "Updated product name and description", // ✅ No prices
});
```

**DON'T:**
```typescript
// Don't include sensitive data in audit logs
details: `Price changed from $500 to $600` // ❌
details: `Email: user@example.com` // ❌
```

---

### 6. Sensitive Data Handling

**DO:**
```typescript
// Only use authenticated environment variables in server/server actions
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY; // ✅ Server only
const dbUrl = process.env.DATABASE_URL;             // ✅ Server only
```

**DON'T:**
```typescript
// Never expose secrets in client code
NEXT_PUBLIC_API_SECRET="secret123"    // ❌ Visible to clients
console.log(process.env.DATABASE_URL) // ❌ Logs to client console
fetch(`/api?token=${API_TOKEN}`)      // ❌ Token in URL
```

---

### 7. Rate Limiting

**Current Setup:**
- Global rate limit: 100 requests/minute (API routes only)
- Excludes `/api/auth` routes (admin controlled)

**Protected Routes:**
- All `/api/*` routes except `/api/auth`

**Testing:**
```bash
for i in {1..150}; do
  curl http://localhost:3000/api/products/search?q=mouse
done
# After 100 requests: 429 Too Many Requests ✅
```

---

### 8. CORS & Origins

**Current Configuration:**
- Allowed origins: `NEXT_PUBLIC_BETTER_AUTH_URL`
- Only the app's own domain can make requests

**If You Need to Add Origins:**
1. Update environment variable
2. Check `src/proxy.ts` for CORS configuration
3. Never use wildcard `*` in production

---

### 9. Server Actions vs API Routes

**Server Actions (Preferred for mutations):**
```typescript
// src/app/actions.ts
"use server";

import { auth } from "@/lib/auth";

export async function updateProfile(data) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  // ✅ Automatic CSRF protection
  // ✅ Secure by default
  // ✅ Type-safe
}
```

**API Routes (For public/GET endpoints):**
```typescript
// src/app/api/products/route.ts
export async function GET() {
  // ✅ For public data
  // ✅ For webhooks (Stripe, etc.)
}
```

---

## 🚨 Common Security Mistakes

### ❌ Mistake 1: Storing Passwords
```typescript
// NEVER store passwords
user.password = hashedPassword; // ❌ Even just the field name is risky

// Better Auth handles this automatically ✅
```

### ❌ Mistake 2: Exposing User IDs
```typescript
// Be careful with ID enumeration
const user = await prisma.user.findUnique({
  where: { id: req.query.id } // Could allow enumeration
});
```

### ❌ Mistake 3: Trust Client Prices
```typescript
// VULNERABLE
const subtotal = items.reduce((acc, item) => {
  return acc + (item.price * item.quantity); // ❌ Client sets price!
}, 0);

// SECURE
const subtotal = items.reduce((acc, item) => {
  const dbPrice = productMap.get(item.id).price; // ✅ Get from DB
  return acc + (dbPrice * item.quantity);
}, 0);
```

### ❌ Mistake 4: Storing PII in Logs
```typescript
// VULNERABLE
logger.info("User logged in", { email, phone, address }); // ❌

// SECURE
logger.info("User logged in", { userId }); // ✅ ID only
```

### ❌ Mistake 5: Missing Authentication
```typescript
// VULNERABLE
export async function POST(req) {
  const body = req.json();
  // ... process without auth ❌
}

// SECURE
export async function POST(req) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({...}, {status: 401});
  // ... process ✅
}
```

---

## 🔍 Security Checklist for New Features

When adding new features, ensure:

- [ ] All endpoints with user data require authentication
- [ ] Input is validated with Zod (strict mode)
- [ ] Database queries use parameterized queries (Prisma)
- [ ] Errors logged with `logger.error()`, not `console.error()`
- [ ] No sensitive data in error messages
- [ ] Admin actions logged to audit trail
- [ ] Rate limiting applied (if needed)
- [ ] Credentials never logged or exposed
- [ ] Sensitive data (prices, emails) not stored in audit logs
- [ ] API endpoints return 401/403 for unauthorized requests

---

## 🆘 Security Incident Response

### If You Discover a Vulnerability:

1. **Do NOT** commit the vulnerability to git
2. **Do NOT** post it in public channels
3. **Create** a private security report
4. **Contact** the security team immediately
5. **Document** the issue in the security tracker

### Critical Security Updates:

```bash
# Keep dependencies up to date
npm audit fix --force  # Only for critical security issues
npm update @prisma/client
npm update next
```

---

## 📞 Getting Help

- **Security Questions:** Post in #security channel (private)
- **Bug Reports:** Use bug bounty program
- **Best Practices:** Check SECURITY_AUDIT.md and SECURITY_FIXES.md
- **Logging Issues:** See logger.ts documentation

---

## 🎓 Learning Resources

1. **OWASP Top 10** - https://owasp.org/Top10/
2. **Next.js Security** - https://nextjs.org/docs/security
3. **Prisma Security** - https://www.prisma.io/docs/concepts/more/security
4. **Better Auth** - https://www.better-auth.com/

---

**Version:** 1.0  
**Last Updated:** February 27, 2026  
**Owner:** Security Team

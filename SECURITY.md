# COREvia Security & Access Control Policy

## 1. Role-Based Access Control (RBAC)

COREvia implements fine-grained enterprise RBAC across all banking modules:

| Role | Description | Decision Trace Permissions |
|---|---|---|
| `ADMIN` | System administrator | Full read, audit access, system configuration |
| `CHECKER` | Dual-control authorizer | View traces, confirm/reject high-risk actions, inspect audit trail |
| `MAKER` | Transaction & onboarding creator | View traces, execute confirmed actions, initiate reviews |
| `OFFICER` | Relationship manager & branch staff | View portfolio traces, confirm recommendations, execute actions |
| `AUDITOR` | Compliance & regulatory inspector | Read-only inspection across all traces, evidence, and audit logs |

---

## 2. Insecure Direct Object Reference (IDOR) Defense

### 2.1 Customer Resource Scoping
All requests touching customer-scoped data pass through `resourceAuth`:
```typescript
// Enforce that the authenticated user has rights to inspect the target customer
await resourceAuth.authorizeCustomer(req.user, customerId);
```
- Relationship managers are scoped strictly to their assigned branch / portfolio.
- Access attempts to unauthorized customer IDs trigger `403 Forbidden` (`FORBIDDEN_SCOPE`) and emit an audit security alert.

### 2.2 Cross-Customer Decision Trace Isolation
Trace comparison explicitly validates that both traces belong to the identical customer:
```typescript
if (baseTrace.customerId !== targetTrace.customerId) {
  throw new BankingError('VALIDATION_ERROR', 'Cross-customer trace comparison forbidden', 400);
}
```
Attempting to cross-compare traces across disparate customers is blocked at the service boundary.

---

## 3. Defense-in-Depth API Safeguards

1. **CSRF Mitigation**: Anti-CSRF double-submit cookies and custom header tokens protect state-changing POST/PUT/DELETE operations.
2. **Strict Transport Security & Headers**: `Helmet` configures `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and robust Content Security Policies (CSP).
3. **Payload Sanitization & Size Limits**: JSON payloads are capped to 1MB to prevent memory exhaustion attacks.
4. **Rate Limiting**: AI Copilot endpoints are bounded to 30 requests per minute per IP to mitigate Denial-of-Wallet and API abuse.
5. **Zero Secrets in Source Control**: `GEMINI_API_KEY`, `SESSION_SECRET`, and `DATABASE_URL` reside solely in server environment variables.

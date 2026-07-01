# Security Policy — SIGNA CHAIN

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Send a detailed report to: **ilyatlethigio@gmail.com** with subject `[SECURITY] SIGNA CHAIN — <brief description>`.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We will acknowledge within 48 hours and aim to release a fix within 14 days for critical issues.

## Security Design Principles

1. **No personal data on-chain.** Only hashes and Merkle roots are stored on-chain.
2. **Issuer private keys are never stored in code or .env files.** Use KMS/HSM in production.
3. **The blockchain does not prove authenticity** — only temporal integrity. Trust comes from the issuer's EdDSA signature.
4. **AI outputs are never treated as ground truth.** All AI-assisted analysis is labeled non-conclusive.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x (development) | ✅ |

## Key Security Controls

- Zero-trust, least-privilege role model (`ADMIN_ROLE`, `ISSUER_MANAGER_ROLE`, `UPGRADER_ROLE`)
- Helmet security headers on all API responses
- Rate limiting (100 req/min per IP, configurable)
- Input validation on all API boundaries (`class-validator`)
- UUPS upgradeable contract with multisig-ready admin
- Pausable contract for emergency stop
- JWT with short expiry + refresh token rotation
- CSP headers on the web frontend
- All secrets via environment variables, never in source

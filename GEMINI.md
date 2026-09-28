# COREvia Project Rules

## Git Safety & Workflow Rules
- **Explicit Approval Required**: DO NOT automatically push every change. Only commit/push after the user explicitly reviews and approves.
- **Pre-Commit Verification**: Before any commit:
  1. Show changed files
  2. Run relevant tests
  3. Run build and type checks (`npm run lint` && `npm run build`)
  4. Explain the rationale for the change
- **Strict Git Safety**:
  - Never force push (`--force` or `-f`).
  - Never rewrite Git history.
  - Never delete branches or reset the repository (`git reset --hard`).
  - Never overwrite unrelated work.
- **Zero Secrets in Source Control**:
  - Never commit `.env` or environment files containing real credentials.
  - Never commit API keys (Google Gemini, etc.), database passwords, or session secrets.
  - Maintain a clean working directory and ensure sensitive files remain ignored in `.gitignore`.

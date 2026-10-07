# Security Checklist

- [ ] API keys are stored in environment variables.
- [ ] `.env.local` is not committed to GitHub.
- [ ] API keys are never placed in Client Components.
- [ ] API keys are never exposed in frontend JavaScript.
- [ ] AI requests are handled on the server.
- [ ] User input is validated on the server before sensitive operations.
- [ ] AI-generated structured data is validated before being used.
- [ ] Tool calls require server-side validation.
- [ ] Actions that affect user data or external systems require user approval.
- [ ] Sensitive personal information is not collected unnecessarily.
- [ ] Production environment variables are configured through Vercel rather than committed to the repository.

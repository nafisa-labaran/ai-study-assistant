# AI Study Assistant — Risk Register

| Risk                                  | Likelihood | Impact | Mitigation                                                                                          |
| ------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------- |
| AI provides incorrect information     | Medium     | High   | Clearly identify AI-generated content and encourage users to verify important academic information. |
| API key is exposed                    | Low        | High   | Store API keys in server-side environment variables and never expose them to the browser.           |
| AI service becomes unavailable        | Medium     | High   | Provide clear error messages and a retry option.                                                    |
| AI responses are slow                 | Medium     | Medium | Use streaming responses and clear loading states where supported.                                   |
| User submits sensitive information    | Medium     | High   | Minimise data collection and avoid unnecessary storage of personal information.                     |
| AI produces invalid structured output | Medium     | Medium | Validate structured responses against a schema and provide a fallback state when validation fails.  |
| AI performs an unwanted action        | Low        | High   | Require user review and approval before executing actions that affect data or external systems.     |
| Excessive API usage increases cost    | Medium     | Medium | Monitor usage and introduce appropriate limits if necessary.                                        |

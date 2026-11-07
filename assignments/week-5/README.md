# Week 5 – Tool Calling and Function Calling

## Overview

This phase extends the AI Study Assistant with tool calling, allowing students to search study materials, save generated study guides, and create revision tasks.

The implementation uses the Vercel AI SDK, Google Gemini, Zod for input validation, and Supabase for persistent storage.

## Available Tools

| Tool | Purpose | Approval Required |
|---|---|---|
| `searchStudyMaterials` | Searches academic materials stored in Supabase | No |
| `saveStudyGuide` | Saves a generated study guide | Yes |
| `createStudyTask` | Creates a revision task | Yes |

## Approval Workflow

Sensitive actions require explicit student approval before execution.

1. The student submits a request.
2. The AI proposes an action and its parameters.
3. The frontend displays the proposed action.
4. The student approves or rejects it.
5. The server verifies the signed approval token.
6. The server validates the input using Zod.
7. The approved action is saved to Supabase.
8. The operation is recorded in the tool logs.

Approval tokens expire after five minutes and cannot be reused.

## Server-Side Validation

All tool inputs are validated on the server using Zod schemas.

The server also verifies approval tokens before executing sensitive actions. This prevents the frontend from being treated as a trusted source of action parameters.

## Database

Supabase stores:

- Study guides
- Revision tasks
- Study materials
- Tool execution logs
- Used approval-token hashes

Row Level Security is enabled on the database tables. The Supabase secret key is used only by server-side code.

## Logging and Error Handling

Tool operations are recorded in the `tool_logs` table.

The implementation records successful and failed search and approval operations. The frontend also displays pending, approved, rejected, and failed action states.

## Rollback and Limitations

Automatic rollback has not yet been implemented.

If a database operation fails after an approval token has been consumed, the student must request a new proposal.

The current prototype does not include student authentication or per-user database access controls. It is intended as a functional demonstration rather than a multi-user production system.

## Technologies

- Next.js
- TypeScript
- Vercel AI SDK
- Google Gemini
- Zod
- Supabase
- Tailwind CSS

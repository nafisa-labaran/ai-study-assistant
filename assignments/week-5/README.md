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


## Using Study Tools

The Study Tools feature allows students to search available study materials, save generated study guides, and create revision tasks using natural language.

### Accessing Study Tools

1. Open the AI Study Assistant application.
2. Select **Study Tools** from the main navigation.
3. Enter a request in the message box and submit it.

### Examples of Requests

**Search for study materials**
- "Find materials on Requirements Engineering."
- "Search for study materials about software testing."

**Save a study guide**
- "Save my study guide on Software Architecture."
- Review the proposed title and content before approving.

**Create a revision task**
- "Create a high-priority revision task for Requirements Engineering."
- Review the task title, description, due date, and priority before approving.

### Understanding Tool Approvals

Not every action requires approval.

| Action | Approval required? |
|---|---|
| Search study materials | No |
| Save a study guide | Yes |
| Create a revision task | Yes |

When an action requires approval:

1. The assistant presents a preview of the proposed action.
2. Review the details.
3. Select **Approve** to execute the action or **Reject** to cancel it.
4. The application displays the outcome.

Approval requests expire after five minutes and cannot be reused.

### Important Notes

- Study Tools searches materials already available in the application's database.
- Search results depend on the materials stored in the database.
- Saving study guides and creating tasks require explicit approval.
- This is a prototype and does not yet provide individual student accounts or automatic rollback.
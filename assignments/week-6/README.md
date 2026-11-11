# Week 6 – Retrieval-Augmented Frontend AI Experiences (RAG)

## Overview

This phase adds the **Ask Your Materials** page. Students select study materials stored in Supabase, ask a question, and receive an answer that is based only on passages retrieved from those materials. Each answer shows its citations and supporting excerpts, and each citation can be opened to inspect the original source.

The implementation reuses the existing Supabase database, Google Gemini, the Vercel AI SDK and Zod. No new packages, embeddings or vector database were added.

## How It Works

1. The page loads the list of study materials (titles and subjects only).
2. The student selects one or more materials and asks a question.
3. The server fetches only the selected materials from Supabase.
4. The server splits each material into passages (one per section) and ranks them by how many of the question's keywords they contain.
5. If no passage matches, the server returns a "no relevant passages" message without calling Gemini.
6. Otherwise, the top four passages are numbered and sent to Gemini, which must answer using only those passages and state which passage numbers it used.
7. The server checks the citations and returns the answer, citations and excerpts.
8. The student can click a citation to open the full material with the cited passage highlighted.

## Retrieval Approach

Retrieval uses simple keyword matching in server code (`lib/retrieval.ts`):

- Common words such as "what", "is" and "the" are ignored.
- Plurals are treated as the same word, so "tests" matches "test".
- Passages are ranked by the number of different keywords they contain, then by how often those keywords appear.
- A passage with no matching keyword is never returned.

This approach was chosen because the material collection is small and the student selects which materials to search. It needs no database changes and is easy to test.

## Citation Safety

Citations are never taken on trust from the AI.

| Rule | How it is enforced |
|---|---|
| Citations must refer to real passages | Gemini returns passage numbers only. The server keeps a number only if it matches a passage it sent. |
| Excerpts must be genuine | Excerpts are copied from the database text, not from Gemini's wording. |
| Answers must be supported | An answer with no valid citation is not shown. The student sees "not enough information" instead. |
| No invented confidence | The application does not display confidence scores. |

## Messages Shown to Students

| Situation | Message |
|---|---|
| No passage matches the question | "No relevant passages found" – suggests rephrasing or selecting other materials |
| Passages were found but do not answer the question | "Not enough information" |
| No material selected, or question too short | A prompt to complete the form (no request is sent) |
| The server or Gemini fails | An error asking the student to try again |

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/materials` | Lists materials (id, title and subject only) |
| `GET /api/materials/[id]` | Returns one material split into sections, for the source viewer |
| `POST /api/materials/ask` | Retrieves passages, asks Gemini, checks citations and logs the question |

All inputs are validated on the server with Zod (`types/material-qa.ts`). Material ids must be valid UUIDs, questions are limited to 500 characters, and at most 10 materials can be selected.

## Privacy and Security

- The Supabase secret key and the Gemini API key are used only by server-side code.
- The material list does not include document content.
- Only the passages retrieved for a question are sent to Gemini.
- Full material content is sent to the browser only when a student opens a source.

## Database

No changes were made to the database structure. The existing `study_materials` table (`id`, `title`, `subject`, `content`, `created_at`) is sufficient.

The `content` of the four existing materials was expanded from one sentence each to several sections, so that passage retrieval could be demonstrated. Each section is a heading line followed by a paragraph, with a blank line between sections.

Each question is recorded in the existing `tool_logs` table under the tool name `askStudyMaterials`.

## Testing

Automated tests (run with `npm test`):

| Test file | What it covers |
|---|---|
| `lib/retrieval.test.ts` | Splitting materials into passages, keyword extraction, ranking, no-match cases |
| `lib/material-answer.test.ts` | Prompt building, removal of invalid citations, insufficient-information cases |
| `types/material-qa.test.ts` | Validation of requests and of Gemini's answer format |
| `app/ask-materials/page.test.tsx` | Material selection, answers, citations, source viewer and all message states |

Example questions for manual testing:

| Question | Selected materials | Expected result |
|---|---|---|
| What is boundary value analysis? | All | Answer citing Introduction to Software Testing |
| What are non-functional requirements and how do they affect architecture? | All | Answer citing Requirements Engineering and Software Architecture |
| What is verification? | Software Architecture only | No relevant passages found |
| What is photosynthesis? | All | No relevant passages found |
| Which testing tool should I use for unit testing? | All | Not enough information |

## Limitations

- Keyword matching does not understand synonyms. A question about "bugs" will not find a passage that only says "defects".
- Common words can cause weak matches. Gemini is instructed to cite only passages that support the answer, so weak matches should not appear as citations.
- All selected materials are loaded for each question. This suits a small collection but would need a different approach for a large one.
- As in earlier weeks, there are no student accounts, so all materials are shared by everyone who uses the application.

## Using Ask Your Materials

1. Open the AI Study Assistant application.
2. Select **Ask Your Materials** from the home page.
3. Tick the study materials you want to use.
4. Enter a question and select **Ask**.
5. Read the answer and its sources.
6. Select a citation number or **View in original source** to see the cited passage in its original material.

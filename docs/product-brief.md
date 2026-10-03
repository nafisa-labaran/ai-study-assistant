# AI Study Assistant — Product Brief

## 1. Product Overview

AI Study Assistant is a web application that helps university students understand and revise academic material using AI.

The initial version will allow students to:

* Ask questions and receive explanations.
* Summarise study materials.
* Generate practice questions.

Additional features such as document retrieval, structured study plans, and AI-assisted study tasks may be added in later modules.

## 2. Target Users

The primary users are university students who need help understanding difficult topics, reviewing study materials, and preparing for assessments.

## 3. Problem

Students often spend significant time searching for explanations, summarising notes, and creating materials for revision. AI Study Assistant provides an interactive way to perform these tasks in one place.

## 4. Jobs-to-be-Done

* When I do not understand a topic, I want a simple explanation so that I can understand it better.
* When I have lengthy study material, I want a concise summary so that I can review it more quickly.
* When preparing for an assessment, I want practice questions so that I can test my understanding.

## 5. Core AI Use Cases

### Ask & Explain

The student enters an academic question and receives an AI-generated explanation.

### Summarise Study Material

The student provides study material and requests a summary.

### Generate Practice Questions

The student provides a topic or study material and asks the AI to generate practice questions.

## 6. Key User Flows

### Chat Flow

Student opens the assistant → enters a question → request is validated → request is sent to the server → server sends it to the AI model → response is streamed/displayed → student can ask a follow-up question, copy the response, retry, or provide feedback.

### Assistive Action Flow

Student selects an action such as summarising or generating questions → provides the required content → AI processes the request → result is displayed for review.

### Review & Approval Flow

For future actions that can change data or perform an external operation, the AI proposes the action first → student reviews the proposed action → student approves or cancels it → server validates the action before execution.

### Fallback Flow

If a request fails, takes too long, or produces invalid structured data, the application displays a clear error or fallback state and allows the student to retry.

## 7. System Boundaries

**Browser / Frontend**

* Displays the user interface.
* Collects user input.
* Displays AI responses and application states.
* Manages temporary UI state.
* Does not contain API keys or other server secrets.

**Server / Backend**

* Validates requests.
* Handles AI API calls.
* Keeps API keys and other secrets secure.
* Handles application logic and future tool execution.
* Controls access to stored data.

**AI Model**

* Understands user requests.
* Generates explanations, summaries, questions, and other AI responses.
* Produces structured outputs when required.

**Data and External Tools**

* Future modules may use a database, document storage, retrieval system, and tools for study-related actions.
* These resources will be accessed through the server rather than directly exposing them to the browser.

## 8. Initial Architecture

```text
Student
   ↓
Browser / Next.js Frontend
   ↓
Next.js Server
   ↓
Vercel AI SDK
   ↓
OpenAI Model

Future:
Next.js Server → Database
              → Document Storage / Retrieval
              → Approved Tools
```

## 9. AI Platform Decision

OpenAI will be used as the initial AI provider.

The application will use the Vercel AI SDK as the integration layer so that the AI provider can be changed later without redesigning the entire application.

The API key will remain on the server and will not be exposed to the browser.

## 10. State Management

The initial application will manage:

* Current conversation messages.
* User input.
* Loading and streaming states.
* Errors.
* Generated content awaiting review.

Later versions may store:

* Conversation history.
* User preferences.
* Uploaded documents.
* Study plans and tasks.

## 11. Acceptance Criteria

**Accuracy:** Responses should be relevant to the user's request, clearly presented as AI-generated, and acknowledge limitations where appropriate.

**Performance:** The interface should provide clear loading feedback and use streaming where appropriate to improve the perceived response time.

**Accessibility:** Main controls should be keyboard accessible, properly labelled, and provide appropriate feedback for loading and error states.

**Safety:** API keys and server secrets must remain server-side. User inputs and AI-generated outputs should be validated where necessary, and actions that affect data or external systems should require user approval.

**User Experience:** The application should provide clear feedback, understandable errors, and options such as retrying or cancelling requests where appropriate.

## 12. Privacy

The application should minimise the collection of personal information. API keys and other private server credentials must never be exposed to the browser.

If conversations or documents are stored in future versions, the application should clearly define what is stored, why it is stored, and how it is protected.

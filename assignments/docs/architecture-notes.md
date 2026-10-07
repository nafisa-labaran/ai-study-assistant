# Architecture Notes

## Server Responsibilities

The server is responsible for operations that require security, private credentials, or access to protected resources.

For AI Study Assistant, these include:

* Calling the AI provider.
* Keeping API keys and other secrets secure.
* Validating user input.
* Handling application logic.
* Accessing databases and stored documents in future modules.
* Validating and executing approved tools in future modules.

## Client Responsibilities

The client is responsible for interactive user interface behaviour.

These include:

* Accepting user input.
* Displaying conversations.
* Managing temporary UI state.
* Showing loading and error states.
* Handling buttons and other user interactions.

## Server Components

Next.js Server Components are used by default in the App Router. They are appropriate for UI that does not require browser-side interactivity or client-only APIs.

## Client Components

Client Components are used when browser-side interactivity is required. The `"use client"` directive is used at the top of components that need features such as state, event handlers, or browser APIs.

## Server Actions

Server Actions allow server-side functions to be called from the application while keeping server-side logic on the server. They can be useful for operations such as submitting data or performing server-side mutations.

## AI SDK Boundary

The Vercel AI SDK provides an integration layer between the application and the AI provider. The frontend and backend can use the SDK's abstractions without tightly coupling the application to one AI provider.

For this project, OpenAI is the initial provider. The provider can be changed later without redesigning the entire frontend architecture.

## Mapping to the Product Brief

| Product Brief Responsibility | Technical Location        |
| ---------------------------- | ------------------------- |
| User interface               | Client / Next.js          |
| User input                   | Client                    |
| Chat interaction             | Client + Server           |
| AI requests                  | Server                    |
| API key                      | Server only               |
| AI model                     | External AI provider      |
| Input validation             | Server                    |
| Conversation history         | Server/database in future |
| Document retrieval           | Server in future          |
| Approved tools               | Server in future          |

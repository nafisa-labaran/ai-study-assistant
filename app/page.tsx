
import Link from "next/link";
import ChatInterface from "./components/chat-interface";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-gray-900 sm:px-6">
      <header className="mx-auto mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold">AI Study Assistant</h1>
        <p className="mt-2 text-gray-600">
          Ask questions, summarise study materials, and generate practice
          questions.
        </p>

        <Link
          href="/study-guide"
          className="mt-4 inline-flex rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Generate a Study Guide →
        </Link>
      </header>

      <ChatInterface />
    </main>
  );
}

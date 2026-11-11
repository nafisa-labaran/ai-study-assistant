
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

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/study-guide"
            className="inline-flex rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Generate a Study Guide →
          </Link>

          <Link
            href="/study-tools"
            className="inline-flex rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Study Tools →
          </Link>

          <Link
            href="/ask-materials"
            className="inline-flex rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Ask Your Materials →
          </Link>
        </div>
      </header>

      <ChatInterface />
    </main>
  );
}


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
      </header>

      <ChatInterface />
    </main>
  );
}

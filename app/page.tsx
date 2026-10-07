import ChatInput from "./components/chat-input";

export default function Home() {
  return (
    <main>
      <h1>AI Study Assistant</h1>

      <p>
        Ask questions, summarise study materials, and generate practice
        questions.
      </p>

      <ChatInput />
    </main>
  );
}
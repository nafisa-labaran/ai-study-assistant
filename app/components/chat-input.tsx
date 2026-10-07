"use client";

import { useState } from "react";

export default function ChatInput() {
  const [message, setMessage] = useState("");

  return (
    <div>
      <input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ask a study question..."
      />

      <button type="button">
        Send
      </button>
    </div>
  );
}
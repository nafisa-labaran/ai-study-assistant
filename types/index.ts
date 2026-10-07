export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface Source {
  id: string;
  title: string;
  url?: string;
}

export interface Tool {
  name: string;
  description: string;
}
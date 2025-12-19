import { signal } from "@angular/core";
import { FunctionTool } from "@openai/agents";
import { RealtimeAgent, RealtimeSession, RealtimeSessionConfig } from "@openai/agents/realtime";

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const quizTopics = [
  'Hungarian kings',
  'astronomy',
  'space exploration',
  'hungarian history',
  'the second world war',
  'inventors'
];

export const getRandomTopic = () => quizTopics[Math.floor(Math.random() * quizTopics.length)];

export const instructions = (name: string, topic: string) => `
Act as a quizmaster. Speak Hungarian.
First greet the player called '${name}',
and then ask 5 random questions about ${topic}.
Do not ask too simple questions.
When the player answers a question,
 call \`correct_answer\` if the answer was correct,
 otherwise call \`incorrect_answer\`.
After 5 question say goodbye, call \`end_conversation\` and end the quiz.`;

export function createTool(name: string, description: string, invoke: () => any): FunctionTool {
  return {
    type: 'function',
    name,
    description,
    parameters: {
      type: "object",
      properties: {
      },
      required: [],
      additionalProperties: false
    },
    strict: false,
    needsApproval: async () => false,
    isEnabled: async () => true,
    invoke
  }
};

export interface Callbacks {
  correctAnswer: () => any;
  incorrectAnswer: () => any;
  endConversation: () => any;
}

export const session = signal<RealtimeSession | null>(null);

export async function initSession(name: string, topic: string, callbacks: Callbacks) {
  const response = await fetch('/api/token');
  if (!response.ok) {
    throw new Error('Failed to fetch token.');
  }

  const { token } = await response.json();
  console.log('Token:', token);
  if (!token) {
    throw new Error('Failed to fetch token.');
  }

  const agent = new RealtimeAgent({
    name: 'Three questions quiz',
    instructions: instructions(name, topic),
    voice: 'ballad', //alloy, ash, ballad, coral, echo, sage, shimmer, verse
    tools: [
      createTool("end_conversation", "Call this function after the farewell at the end of the quiz", callbacks.endConversation),
      createTool("correct_answer", "Call this function every time when the player responds with a correct answer", callbacks.correctAnswer),
      createTool("incorrect_answer", "Call this function every time when the player responds with an incorrect answer", callbacks.incorrectAnswer),
    ]
  });

  session.set(new RealtimeSession(agent));

  session()!.connect({ apiKey: token });
}

export function startConversation() {
  session()?.sendMessage('Kezdjük!');
}

export function mute(muted: boolean) {
  session()?.mute(muted);
}

export function closeSession() {
  session()?.close();
  session.set(null);
}

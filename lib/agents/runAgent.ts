import { nvidiaChat } from "@/lib/nvidia";

interface AgentOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}

/**
 * Generic NVIDIA NIM agent runner.
 * Wraps nvidiaChat for use in all /api/agents/* routes.
 */
export async function runAgent({
  systemPrompt,
  userMessage,
  maxTokens = 1500,
}: AgentOptions): Promise<string> {
  return nvidiaChat(systemPrompt, userMessage, maxTokens);
}

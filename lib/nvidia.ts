/**
 * NVIDIA NIM Client
 * Model: nvidia/nemotron-3-nano-30b-a3b
 * Endpoint: https://integrate.api.nvidia.com/v1 (OpenAI-compatible)
 */

export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
export const NVIDIA_MODEL = "nvidia/nemotron-3-nano-30b-a3b";

/**
 * Send a chat completion request to NVIDIA NIM.
 */
export async function nvidiaChat(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1500
): Promise<string> {
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.95,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NVIDIA NIM error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

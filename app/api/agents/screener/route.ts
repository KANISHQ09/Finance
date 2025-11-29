import { NextResponse } from "next/server";

// IMPORTANT: Replace with your actual Lyzr Agent ID and fetch the API Key securely (e.g., from process.env)
const SCREENER_AGENT_ID = "69272a6274293a73c735c970";
const SCREENER_API_KEY = process.env.SCREENER_AGENT_API_KEY || "YOUR_PORTFOLIO_AGENT_API_KEY_HERE"; 

// Constants based on your new curl information
const NEW_AGENT_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
const USER_ID_PLACEHOLDER = 'finnext-user'; // Simple placeholder or derive from session/auth
const SESSION_ID = 'finnext-session-1'; // Used by Lyzr to maintain conversation history

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // We only need 'input' from the frontend for the API's 'message' field
    const { input } = body; 

    if (!input) {
      return NextResponse.json({ error: "Missing 'input' in request body" }, { status: 400 });
    }

    // 1. Proxy request to the V3 Lyzr Agent API endpoint
    const res = await fetch(NEW_AGENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 2. Use the x-api-key header for authentication
        "x-api-key": SCREENER_API_KEY, 
      },
      body: JSON.stringify({
        user_id: USER_ID_PLACEHOLDER,
        agent_id: SCREENER_AGENT_ID,
        // 3. Use agent ID to ensure session is unique per agent
        session_id: `${SCREENER_AGENT_ID}-${SESSION_ID}`, 
        message: input, // Map frontend 'input' to API 'message'
      }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Lyzr API Error (${res.status}): ${errorText}`);
        return NextResponse.json({ error: `Lyzr Agent failed: ${errorText}` }, { status: res.status });
    }

    const data = await res.json();
    
    // The V3 API response structure is nested. We extract the relevant parts.
    const agentReply = data.response?.content || data.response || 'No reply content found.';
    const sources = data.response?.sources || [];

    // 4. Return the response to the frontend
    return NextResponse.json({
      reply: agentReply,
      sources: sources,
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
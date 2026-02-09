/**
 * POST /api/livekit-token
 *
 * Generates a LiveKit access token for the voice page.
 * Creates a room, dispatches the voice agent, and returns a token
 * so the browser client can join the same room.
 *
 * Request body:
 *   - identity (string, optional): Unique participant identity. Defaults to random citizen ID.
 *
 * Response:
 *   - token (string): JWT access token
 *   - roomName (string): Generated room name
 *   - url (string): LiveKit WebSocket URL
 */

import { NextRequest, NextResponse } from "next/server";
import {
  AccessToken,
  RoomServiceClient,
  AgentDispatchClient,
} from "livekit-server-sdk";

// Environment variables (set in apps/web/.env.local)
const LIVEKIT_URL = process.env.LIVEKIT_URL!;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

const AGENT_NAME = "jansunwai-voice-agent";

export async function POST(request: NextRequest) {
  try {
    // Validate environment
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.error("LiveKit environment variables not configured");
      return NextResponse.json(
        { error: "Voice service not configured" },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const identity = body.identity || `citizen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Generate a unique room name for this voice session
    const roomName = `jansunwai-voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 1. Create the room explicitly
    const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    await roomService.createRoom({ name: roomName, emptyTimeout: 60 });
    console.log(`[LiveKit Token] Room created: ${roomName}`);

    // 2. Dispatch the voice agent to the room
    const dispatchClient = new AgentDispatchClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    await dispatchClient.createDispatch(roomName, AGENT_NAME);
    console.log(`[LiveKit Token] Agent dispatched: ${AGENT_NAME} -> ${roomName}`);

    // 3. Create access token for the browser client
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      ttl: "15m",
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    console.log(`[LiveKit Token] Token generated for identity=${identity}, room=${roomName}`);

    return NextResponse.json({
      token: jwt,
      roomName,
      url: LIVEKIT_URL,
    });
  } catch (error) {
    console.error("[LiveKit Token] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate voice session token" },
      { status: 500 }
    );
  }
}

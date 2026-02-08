/**
 * POST /api/livekit-token
 *
 * Generates a LiveKit access token for the voice page.
 * The token allows the browser client to join a LiveKit room
 * where the Python voice agent will also connect.
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
import { AccessToken } from "livekit-server-sdk";

// Environment variables (set in apps/web/.env.local)
const LIVEKIT_URL = process.env.LIVEKIT_URL!;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

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

    // Create access token
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      ttl: "15m", // Token valid for 15 minutes (enough for a single call)
    });

    // Grant permissions: join room, publish audio (microphone), subscribe to audio (agent voice)
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    console.log(`[LiveKit Token] Generated for identity=${identity}, room=${roomName}`);

    return NextResponse.json({
      token: jwt,
      roomName,
      url: LIVEKIT_URL,
    });
  } catch (error) {
    console.error("[LiveKit Token] Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate voice session token" },
      { status: 500 }
    );
  }
}

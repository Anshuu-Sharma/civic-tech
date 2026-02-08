/**
 * Voice Assistant Page - Browser-based voice interface for JanSunwai AI.
 *
 * Flow:
 * 1. Citizen clicks "Start Voice Call"
 * 2. Frontend requests a LiveKit token from /api/livekit-token
 * 3. Frontend connects to LiveKit room via livekit-client
 * 4. LiveKit dispatches the Python voice agent to the same room
 * 5. Citizen speaks (microphone) -> Deepgram STT -> Gemini LLM -> ElevenLabs TTS -> speaker
 * 6. Real-time transcript displayed on screen
 * 7. Citizen clicks "End Call" to disconnect
 * 8. If a grievance was filed, show summary
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  LiveKitRoom,
  useRoomContext,
  useLocalParticipant,
  useRemoteParticipants,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

// ============================================================================
// Types
// ============================================================================

interface TokenResponse {
  token: string;
  roomName: string;
  url: string;
}

type CallState = "idle" | "connecting" | "connected" | "disconnecting" | "error";

interface TranscriptEntry {
  id: string;
  speaker: "citizen" | "agent";
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function VoiceAssistantPage() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start call duration timer
  useEffect(() => {
    if (callState === "connected") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Request LiveKit token and start the call
  const startCall = useCallback(async () => {
    setCallState("connecting");
    setError(null);
    setTranscript([]);

    try {
      const response = await fetch("/api/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data: TokenResponse = await response.json();
      setTokenData(data);
      setCallState("connected");
    } catch (err) {
      console.error("Failed to start voice call:", err);
      setError("Voice service se connect nahi ho paya. Kripya dobara try karein.");
      setCallState("error");
    }
  }, []);

  // End the call
  const endCall = useCallback(() => {
    setCallState("disconnecting");
    setTokenData(null);
    setTimeout(() => setCallState("idle"), 500);
  }, []);

  // Add transcript entry
  const addTranscript = useCallback((entry: Omit<TranscriptEntry, "id">) => {
    setTranscript((prev) => [
      ...prev,
      { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">JanSunwai AI</h1>
              <p className="text-sm text-gray-500">Voice Grievance Filing</p>
            </div>
          </div>
          {callState === "connected" && (
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono text-green-700">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => { setError(null); setCallState("idle"); }}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Idle State */}
        {callState === "idle" && (
          <IdleView onStartCall={startCall} />
        )}

        {/* Connecting State */}
        {callState === "connecting" && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Connecting to voice agent...</p>
            <p className="text-gray-400 text-sm mt-2">Please allow microphone access</p>
          </div>
        )}

        {/* Connected State - LiveKit Room */}
        {callState === "connected" && tokenData && (
          <LiveKitRoom
            serverUrl={tokenData.url}
            token={tokenData.token}
            connect={true}
            audio={true}
            onDisconnected={() => endCall()}
            onError={(err) => {
              console.error("LiveKit room error:", err);
              setError("Voice connection mein error aaya. Kripya dobara try karein.");
              setCallState("error");
            }}
          >
            <ActiveCallView
              onEndCall={endCall}
              transcript={transcript}
              onTranscript={addTranscript}
            />
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}

        {/* Disconnecting State */}
        {callState === "disconnecting" && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Disconnecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Idle View - Before call starts
// ============================================================================

function IdleView({ onStartCall }: { onStartCall: () => void }) {
  return (
    <div className="text-center py-16">
      {/* Microphone illustration */}
      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Voice mein Shikayat Darj Karein
      </h2>
      <p className="text-gray-500 mb-2">
        File your complaint by speaking in Hindi or English
      </p>
      <p className="text-gray-400 text-sm mb-8">
        AI agent aapki baat sunkar shikayat darj karega, status batayega, aur aapke adhikar bhi batayega
      </p>

      <button
        onClick={onStartCall}
        className="inline-flex items-center gap-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Start Voice Call
      </button>

      {/* Feature list */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="text-orange-600 font-semibold">Hindi / English</span>
          </div>
          <div className="text-gray-500 text-sm">Apni bhasha mein baat karein - speak in your language</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-orange-600 font-semibold">AI Classification</span>
          </div>
          <div className="text-gray-500 text-sm">Automatic category, severity & department routing</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="text-orange-600 font-semibold">Legal Rights</span>
          </div>
          <div className="text-gray-500 text-sm">Aapke adhikar turant bataye jayenge</div>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-10 bg-white rounded-lg border border-gray-100 p-6 text-left shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works / Kaise kaam karta hai</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Start the call</div>
              <div className="text-sm text-gray-500">&quot;Start Voice Call&quot; button dabayein aur microphone allow karein</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Describe your problem</div>
              <div className="text-sm text-gray-500">Apni samasya batayein - agent aapki baat sunega</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Get your complaint number</div>
              <div className="text-sm text-gray-500">Complaint darj hogi, number milega, aur aapke adhikar bataye jayenge</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Active Call View - During an active voice session
// ============================================================================

function ActiveCallView({
  onEndCall,
  transcript,
  onTranscript,
}: {
  onEndCall: () => void;
  transcript: TranscriptEntry[];
  onTranscript: (entry: Omit<TranscriptEntry, "id">) => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [agentStatus, setAgentStatus] = useState<"waiting" | "listening" | "thinking" | "speaking">("waiting");
  const [isMuted, setIsMuted] = useState(false);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Listen for transcription events from LiveKit data messages
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant: unknown,
      kind: unknown,
      topic: string | undefined,
    ) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        if (data.type === "transcription") {
          onTranscript({
            speaker: data.speaker === "agent" ? "agent" : "citizen",
            text: data.text,
            timestamp: new Date(),
            isFinal: data.isFinal ?? true,
          });

          // Update agent status based on who is speaking
          if (data.speaker === "agent") {
            setAgentStatus("speaking");
          }
        }
      } catch {
        // Ignore non-JSON data messages
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, onTranscript]);

  // Track agent connection status
  useEffect(() => {
    if (remoteParticipants.length > 0) {
      setAgentStatus("listening");
    }
  }, [remoteParticipants]);

  // Toggle microphone
  const toggleMute = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [localParticipant, isMuted]);

  // Status indicator config
  const statusConfig = {
    waiting: { label: "Agent se connect ho raha hai...", color: "text-yellow-600", bgDot: "bg-yellow-500" },
    listening: { label: "Sun raha hai... (Listening)", color: "text-green-600", bgDot: "bg-green-500" },
    thinking: { label: "Soch raha hai... (Thinking)", color: "text-blue-600", bgDot: "bg-blue-500" },
    speaking: { label: "Bol raha hai... (Speaking)", color: "text-orange-600", bgDot: "bg-orange-500" },
  };

  const status = statusConfig[agentStatus];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 12rem)" }}>
      {/* Status bar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full animate-pulse ${status.bgDot}`} />
          <span className={`text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {remoteParticipants.length > 0 ? "Agent connected" : "Waiting for agent..."}
        </div>
      </div>

      {/* Voice visualization */}
      <div className="flex items-center justify-center py-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
          agentStatus === "speaking"
            ? "bg-orange-100 ring-4 ring-orange-300 ring-opacity-50 scale-110"
            : agentStatus === "listening"
            ? "bg-green-100 ring-4 ring-green-300 ring-opacity-50"
            : "bg-gray-100"
        }`}>
          <svg className={`w-10 h-10 ${
            agentStatus === "speaking" ? "text-orange-600" :
            agentStatus === "listening" ? "text-green-600" :
            "text-gray-400"
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-y-auto p-4 mb-4">
        {transcript.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="font-medium">Transcript yahan dikhega...</p>
            <p className="text-sm mt-1">Conversation transcript will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transcript.map((entry) => (
              <div
                key={entry.id}
                className={`flex ${entry.speaker === "citizen" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    entry.speaker === "citizen"
                      ? "bg-orange-100 text-orange-900"
                      : "bg-gray-100 text-gray-900"
                  } ${!entry.isFinal ? "opacity-60" : ""}`}
                >
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {entry.speaker === "citizen" ? "You" : "JanSunwai AI"}
                  </div>
                  <div className="text-sm">{entry.text}</div>
                  <div className="text-xs opacity-40 mt-1">
                    {entry.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="flex items-center justify-center gap-4 pb-4">
        {/* Mute button */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* End call button */}
        <button
          onClick={onEndCall}
          className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
          title="End Call"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

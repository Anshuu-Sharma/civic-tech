"""
JanSunwai AI Voice Agent -- Main Entry Point.

This is the LiveKit Agents worker entry point. It:
1. Pre-loads Silero VAD in the setup phase (once per process)
2. Defines the JanSunwaiAssistant Agent class (with instructions + tools)
3. Sets up the AgentSession with Deepgram STT, Gemini LLM, ElevenLabs TTS
4. Uses multilingual turn detection for Hindi/English conversations
5. Handles conversation lifecycle events (transcript capture, call end)

Run with:
    uv run python agent.py dev      # Local development (console worker)
    uv run python agent.py start    # Production
"""

import asyncio
import logging
import os
from datetime import datetime

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    llm,
)
from livekit.plugins import deepgram, elevenlabs, google, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from jansunwai_agent.config import load_config
from jansunwai_agent.prompts import build_system_prompt, get_initial_greeting
from jansunwai_agent.tools import ALL_TOOLS, set_api_client
from jansunwai_agent.api_client import JanSunwaiAPIClient

# Load environment variables
load_dotenv(".env")

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("jansunwai-agent")


# ============================================================================
# Agent Server
# ============================================================================

def setup(proc: JobProcess):
    """Pre-load heavy models once per worker process (runs before any job)."""
    logger.info("Pre-loading Silero VAD model...")
    proc.userdata["vad"] = silero.VAD.load()
    logger.info("Silero VAD pre-loaded successfully")


server = AgentServer(setup_fnc=setup)


# ============================================================================
# Agent Class
# ============================================================================

class JanSunwaiAssistant(Agent):
    """
    JanSunwai AI Grievance Assistant Agent.

    Extends the LiveKit Agent class with:
    - Full system prompt for civic grievance handling
    - Three function tools: file_grievance, check_status, get_legal_rights
    """

    def __init__(self):
        super().__init__(
            instructions=build_system_prompt(),
            tools=ALL_TOOLS,
        )
        logger.info(f"JanSunwaiAssistant initialized with {len(ALL_TOOLS)} tools")


# ============================================================================
# RTC Session Entrypoint
# ============================================================================

@server.rtc_session(
    agent_name=os.getenv("AGENT_NAME", "jansunwai-voice-agent"),
)
async def entrypoint(ctx: JobContext):
    """
    Main entry point for the LiveKit agent worker.

    Called when a participant joins a LiveKit room that dispatches to this agent.
    Flow:
      1. User clicks "Start Call" on the voice page
      2. Next.js API generates a LiveKit token and creates a room
      3. User joins the room via LiveKit client SDK
      4. LiveKit dispatches this agent to the room
      5. Agent connects, initializes session, and starts conversation
    """
    logger.info("=" * 70)
    logger.info(f"INCOMING VOICE SESSION - Room: {ctx.room.name}")
    logger.info("=" * 70)

    # ------------------------------------------------------------------
    # 1. Connect to the LiveKit room
    # ------------------------------------------------------------------
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info("Connected to room successfully")

    # ------------------------------------------------------------------
    # 2. Initialize API client and register with tools module
    # ------------------------------------------------------------------
    config = load_config()
    api_client = JanSunwaiAPIClient(config)
    set_api_client(api_client)
    logger.info("API client initialized and registered with tools")

    # ------------------------------------------------------------------
    # 3. Build the AgentSession with all AI components
    # ------------------------------------------------------------------
    logger.info("Initializing AgentSession with AI models...")

    session = AgentSession(
        # Use pre-loaded VAD from setup phase
        vad=ctx.proc.userdata["vad"],

        # Deepgram STT: nova-2-general with Hindi language
        stt=deepgram.STT(
            model="nova-2-general",
                language="hi",  
                smart_format=True,
                filler_words=True,
                numerals=True,
                interim_results=True,
        ),

        # Google Gemini LLM for conversation + tool calling
        llm=google.LLM(
            model="gemini-2.5-flash",
            temperature=0.4,
        ),

        # ElevenLabs TTS for natural Hindi/English speech
        tts=elevenlabs.TTS(
            voice_id=config.elevenlabs_voice_id,
            model="eleven_turbo_v2_5",
        ),

        # Multilingual turn detection (better for Hindi/English mixing)
        turn_detection=MultilingualModel(),

        # Generate response while user is still finishing — lower latency
        preemptive_generation=True,
    )

    logger.info("AgentSession initialized successfully")
    logger.info("  STT: Deepgram nova-2-general (Hindi)")
    logger.info("  LLM: Google Gemini 2.0 Flash")
    logger.info("  TTS: ElevenLabs eleven_turbo_v2_5")
    logger.info("  VAD: Silero (pre-loaded)")
    logger.info("  Turn Detection: Multilingual")

    # ------------------------------------------------------------------
    # 4. Event handlers: transcript capture + call end processing
    # ------------------------------------------------------------------
    call_start_time = datetime.now()
    conversation_transcript: list[str] = []

    @session.on("user_input_transcribed")
    def on_user_input(event):
        if event.is_final and event.transcript.strip():
            conversation_transcript.append(f"Citizen: {event.transcript}")
            logger.debug(f"Citizen said: {event.transcript}")

    @session.on("conversation_item_added")
    def on_agent_response(event):
        if event.item.role == "assistant" and event.item.text_content:
            conversation_transcript.append(f"Agent: {event.item.text_content}")
            logger.debug(f"Agent said: {event.item.text_content[:100]}...")

    @session.on("close")
    def on_session_close(event):
        async def _process_call_end():
            call_duration = int(
                (datetime.now() - call_start_time).total_seconds()
            )
            logger.info("=" * 70)
            logger.info("VOICE SESSION ENDED")
            logger.info(f"  Duration: {call_duration} seconds")
            logger.info(f"  Transcript messages: {len(conversation_transcript)}")
            logger.info("=" * 70)

            if conversation_transcript:
                logger.info("Full transcript:")
                for line in conversation_transcript:
                    logger.info(f"  {line}")

            await api_client.close()

        asyncio.create_task(_process_call_end())

    logger.info("Event handlers registered")

    # ------------------------------------------------------------------
    # 5. Create agent instance and start the session
    # ------------------------------------------------------------------
    agent_instance = JanSunwaiAssistant()

    await session.start(
        room=ctx.room,
        agent=agent_instance,
    )

    logger.info("Agent session started successfully")

    # ------------------------------------------------------------------
    # 6. Deliver initial greeting via direct TTS (not through LLM)
    # ------------------------------------------------------------------
    greeting = get_initial_greeting()
    logger.info(f"Delivering greeting: {greeting[:60]}...")

    # say() is sync — returns a SpeechHandle, do NOT await it
    session.say(greeting, allow_interruptions=True)

    logger.info("Initial greeting delivered")
    logger.info("=" * 70)
    logger.info("Agent is live and listening...")
    logger.info("=" * 70)


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    from livekit.agents import cli

    logger.info("")
    logger.info("=" * 70)
    logger.info("JANSUNWAI AI VOICE AGENT")
    logger.info("Civic Grievance Filing via Voice Conversation")
    logger.info("=" * 70)
    logger.info(f"  LiveKit URL: {os.getenv('LIVEKIT_URL', 'Not configured')}")
    logger.info(f"  Agent Name: {os.getenv('AGENT_NAME', 'jansunwai-voice-agent')}")
    logger.info(f"  API Base URL: {os.getenv('API_BASE_URL', 'Not configured')}")
    logger.info("  Languages: Hindi, English, Hinglish")
    logger.info("  STT: Deepgram nova-2-general")
    logger.info("  LLM: Google Gemini 2.0 Flash")
    logger.info("  TTS: ElevenLabs eleven_turbo_v2_5")
    logger.info("  VAD: Silero (pre-loaded)")
    logger.info("  Turn Detection: Multilingual")
    logger.info("=" * 70)
    logger.info("Starting agent worker...")
    logger.info("")

    cli.run_app(server)

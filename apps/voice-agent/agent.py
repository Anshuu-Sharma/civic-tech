"""
JanSunwai AI Voice Agent -- Main Entry Point.

This is the LiveKit Agents worker entry point. It:
1. Loads configuration and initializes the API client
2. Defines the JanSunwaiAssistant Agent class (with instructions + tools)
3. Sets up the AgentSession with Deepgram STT, Gemini LLM, ElevenLabs TTS, Silero VAD
4. Handles conversation lifecycle events (transcript capture, call end)
5. Runs as a LiveKit worker process via `agents.cli.run_app()`

Run with:
    python agent.py dev          # Local development
    python agent.py start        # Production
"""

import asyncio
import logging
import os
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    llm,
)
from livekit.plugins import deepgram, elevenlabs, google, silero

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
# Agent Class
# ============================================================================

class JanSunwaiAssistant(Agent):
    """
    JanSunwai AI Grievance Assistant Agent.

    Extends the LiveKit Agent class with:
    - Full system prompt for civic grievance handling
    - Three function tools: file_grievance, check_status, get_legal_rights
    - Conversation state tracking (for transcript capture)
    """

    def __init__(self):
        """Initialize the JanSunwai assistant with system prompt and tools."""

        instructions = build_system_prompt()

        super().__init__(
            instructions=instructions,
            tools=ALL_TOOLS,
        )

        # Conversation state for transcript capture
        self.conversation_data = {
            "grievances_filed": [],
            "status_checks": [],
            "call_start_time": datetime.now().isoformat(),
        }

        logger.info(f"JanSunwaiAssistant initialized with {len(ALL_TOOLS)} tools")


# ============================================================================
# Entrypoint
# ============================================================================

async def entrypoint(ctx: JobContext):
    """
    Main entry point for the LiveKit agent worker.

    Called when a participant joins a LiveKit room that dispatches to this agent.
    For the web-based voice page, the flow is:
      1. User clicks "Start Call" on the voice page
      2. Next.js API generates a LiveKit token and creates a room
      3. User joins the room via LiveKit client SDK
      4. LiveKit dispatches this agent to the room
      5. Agent connects, initializes session, and starts conversation

    Args:
        ctx: JobContext containing room and participant information.
    """
    logger.info("=" * 70)
    logger.info(f"INCOMING VOICE SESSION - Room: {ctx.room.name}")
    logger.info("=" * 70)

    # ------------------------------------------------------------------
    # 1. Connect to the LiveKit room
    # ------------------------------------------------------------------
    try:
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        logger.info("Connected to room successfully")
    except Exception as e:
        logger.error(f"Failed to connect to room: {e}", exc_info=True)
        return

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
    try:
        logger.info("Initializing AgentSession with AI models...")

        session = AgentSession(
            # ---- Speech-to-Text: Deepgram ----
            # nova-2-general with Hindi language for Indian citizen speech
            # smart_format enables punctuation + number formatting
            # interim_results enables real-time partial transcripts
            stt=deepgram.STT(
                model="nova-2-general",
                language="hi",
                smart_format=True,
                interim_results=True,
            ),

            # ---- LLM: Google Gemini ----
            # gemini-2.5-flash for fast, capable conversation + tool calling
            # temperature 0.6 for focused but natural responses
            llm=google.LLM(
                model="gemini-2.5-flash",
                temperature=0.6,
            ),

            # ---- Text-to-Speech: ElevenLabs ----
            # eleven_turbo_v2_5 for low-latency, natural Hindi/English speech
            # Voice ID from ELEVENLABS_VOICE_ID env var
            tts=elevenlabs.TTS(
                voice_id=config.elevenlabs_voice_id,
                model="eleven_turbo_v2_5",
            ),

            # ---- Voice Activity Detection: Silero ----
            # Detects when the user starts/stops speaking
            vad=silero.VAD.load(),
        )

        logger.info("AgentSession initialized successfully")
        logger.info("  STT: Deepgram nova-2-general (Hindi)")
        logger.info("  LLM: Google Gemini 2.5 Flash")
        logger.info("  TTS: ElevenLabs eleven_turbo_v2_5")
        logger.info("  VAD: Silero")

    except Exception as e:
        logger.error(f"Failed to initialize AgentSession: {e}", exc_info=True)
        await api_client.close()
        return

    # ------------------------------------------------------------------
    # 4. Event handlers: transcript capture + call end processing
    # ------------------------------------------------------------------

    call_start_time = datetime.now()
    conversation_transcript: list[str] = []

    @session.on("user_input_transcribed")
    def on_user_input(event):
        """Capture finalized user speech transcriptions."""
        if event.is_final and event.transcript.strip():
            conversation_transcript.append(f"Citizen: {event.transcript}")
            logger.debug(f"Citizen said: {event.transcript}")

    @session.on("conversation_item_added")
    def on_agent_response(event):
        """Capture agent responses added to the conversation."""
        if event.item.role == "assistant" and event.item.text_content:
            conversation_transcript.append(f"Agent: {event.item.text_content}")
            logger.debug(f"Agent said: {event.item.text_content[:100]}...")

    @session.on("close")
    def on_session_close(event):
        """Process and log call data when the session ends."""

        async def _process_call_end():
            call_duration = int(
                (datetime.now() - call_start_time).total_seconds()
            )

            logger.info("=" * 70)
            logger.info("VOICE SESSION ENDED")
            logger.info(f"  Duration: {call_duration} seconds")
            logger.info(f"  Transcript messages: {len(conversation_transcript)}")
            logger.info("=" * 70)

            # Log full transcript
            if conversation_transcript:
                logger.info("Full transcript:")
                for line in conversation_transcript:
                    logger.info(f"  {line}")

            # Clean up API client
            await api_client.close()

        asyncio.create_task(_process_call_end())

    logger.info("Event handlers registered")

    # ------------------------------------------------------------------
    # 5. Create agent instance and start the session
    # ------------------------------------------------------------------
    try:
        agent_instance = JanSunwaiAssistant()

        await session.start(
            room=ctx.room,
            agent=agent_instance,
        )

        logger.info("Agent session started successfully")

    except Exception as e:
        logger.error(f"Failed to start agent session: {e}", exc_info=True)
        await api_client.close()
        return

    # ------------------------------------------------------------------
    # 6. Deliver initial greeting
    # ------------------------------------------------------------------
    try:
        greeting = get_initial_greeting()
        logger.info(f"Delivering greeting: {greeting[:60]}...")

        await session.generate_reply(
            instructions=f"Greet the caller with this exact message: '{greeting}'"
        )

        logger.info("Initial greeting delivered")
        logger.info("=" * 70)
        logger.info("Agent is live and listening...")
        logger.info("=" * 70)

    except Exception as e:
        logger.error(f"Failed to generate initial greeting: {e}", exc_info=True)


# ============================================================================
# Worker entry point
# ============================================================================

if __name__ == "__main__":
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
    logger.info("  LLM: Google Gemini 2.5 Flash")
    logger.info("  TTS: ElevenLabs eleven_turbo_v2_5")
    logger.info("  VAD: Silero")
    logger.info("=" * 70)
    logger.info("Starting agent worker...")
    logger.info("")

    agents.cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name=os.getenv("AGENT_NAME", "jansunwai-voice-agent"),
        )
    )

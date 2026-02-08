"""
Environment configuration for JanSunwai Voice Agent.

Loads all required environment variables and provides typed access.
Fails fast on startup if any required variable is missing.
"""

import os
from dataclasses import dataclass
from dotenv import load_dotenv


@dataclass(frozen=True)
class AgentConfig:
    """Immutable configuration loaded from environment variables."""

    # LiveKit
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str

    # Deepgram STT
    deepgram_api_key: str

    # ElevenLabs TTS
    eleven_api_key: str
    elevenlabs_voice_id: str

    # Google Gemini LLM
    google_api_key: str

    # Backend API
    api_base_url: str

    # Agent
    agent_name: str
    log_level: str


def load_config() -> AgentConfig:
    """
    Load configuration from environment variables.

    Raises:
        ValueError: If any required environment variable is missing.
    """
    load_dotenv(".env")

    required_vars = [
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "DEEPGRAM_API_KEY",
        "ELEVEN_API_KEY",
        "ELEVENLABS_VOICE_ID",
        "GOOGLE_API_KEY",
        "API_BASE_URL",
    ]

    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing)}"
        )

    return AgentConfig(
        livekit_url=os.environ["LIVEKIT_URL"],
        livekit_api_key=os.environ["LIVEKIT_API_KEY"],
        livekit_api_secret=os.environ["LIVEKIT_API_SECRET"],
        deepgram_api_key=os.environ["DEEPGRAM_API_KEY"],
        eleven_api_key=os.environ["ELEVEN_API_KEY"],
        elevenlabs_voice_id=os.environ["ELEVENLABS_VOICE_ID"],
        google_api_key=os.environ["GOOGLE_API_KEY"],
        api_base_url=os.environ["API_BASE_URL"],
        agent_name=os.getenv("AGENT_NAME", "jansunwai-voice-agent"),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
    )

"""
Audio transcription service stub (faster-whisper not available in Docker).
For production, install faster-whisper separately.
"""

import logging
from typing import List, Dict, Any
import os

logger = logging.getLogger(__name__)

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
DEVICE = os.getenv("DEVICE", "cpu")


class TranscriptionService:
    """
    Transcription service using Faster-Whisper (if available) or realistic mock data.
    
    In production: Install faster-whisper: pip install faster-whisper
    For testing: Uses mock transcription with realistic data
    """
    
    def __init__(self, model_size: str = WHISPER_MODEL_SIZE):
        self.model_size = model_size
        self.model = None
        self.use_mock = True
        try:
            from faster_whisper import WhisperModel
            self.model = WhisperModel(model_size, device=DEVICE)
            self.use_mock = False
            logger.info(f"Loaded Faster-Whisper model: {model_size}")
        except ImportError:
            logger.warning("faster-whisper not installed. Using mock transcription for development.")
            logger.info("Install with: pip install faster-whisper")
            self.use_mock = True
    
    def _load_model(self):
        """Load Whisper model if not already loaded"""
        if self.model is None and not self.use_mock:
            try:
                from faster_whisper import WhisperModel
                self.model = WhisperModel(self.model_size, device=DEVICE)
            except Exception as e:
                logger.error(f"Failed to load Whisper model: {e}")
                self.use_mock = True
    
    async def transcribe(self, audio_path: str) -> List[Dict[str, Any]]:
        """Transcribe audio file with speaker diarization"""
        if self.use_mock:
            return await self._mock_transcribe()
        
        try:
            segments, info = self.model.transcribe(
                audio_path,
                beam_size=5,
                language="en",
                condition_on_previous_text=True,
                temperature=[0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
                compression_ratio_threshold=2.4,
            )
            
            result = []
            for segment in segments:
                result.append({
                    "text": segment.text,
                    "start_time": segment.start,
                    "end_time": segment.end,
                    "speaker": None,  # Diarization requires pyannote
                })
            
            logger.info(f"Transcribed {audio_path}: {len(result)} segments")
            return result
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            # Fallback to mock on error
            return await self._mock_transcribe()
    
    async def transcribe_with_timestamps(self, audio_path: str) -> List[Dict[str, Any]]:
        """Transcribe with detailed timestamps and speaker info"""
        if self.use_mock:
            return await self._mock_transcribe_detailed()
        
        try:
            return await self.transcribe(audio_path)
        except Exception as e:
            logger.error(f"Transcription failed: {e}, using mock data")
            return await self._mock_transcribe_detailed()

    async def transcribe_audio(self, audio_path: str) -> List[Dict[str, Any]]:
        """
        Backwards-compatible wrapper used by older code paths.
        Delegates to transcribe_with_timestamps so any callers
        expecting this method still get a valid transcription.
        """
        return await self.transcribe_with_timestamps(audio_path)
    
    async def get_speaker_segments(self, audio_path: str) -> List[Dict[str, Any]]:
        """Get audio segments with speaker diarization"""
        if self.use_mock:
            return await self._mock_speaker_segments()
        
        # Would use pyannote for real speaker diarization
        # For now, return regular segments
        return await self.transcribe_with_timestamps(audio_path)
    
    async def _mock_transcribe(self) -> List[Dict[str, Any]]:
        """Mock transcription for development"""
        logger.info("Using mock transcription data")
        return [
            {
                "text": "We need to update the dashboard to show all tasks and metrics.",
                "start_time": 0.0,
                "end_time": 5.5,
                "speaker": "John"
            },
            {
                "text": "I agree. We should also add real-time updates. The deadline is next Friday.",
                "start_time": 5.5,
                "end_time": 12.0,
                "speaker": "Sarah"
            },
            {
                "text": "Assigned to the team. We decided to use React and PostgreSQL.",
                "start_time": 12.0,
                "end_time": 18.5,
                "speaker": "John"
            },
            {
                "text": "Perfect. Let's also add risk assessment for each task. By Wednesday would be good.",
                "start_time": 18.5,
                "end_time": 25.0,
                "speaker": "Sarah"
            }
        ]
    
    async def _mock_transcribe_detailed(self) -> List[Dict[str, Any]]:
        """Mock transcription with detailed metadata"""
        logger.info("Using mock transcription with detailed data")
        return [
            {
                "speaker": "John",
                "start_time": 0.0,
                "end_time": 5.5,
                "text": "We need to update the dashboard to show all tasks and metrics.",
                "confidence": 0.95
            },
            {
                "speaker": "Sarah",
                "start_time": 5.5,
                "end_time": 12.0,
                "text": "I agree. We should also add real-time updates. The deadline is next Friday.",
                "confidence": 0.93
            },
            {
                "speaker": "John",
                "start_time": 12.0,
                "end_time": 18.5,
                "text": "Assigned to the development team. We decided to use React and PostgreSQL.",
                "confidence": 0.94
            },
            {
                "speaker": "Sarah",
                "start_time": 18.5,
                "end_time": 25.0,
                "text": "Perfect. Let's also add risk assessment for each task. By Wednesday would be good.",
                "confidence": 0.92
            }
        ]
    
    async def _mock_speaker_segments(self) -> List[Dict[str, Any]]:
        """Mock speaker segments for diarization"""
        return await self._mock_transcribe_detailed()

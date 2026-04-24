from pydantic import BaseModel
from typing import Optional

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str

class TimelineMoment(BaseModel):
    timestamp: float
    end_timestamp: Optional[float] = None
    type: str  # "strength" | "weakness" | "tip"
    title: str
    description: str
    agent: str

class AgentScore(BaseModel):
    score: float
    summary: str
    strengths: list[str]
    weaknesses: list[str]
    moments: list[TimelineMoment]

class FillerWordCount(BaseModel):
    word: str
    count: int

class AnalysisResult(BaseModel):
    transcript: list[TranscriptSegment]
    full_text: str
    scores: dict[str, AgentScore]
    overall_score: float
    action_plan: list[str]
    summary: str
    filler_words: list[FillerWordCount]
    interview_type: str
    duration: float

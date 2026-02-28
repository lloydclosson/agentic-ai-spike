from pydantic import BaseModel, Field
from pydantic_ai import Agent

from ai_service.config import settings


class AgentResponse(BaseModel):
    answer: str = Field(description="The agent's response")
    confidence: float = Field(ge=0, le=1, description="Confidence score 0-1")


spike_agent = Agent(
    settings.default_model,
    output_type=AgentResponse,
    instructions=(
        "You are a helpful AI assistant for an agentic AI spike project. "
        "Answer questions concisely and provide a confidence score."
    ),
)

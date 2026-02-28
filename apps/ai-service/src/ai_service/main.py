from fastapi import FastAPI
from pydantic import BaseModel

from ai_service.agents.spike_agent import AgentResponse, spike_agent
from ai_service.config import settings

app = FastAPI(title=settings.app_name)


class QueryRequest(BaseModel):
    query: str
    model: str | None = None


class QueryResponse(BaseModel):
    answer: str
    confidence: float


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok", "service": "ai-service"}


@app.post("/api/v1/query", response_model=QueryResponse)
async def query_agent(request: QueryRequest) -> QueryResponse:
    result = await spike_agent.run(request.query)
    output: AgentResponse = result.output

    return QueryResponse(
        answer=output.answer,
        confidence=output.confidence,
    )

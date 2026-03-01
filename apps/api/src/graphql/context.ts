import type { YogaInitialContext } from "graphql-yoga";
import { type DB, db } from "../db/index.js";
import { type AgentService, agentService } from "../services/agent-service.js";
import { pubSub } from "./pubsub.js";

export interface GraphQLContext {
  db: DB;
  currentEmployeeId: string | null;
  pubSub: typeof pubSub;
  agentService: AgentService;
}

export async function createContext(initialCtx: YogaInitialContext): Promise<GraphQLContext> {
  const employeeId = initialCtx.request.headers.get("x-employee-id") ?? null;

  return {
    db,
    currentEmployeeId: employeeId,
    pubSub,
    agentService,
  };
}

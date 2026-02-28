import { gql, useQuery } from "@apollo/client";
import { createFileRoute } from "@tanstack/react-router";

const HEALTH_QUERY = gql`
  query Health {
    health
  }
`;

const AGENTS_QUERY = gql`
  query GetAgents {
    agents {
      id
      name
      description
      model
      createdAt
    }
  }
`;

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data: healthData, loading: healthLoading } = useQuery(HEALTH_QUERY);
  const { data: agentsData, loading: agentsLoading } = useQuery(AGENTS_QUERY);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Agentic AI Spike</h1>

      <section>
        <h2>API Status</h2>
        {healthLoading ? (
          <p>Checking API...</p>
        ) : (
          <p>
            API Health: <strong>{healthData?.health ?? "unknown"}</strong>
          </p>
        )}
      </section>

      <section>
        <h2>Agents</h2>
        {agentsLoading ? (
          <p>Loading agents...</p>
        ) : agentsData?.agents?.length > 0 ? (
          <ul>
            {agentsData.agents.map((agent: { id: number; name: string; model: string }) => (
              <li key={agent.id}>
                <strong>{agent.name}</strong> ({agent.model})
              </li>
            ))}
          </ul>
        ) : (
          <p>
            No agents yet. Create one via the GraphQL playground at{" "}
            <a href="http://localhost:4000/graphql">localhost:4000/graphql</a>.
          </p>
        )}
      </section>
    </div>
  );
}

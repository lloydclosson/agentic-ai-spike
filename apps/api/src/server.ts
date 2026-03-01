import "dotenv/config";
import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { createContext } from "./graphql/context.js";
import { schema } from "./graphql/schema/index.js";

const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/graphql",
});

const server = createServer(yoga);
const port = Number(process.env.PORT) || 4000;

server.listen(port, () => {
  console.log(`GraphQL API running at http://localhost:${port}/graphql`);
});

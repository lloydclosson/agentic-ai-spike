import "dotenv/config";
import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema/index.js";

const yoga = createYoga({
  schema,
  graphiql: true,
});

const server = createServer(yoga);

const port = Number(process.env.PORT) || 4000;

server.listen(port, () => {
  console.log(`API server running at http://localhost:${port}/graphql`);
});

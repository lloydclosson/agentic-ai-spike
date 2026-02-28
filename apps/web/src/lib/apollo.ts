import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export function createApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri:
        typeof window !== "undefined"
          ? (import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:4000/graphql")
          : (process.env.GRAPHQL_URL ?? "http://api:4000/graphql"),
    }),
  });
}

/// <reference types="vite/client" />

import { ApolloProvider } from "@apollo/client";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createApolloClient } from "~/lib/apollo";

const apolloClient = createApolloClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Agentic AI Spike" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
        <Scripts />
      </body>
    </html>
  );
}

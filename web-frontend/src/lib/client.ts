import { createClient as createWSClient } from "graphql-ws";

import { cacheExchange, Client, fetchExchange, subscriptionExchange } from "@urql/svelte";

export const getClient = (chainId: string, applicationId: string, port: string) => {
  const wsClient = createWSClient({
    url: `ws://localhost:${port}/ws`,
  });

  return new Client({
    url: `http://localhost:${port}/chains/${chainId}/applications/${applicationId}`,
    exchanges: [
      cacheExchange,
      fetchExchange,
      subscriptionExchange({
        forwardSubscription(request) {
          const input = { ...request, query: request.query || "" };
          console.log("---request", request);
          return {
            subscribe(sink) {
              console.log("---input", input);
              const unsubscribe = wsClient.subscribe(input, sink);
              return { unsubscribe };
            },
          };
        },
      }),
    ],
  });
};

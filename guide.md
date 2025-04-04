Server Hosting
Host MCP Servers on MCP.so

Good to Know
before hosting your MCP Server to MCP.so, good to know:

Your MCP Server should be Open-Sourced, with Commercial-Use-Friendly License like MIT, Apache, etc.
Your MCP Server won't read local datas, like files, local databases, etc.
Your MCP Server currently running with stdio transport, not suitable for concurrent calls.
Host Your MCP Server
follow these steps to host your MCP Server on MCP.so

Install SDK by @chatmcp

npm install @chatmcp/sdk
Modify the way parameters are passed

// before: get params from env and set as global params
 
// Retrieve the Perplexity API key from environment variables
// const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
// if (!PERPLEXITY_API_KEY) {
//   console.error("Error: PERPLEXITY_API_KEY environment variable is required");
//   process.exit(1);
// }
 
// after: get params from env or command line, set as global params
import { getParamValue, getAuthValue } from "@chatmcp/sdk/utils/index.js";
 
const perplexityApiKey = getParamValue("perplexity_api_key") || "";
 
const mode = getParamValue("mode") || "stdio";
const port = getParamValue("port") || 9593;
const endpoint = getParamValue("endpoint") || "/rest";
 
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // before: use global params
 
    // after: get auth params from request, if global params not set
    const apiKey =
      perplexityApiKey || getAuthValue(request, "PERPLEXITY_API_KEY");
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY not set");
    }
 
    const { name, arguments: args } = request.params;
    if (!args) {
      throw new Error("No arguments provided");
    }
    switch (name) {
      case "perplexity_ask": {
        if (!Array.isArray(args.messages)) {
          throw new Error(
            "Invalid arguments for perplexity_ask: 'messages' must be an array"
          );
        }
 
        const messages = args.messages;
 
        // before: use global params in every function
        // const result = await performChatCompletion(
        //   messages,
        //   "sonar-pro"
        // );
 
        // after: pass params to every function
        const result = await performChatCompletion(
          apiKey,
          messages,
          "sonar-pro"
        );
 
        return {
          content: [{ type: "text", text: result }],
          isError: false,
        };
      }
      // ...
    }
  } catch (error) {
    // Return error details in the response
    return {
      content: [
        {
          type: "text",
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
});
Add rest server transport

import { RestServerTransport } from "@chatmcp/sdk/server/rest.js";
 
async function runServer() {
  try {
    // after: MCP Server run with rest transport and stdio transport
    if (mode === "rest") {
      const transport = new RestServerTransport({
        port,
        endpoint,
      });
      await server.connect(transport);
 
      await transport.startServer();
 
      return;
    }
 
    // before: MCP Server only run with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(
      "Perplexity MCP Server running on stdio with Ask, Research, and Reason tools"
    );
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}
Add Dockerfile

FROM node:22.12-alpine AS builder
 
COPY ./ /app
 
WORKDIR /app
 
RUN --mount=type=cache,target=/root/.npm npm install
 
FROM node:22.12-alpine AS release
 
WORKDIR /app
 
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json
 
ENV NODE_ENV=production
 
RUN npm ci --ignore-scripts --omit-dev
 
ENTRYPOINT ["node", "dist/index.js"]
Add chatmcp.yaml

 
params:
  type: object
  properties:
    PERPLEXITY_API_KEY:
      type: string
      description: Perplexity Sonar API Key
  required:
    - PERPLEXITY_API_KEY
 
rest:
  name: perplexity
  port: 9593
  endpoint: /rest
 
npx:
  command:
    | PERPLEXITY_API_KEY={PERPLEXITY_API_KEY} npx -y server-perplexity-ask
  config:
    | {
        "mcpServers": {
          "perplexity-ask": {
            "command": "npx",
            "args": [
              "-y",
              "server-perplexity-ask"
            ],
            "env": {
              "PERPLEXITY_API_KEY": "YOUR_API_KEY_HERE"
            }
          }
        }
      }
 
docker:
  command:
    | docker run -i --rm -e PERPLEXITY_API_KEY={PERPLEXITY_API_KEY} mcp/perplexity-ask
  config:
    | {
        "mcpServers": {
          "perplexity-ask": {
            "command": "docker",
            "args": [
              "run",
              "-i",
              "--rm",
              "-e",
              "PERPLEXITY_API_KEY",
              "mcp/perplexity-ask"
            ],
            "env": {
              "PERPLEXITY_API_KEY": "YOUR_API_KEY_HERE"
            }
          }
        }
      }
Upload your MCP Server code to Github

Submit your MCP Server to MCP.so

We will review your MCP Server to ensure it is ready for Hosting.

You will see your MCP Server on MCP Playground after it is hosted.

Hosting Servers Examples
perplexity-ask
mcp-server-flomo
aws-kb-retrieval-server
github
everart
brave-search
Contact Us
contact us via the following channels to ask for help.

Discord
Telegram
Twitter
Github Issues
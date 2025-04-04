#!/usr/bin/env node

/**
 * MCP server for Memos
 * Implements tools for interacting with Memos API
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RestServerTransport } from "@chatmcp/sdk/server/rest.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MemosClient, Visibility } from "./memos.js";
import { getParamValue, getAuthValue } from "@chatmcp/sdk/utils/index.js";

// 获取参数配置，优先顺序：参数传递 > 环境变量
const memosUrl = getParamValue("memos_url") || process.env.MEMOS_URL || "";
const memosToken = getParamValue("memos_token") || process.env.MEMOS_TOKEN || "";

// 获取服务器模式和端口配置
const mode = getParamValue("mode") || "stdio";
const port = parseInt(getParamValue("port") || "9593");
const endpoint = getParamValue("endpoint") || "/rest";

/**
 * 解析命令行参数
 * 示例: node index.js --memos_url=https://memos.example.com --memos_token=your_token
 */
function parseArgs() {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      if (key && value) {
        args[key] = value;
      }
    }
  });
  return args;
}

/**
 * 获取配置信息
 * 优先级: 参数传递 > 命令行参数 > 环境变量
 */
function getConfig(request?: any) {
  const args = parseArgs();
  
  // 获取 Memos URL
  const url = getAuthValue(request, "MEMOS_URL") || memosUrl || args.memos_url || process.env.MEMOS_URL;
  if (!url) {
    throw new Error("请设置 Memos URL。可通过以下方式设置:\n" +
      "1. 环境变量: MEMOS_URL=https://your-memos-server\n" +
      "2. 命令行参数: --memos_url=https://your-memos-server");
  }

  // 获取 Memos Token
  const token = getAuthValue(request, "MEMOS_TOKEN") || memosToken || args.memos_token || process.env.MEMOS_TOKEN;
  if (!token) {
    throw new Error("请设置 Memos Token。可通过以下方式设置:\n" +
      "1. 环境变量: MEMOS_TOKEN=your_token\n" +
      "2. 命令行参数: --memos_token=your_token");
  }

  return {
    baseUrl: url,
    token: token
  };
}

/**
 * Create an MCP server with capabilities for tools.
 */
const server = new Server(
  {
    name: "mcp-server-memos",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_memo",
        description: "Search for memos using keywords",
        inputSchema: {
          type: "object",
          properties: {
            key_word: {
              type: "string",
              description: "The keywords to search for in memo content"
            }
          },
          required: ["key_word"]
        }
      },
      {
        name: "create_memo",
        description: "Create a new memo",
        inputSchema: {
          type: "object", 
          properties: {
            content: {
              type: "string",
              description: "The content of the memo"
            },
            visibility: {
              type: "string",
              enum: Object.values(Visibility),
              description: "Memo visibility",
              default: Visibility.PRIVATE
            }
          },
          required: ["content"]
        }
      },
      {
        name: "get_memo",
        description: "Get a specific memo by ID",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string", 
              description: "The name/ID of the memo (format: memos/{id})"
            }
          },
          required: ["name"]
        }
      },
      {
        name: "update_memo",
        description: "Update a specific memo by ID",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name/ID of the memo (format: memos/{id})"
            },
            content: {
              type: "string",
              description: "The content of the memo"
            }
          },
          required: ["name", "content"]
        }
      }
    ]
  };
});

/**
 * Handler for tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  let config;
  try {
    config = getConfig(request);
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `配置错误: ${error.message}`
        }
      ]
    };
  }

  const memos = new MemosClient(config);

  switch (request.params.name) {
    case "search_memo": {
      const keyWord = String(request.params.arguments?.key_word);
      if (!keyWord) {
        throw new Error("关键词不能为空");
      }
      const result = await memos.searchMemos({ keyWord });
      return {
        content: [
          {
            type: "text",
            text: `搜索结果: ${JSON.stringify(result)}`
          }
        ]
      };
    }

    case "create_memo": {
      const content = String(request.params.arguments?.content);
      const visibility = (request.params.arguments?.visibility || Visibility.PRIVATE) as Visibility;
      if (!content) {
        throw new Error("内容不能为空");
      }
      const result = await memos.createMemo({ content, visibility });
      const memoUrl = `${config.baseUrl}/${result.name}`;
      return {
        content: [
          {
            type: "text",
            text: `笔记创建成功，访问地址: ${memoUrl}`
          }
        ]
      };
    }

    case "get_memo": {
      const name = String(request.params.arguments?.name);
      if (!name) {
        throw new Error("笔记ID不能为空");
      }
      const result = await memos.getMemo({ name });
      return {
        content: [
          {
            type: "text",
            text: `笔记内容: ${JSON.stringify(result)}`
          }
        ]
      };
    }

    case "update_memo": {
      const name = String(request.params.arguments?.name);
      const content = String(request.params.arguments?.content);
      if (!name || !content) {
        throw new Error("笔记ID和内容不能为空");
      }
      const result = await memos.updateMemo({ name, content });
      const memoUrl = `${config.baseUrl}/${result.name}`;
      return {
        content: [
          {
            type: "text",
            text: `笔记更新成功，访问地址: ${memoUrl}`
          }
        ]
      };
    }

    default:
      throw new Error("未知的工具名称");
  }
});

/**
 * Start the server using stdio or rest transport.
 */
async function main() {
  try {
    // 在启动服务器前验证是否可以获取配置
    if (!memosUrl || !memosToken) {
      getConfig();
    }

    // 根据模式选择传输方式
    if (mode === "rest") {
      const transport = new RestServerTransport({
        port,
        endpoint,
      });
      await server.connect(transport);
      await transport.startServer();
      console.error(`Memos MCP服务运行于REST模式，端口：${port}，路径：${endpoint}`);
      return;
    }

    // 默认使用stdio传输
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Memos MCP服务运行于STDIO模式");
  } catch (error: any) {
    console.error("服务器错误:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("服务器错误:", error);
  process.exit(1);
});
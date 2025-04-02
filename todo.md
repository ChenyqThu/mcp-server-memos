## 需求：
创建一个与 memos 交互的 MCP Server，支持在 MCP Client 中通过自然语言交互与 memos (https://github.com/usememos/memos) 笔记交互，包括读取相关笔记，新建笔记，更新笔记等；

## Features
🔍 Search memos with keywords
✨ Create new memos with customizable visibility
📖 Retrieve memo content by ID
🏷️ List and manage memo tags
🔐 Secure authentication using access tokens

## Configuration
Parameter	Description	    Default
MEMOS_URL	Memos server hostname with port	https://localhost:5320
MEMOS_TOKEN	Access token for authentication	"your_api_key"

## Available Tools
This MCP server provides the following tools for interacting with Memos:
Tool Name	Description	Parameters
- list_memo_tags	List all existing memo tags	
    - parent: The parent who owns the tags (format: memos/{id}, default: "memos/-")
    - visibility: Tag visibility (PUBLIC/PROTECTED/PRIVATE, default: PRIVATE)
- search_memo	Search for memos using keywords	
    - key_word: The keywords to search for in memo content
- create_memo	Create a new memo	
    - content: The content of the memo
    - visibility: Memo visibility (PUBLIC/PROTECTED/PRIVATE, default: PRIVATE)
- get_memo	Get a specific memo by ID	
    - name: The name/ID of the memo (format: memos/{id})
- update_memo   Update a specific memo by ID
    - name: the name/ID of the memo (format: memos/{id})
    - content: The content of the memo

## ref docks : Memos的API文档

# MCP Server Memos

这是一个 MCP 服务器,用于与 [Memos](https://github.com/usememos/memos) 笔记服务进行交互。通过这个服务器,你可以在任何支持 MCP 协议的客户端中使用自然语言与 Memos 进行交互。

## 功能特性

- 🔍 搜索笔记
- ✨ 创建新笔记(支持设置可见性)
- 📖 获取笔记内容
- ✏️ 更新笔记内容
- 🔐 使用访问令牌进行安全认证

## 配置说明

### 环境变量

你可以通过以下两种方式之一配置服务器:

1. 环境变量:
```bash
MEMOS_URL=https://your-memos-server  # Memos 服务器地址
MEMOS_TOKEN=your_access_token        # 访问令牌
```

2. 命令行参数:
```bash
--memos_url=https://your-memos-server
--memos_token=your_access_token
```

### 在 Cursor 中配置

在 Cursor 的配置文件中(通常位于 `~/.cursor/mcp.json`)添加以下配置:

```json
{
  "mcpServers": {
    "mcp-server-memos": {
      "command": "node",
      "args": ["/path/to/mcp-server-memos/build/index.js"],
      "env": {
        "MEMOS_URL": "https://your-memos-server",
        "MEMOS_TOKEN": "your_access_token"
      }
    }
  }
}
```

## 安装和运行

1. 克隆仓库:
```bash
git clone https://github.com/your-username/mcp-server-memos.git
cd mcp-server-memos
```

2. 安装依赖:
```bash
npm install
```

3. 创建 `.env` 文件:
```bash
MEMOS_URL=https://your-memos-server
MEMOS_TOKEN=your_access_token
```

4. 运行服务:
```bash
npm run inspector
```

## 可用工具

服务器提供以下工具:

1. `search_memo` - 搜索笔记
   - key_word: 搜索关键词

2. `create_memo` - 创建新笔记
   - content: 笔记内容
   - visibility: 笔记可见性 (PUBLIC/PROTECTED/PRIVATE, 默认: PRIVATE)

3. `get_memo` - 获取指定笔记
   - name: 笔记ID (格式: memos/{id})

4. `update_memo` - 更新指定笔记
   - name: 笔记ID (格式: memos/{id})
   - content: 新的笔记内容

## 使用示例

在 Cursor 中,你可以这样使用:

1. 创建笔记:
```
帮我记录一条笔记: 今天学习了 MCP Server 开发
```

2. 搜索笔记:
```
搜索包含 "MCP" 关键词的笔记
```

## 开发说明

- 使用 TypeScript 开发
- 使用 dotenv 管理环境变量
- 支持热重载开发 (npm run watch)

## 注意事项

- 请妥善保管你的访问令牌
- 建议将 `.env` 文件添加到 `.gitignore`
- 在生产环境中使用时,建议使用环境变量而不是命令行参数传递敏感信息

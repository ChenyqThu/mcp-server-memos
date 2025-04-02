from enum import Enum
from typing import Annotated

from grpclib.client import Channel
from mcp import McpError, stdio_server, types
from mcp.server import Server
from pydantic import BaseModel, Field, TypeAdapter

from .config import Config
from .proto_gen.memos.api import v1 as memos_api_v1


class MemosTools(str, Enum):
    LIST_MEMO_TAGS = "list_memo_tags"
    SEARCH_MEMO = "search_memo"
    CREATE_MEMO = "create_memo"
    GET_MEMO = "get_memo"


class Visibility(str, Enum):
    PUBLIC = "PUBLIC"
    PROTECTED = "PROTECTED"
    PRIVATE = "PRIVATE"

    def to_proto(self):
        return memos_api_v1.Visibility.from_string(self.value)


class SearchMemoRequest(BaseModel):
    """Request to search memo"""

    key_word: Annotated[
        str,
        Field(
            description="""The key words to search for in the memo content.""",
        ),
    ]


class CreateMemoRequest(BaseModel):
    """Request to create memo"""

    content: Annotated[
        str,
        Field(
            description="""The content of the memo.""",
        ),
    ]
    visibility: Annotated[
        Visibility,
        Field(default=Visibility.PRIVATE, description="""The visibility of the memo."""),
    ]


class GetMemoRequest(BaseModel):
    """Request to get memo"""

    name: Annotated[
        str,
        Field(
            description="""The name of the memo.
Format: memos/{id}
"""
        ),
    ]


class ListMemoTagsRequest(BaseModel):
    """Request to list memo tags"""

    parent: Annotated[
        str,
        Field(
            default="memos/-",
            description="""The parent, who owns the tags.
Format: memos/{id}. Use "memos/-" to list all tags.
""",
        ),
    ]
    visibility: Annotated[
        Visibility,
        Field(default=Visibility.PRIVATE, description="""The visibility of the tags."""),
    ]


class MemoServiceToolAdapter:
    memo_service: memos_api_v1.MemoServiceStub

    def __init__(self, config: Config):
        metadata = {"authorization": f"Bearer {config.token}"}
        channel = Channel(config.host, config.port)
        self.memo_service = memos_api_v1.MemoServiceStub(channel, metadata=metadata)

    # search
    async def search_memo(self, args: dict) -> list[types.TextContent]:
        try:
            params = SearchMemoRequest.model_validate(args)
        except Exception as e:
            raise McpError(types.INVALID_PARAMS, str(e))

        req = memos_api_v1.ListMemosRequest(
            filter=f"row_status == 'NORMAL' && content_search == ['{params.key_word}']"
        )
        res = await self.memo_service.list_memos(list_memos_request=req)
        content = ", ".join([memo.content for memo in res.memos])
        content = f"Search result:\n{content}"
        return [types.TextContent(type="text", text=content)]

    # create
    async def create_memo(self, args: dict) -> list[types.TextContent]:
        try:
            params = CreateMemoRequest.model_validate(args)
        except Exception as e:
            raise McpError(types.INVALID_PARAMS, str(e))

        req = memos_api_v1.CreateMemoRequest(
            content=params.content,
            visibility=params.visibility.to_proto(),
        )
        res = await self.memo_service.create_memo(create_memo_request=req)
        content = f"Memo created: {res.name}"
        return [types.TextContent(type="text", text=content)]

    # get
    async def get_memo(self, args: dict) -> list[types.TextContent]:
        try:
            params = GetMemoRequest.model_validate(args)
        except Exception as e:
            raise McpError(types.INVALID_PARAMS, str(e))

        req = memos_api_v1.GetMemoRequest(name=params.name)
        res = await self.memo_service.get_memo(get_memo_request=req)
        content = f"Memo:\n{res.content}"
        return [types.TextContent(type="text", text=content)]

    # list tags
    async def list_memo_tags(self, args: dict) -> list[types.TextContent]:
        try:
            params = ListMemoTagsRequest.model_validate(args)
        except Exception as e:
            raise McpError(types.INVALID_PARAMS, str(e))

        req = memos_api_v1.ListMemoTagsRequest(
            parent=params.parent,
            filter=f"visibilities == ['{params.visibility.value}']",
        )
        res = await self.memo_service.list_memo_tags(list_memo_tags_request=req)
        content = ", ".join(res.tag_amounts.keys())
        content = f"Tags:\n{content}"
        return [types.TextContent(type="text", text=content)]


def new_server(config: Config) -> Server:
    tool_adapter = MemoServiceToolAdapter(config)
    server = Server("mcp-server-memos")

    @server.list_tools()
    async def list_tools() -> list[types.Tool]:
        return [
            types.Tool(
                name=MemosTools.SEARCH_MEMO,
                description="Search for memos",
                inputSchema=SearchMemoRequest.model_json_schema(),
            ),
            types.Tool(
                name=MemosTools.CREATE_MEMO,
                description="Create a new memo",
                inputSchema=CreateMemoRequest.model_json_schema(),
            ),
            types.Tool(
                name=MemosTools.GET_MEMO,
                description="Get a memo",
                inputSchema=GetMemoRequest.model_json_schema(),
            ),
            types.Tool(
                name=MemosTools.LIST_MEMO_TAGS,
                description="List all existing memo tags",
                inputSchema=ListMemoTagsRequest.model_json_schema(),
            ),
        ]

    # search
    @server.call_tool()
    async def call_tool(name: str, args: dict) -> list[types.TextContent]:
        if name == MemosTools.SEARCH_MEMO:
            return await tool_adapter.search_memo(args)
        elif name == MemosTools.CREATE_MEMO:
            return await tool_adapter.create_memo(args)
        elif name == MemosTools.GET_MEMO:
            return await tool_adapter.get_memo(args)
        elif name == MemosTools.LIST_MEMO_TAGS:
            return await tool_adapter.list_memo_tags(args)
        else:
            raise McpError(types.INVALID_PARAMS, f"Unknown tool: {name}")

    return server


async def serve_stdio(config: Config):
    server = new_server(config)
    options = server.create_initialization_options()
    # print("serve_stdio, options:", options)
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, options, raise_exceptions=True)
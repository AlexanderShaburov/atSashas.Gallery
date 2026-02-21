# app/routers/block/public_blocks.py

from fastapi import APIRouter, HTTPException, Query

from app.repos.collection_repo import block_collection_repo
from app.repos.public_stream_repo import public_stream_repo
from app.repos.stream_repo import StreamRepo

public_router = APIRouter(
    prefix="/public/blocks",
    tags=["public-blocks"],
)

_stream_repo = StreamRepo()


@public_router.get("")
async def get_blocks_for_published_stream(
    stream_id: str = Query(..., min_length=1),
):
    """
    Return blocks belonging to a published stream.
    Only returns blocks for streams in the PublicStream list.
    No authentication required.
    """
    public_stream = await public_stream_repo.get()
    if stream_id not in public_stream.streamIds:
        raise HTTPException(status_code=404, detail="Stream not found")

    try:
        stream = await _stream_repo.get_stream(stream_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Stream not found")

    collection = await block_collection_repo.read()
    return {
        bid: collection.blocks[bid]
        for bid in stream.blockIds
        if bid in collection.blocks
    }

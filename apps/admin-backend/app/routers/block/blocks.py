# app/routers/blocks.py


from fastapi import APIRouter, HTTPException, status

# поправь пути под свой проект:
from app.models.block_collection import BlockCollection, Block
from app.repos.collection_repo import block_collection_repo
from app.services.block_collection_service import generate_block_id

router = APIRouter(
    prefix="/blocks",
    tags=["admin-blocks"],
)


@router.get(
    "/collection",
    response_model=BlockCollection,
    summary="Download block collection",
)
async def get_block_collection() -> BlockCollection:
    """
    Complete collection of blocks.

    На первом этапе просто возвращаем весь BlockCollection как есть.
    При желании можно потом сделать "лёгкую" версию, отдающую только blocks.
    """
    async with block_collection_repo.session() as collection:
        # Здесь мы ничего не модифицируем, просто возвращаем текущее состояние.
        # Репо сам сохранит коллекцию на выходе из контекста.
        return collection


@router.post(
    "",
    response_model=Block,
    status_code=status.HTTP_201_CREATED,
    summary="Create new block (genterate IDr)",
)
async def create_block(block_payload: Block) -> Block:
    """
    Creating a new block in the collection.

    Важно:
    - ID генерируется на бэкенде.
    - Если в payload пришёл id, он игнорируется и перезаписывается.
    """
    async with block_collection_repo.session() as collection:
        block_id = generate_block_id(block_payload)

        # Pydantic v2: model_copy, в v1 было бы block.copy(...)
        new_block = block_payload.model_copy(
            update={"id": block_id, "lifecycle": "saved"}
        )

        collection.add_or_update(new_block)

        # На выходе репо сохранит обновлённую коллекцию.
        return new_block


@router.put(
    "/{block_id}",
    response_model=Block,
    summary="Renew existing block",
)
async def update_block(block_id: str, block_payload: Block) -> Block:
    """
    Обновление существующего блока по id.

    Поведение:
    - Если блока нет в коллекции → 404.
    - В случае рассинхрона block_payload.id и block_id из URL:
      мы принудительно подставляем id из URL.
    """
    async with block_collection_repo.session() as collection:
        if block_id not in collection.blocks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Block '{block_id}' not found",
            )

        updated_block = block_payload.model_copy(update={"id": block_id})

        collection.add_or_update(updated_block)

        return updated_block


@router.delete(
    "/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete block",
)
async def delete_block(block_id: str) -> None:
    """
    Удаление блока из BlockCollection.

    Поведение:
    - Если блок не найден → 404.
    - Успех → 204 No Content.
    """
    async with block_collection_repo.session() as collection:
        if block_id not in collection.blocks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Block '{block_id}' not found",
            )

        collection.remove(block_id)
        # Ничего не возвращаем — статус 204
        return None

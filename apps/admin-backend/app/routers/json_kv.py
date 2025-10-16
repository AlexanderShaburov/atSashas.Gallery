from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any
from ..storage import read_json, write_json
from ..deps import require_admin_token

router = APIRouter(prefix="/json", tags=["json"])

class JsonPayload(BaseModel):
    data: Any

@router.get("/{key}")
def get_json(key: str):
    payload = read_json(key)
    if payload is None:
        raise HTTPException(status_code=404, detail="Not found")
    return {"key": key, "data": payload}

@router.put("/{key}", dependencies=[Depends(require_admin_token)])
def put_json(key: str, body: JsonPayload):
    write_json(key, body.data)
    return {"ok": True, "key": key}


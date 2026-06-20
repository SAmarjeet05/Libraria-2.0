from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import requests

router = APIRouter(tags=["proxy"])


@router.get("/proxy/image")
def proxy_image(url: str = Query(..., description="Full image URL to proxy")):
    """Proxy an image URL and stream it back. Simple helper to avoid CORS/mixed-content issues.

    WARNING: This is a convenience endpoint for development. Consider adding host whitelisting and
    rate limiting for production.
    """
    if not url.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid URL")

    try:
        resp = requests.get(url, stream=True, timeout=10)
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch image: {e}")

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Upstream returned non-200")

    content_type = resp.headers.get("content-type", "application/octet-stream")
    return StreamingResponse(resp.iter_content(chunk_size=1024), media_type=content_type)

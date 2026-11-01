from django.http import Http404, HttpResponse, HttpResponseNotModified
from django.views.decorators.http import require_safe

from .models import StoredFile


@require_safe
def serve_db_media(request, name):
    """Serve a file stored by ``DatabaseStorage`` (immutable, cache-friendly)."""
    try:
        row = StoredFile.objects.get(name=name)
    except StoredFile.DoesNotExist:
        raise Http404("File not found")

    etag = f'"{row.etag}"'
    if request.headers.get("If-None-Match") == etag:
        response = HttpResponseNotModified()
    else:
        response = HttpResponse(
            b"" if request.method == "HEAD" else bytes(row.content),
            content_type=row.content_type or "application/octet-stream",
        )
        response["Content-Length"] = str(row.size)
    response["ETag"] = etag
    response["Cache-Control"] = "public, max-age=31536000, immutable"
    response["X-Content-Type-Options"] = "nosniff"
    return response

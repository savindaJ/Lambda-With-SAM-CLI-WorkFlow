from common.response import error
from login import app as login
from logout import app as logout
from refresh import app as refresh
from register import app as register

ROUTES = {
    ("POST", "/auth/register"): register.handler,
    ("POST", "/auth/login"): login.handler,
    ("POST", "/auth/logout"): logout.handler,
    ("POST", "/auth/refresh"): refresh.handler,
}


def handler(event, context):
    method = (event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method") or "").upper()
    path = event.get("path") or event.get("rawPath") or ""

    # Normalize stage prefix e.g. /prod/auth/login
    for prefix in ("/prod",):
        if path.startswith(prefix + "/"):
            path = path[len(prefix) :]
        elif path == prefix:
            path = "/"

    route = ROUTES.get((method, path))
    if not route:
        return error(f"Not found: {method} {path}", 404)
    return route(event, context)

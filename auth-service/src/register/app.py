import re
import uuid

import bcrypt

from common.db import get_user_by_email, now_iso, put_user
from common.response import error, ok, parse_body

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def handler(event, context):
    try:
        body = parse_body(event)
    except Exception:
        return error("Invalid JSON body", 400)

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    name = (body.get("name") or "").strip()

    if not email or not EMAIL_RE.match(email):
        return error("Valid email is required", 400)
    if len(password) < 8:
        return error("Password must be at least 8 characters", 400)
    if not name:
        return error("Name is required", 400)

    if get_user_by_email(email):
        return error("Email already registered", 409)

    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = {
        "userId": user_id,
        "email": email,
        "name": name,
        "passwordHash": password_hash,
        "createdAt": now_iso(),
    }
    put_user(user)

    return ok(
        {
            "userId": user_id,
            "email": email,
            "name": name,
        },
        status_code=201,
    )

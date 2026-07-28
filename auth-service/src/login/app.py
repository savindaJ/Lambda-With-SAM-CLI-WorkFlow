import bcrypt

from common.db import get_user_by_email, put_refresh_token
from common.response import error, ok, parse_body
from common.tokens import create_access_token, create_refresh_token, decode_token


def handler(event, context):
    try:
        body = parse_body(event)
    except Exception:
        return error("Invalid JSON body", 400)

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return error("Email and password are required", 400)

    user = get_user_by_email(email)
    if not user:
        return error("Invalid credentials", 401)

    stored = user.get("passwordHash", "").encode("utf-8")
    if not bcrypt.checkpw(password.encode("utf-8"), stored):
        return error("Invalid credentials", 401)

    access_token = create_access_token(user["userId"], user["email"])
    refresh_token = create_refresh_token(user["userId"], user["email"])
    refresh_payload = decode_token(refresh_token)

    put_refresh_token(
        token_id=refresh_payload["jti"],
        user_id=user["userId"],
        expires_at=refresh_payload["exp"],
    )

    return ok(
        {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "tokenType": "Bearer",
            "user": {
                "userId": user["userId"],
                "email": user["email"],
                "name": user.get("name"),
            },
        }
    )

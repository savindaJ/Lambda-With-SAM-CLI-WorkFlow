import time

import jwt

from common.db import get_refresh_token, get_user_by_id, put_refresh_token, revoke_refresh_token
from common.response import error, ok, parse_body
from common.tokens import create_access_token, create_refresh_token, decode_token


def handler(event, context):
    try:
        body = parse_body(event)
    except Exception:
        return error("Invalid JSON body", 400)

    refresh_token = body.get("refreshToken")
    if not refresh_token:
        return error("refreshToken is required", 400)

    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except jwt.ExpiredSignatureError:
        return error("Refresh token expired", 401)
    except jwt.InvalidTokenError:
        return error("Invalid refresh token", 401)

    stored = get_refresh_token(payload["jti"])
    if not stored or stored.get("revoked"):
        return error("Refresh token revoked or unknown", 401)
    if int(stored.get("expiresAt", 0)) < int(time.time()):
        return error("Refresh token expired", 401)

    user = get_user_by_id(payload["sub"])
    if not user:
        return error("User not found", 404)

    # Rotate refresh token
    revoke_refresh_token(payload["jti"])

    access_token = create_access_token(user["userId"], user["email"])
    new_refresh = create_refresh_token(user["userId"], user["email"])
    new_payload = decode_token(new_refresh)

    put_refresh_token(
        token_id=new_payload["jti"],
        user_id=user["userId"],
        expires_at=new_payload["exp"],
    )

    return ok(
        {
            "accessToken": access_token,
            "refreshToken": new_refresh,
            "tokenType": "Bearer",
        }
    )

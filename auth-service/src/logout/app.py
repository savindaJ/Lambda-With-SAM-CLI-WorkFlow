import jwt

from common.db import revoke_all_user_tokens, revoke_refresh_token
from common.response import error, ok, parse_body
from common.tokens import decode_token


def handler(event, context):
    try:
        body = parse_body(event)
    except Exception:
        return error("Invalid JSON body", 400)

    refresh_token = body.get("refreshToken")
    logout_all = bool(body.get("logoutAll", False))

    if not refresh_token:
        return error("refreshToken is required", 400)

    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except jwt.ExpiredSignatureError:
        return error("Refresh token expired", 401)
    except jwt.InvalidTokenError:
        return error("Invalid refresh token", 401)

    if logout_all:
        revoke_all_user_tokens(payload["sub"])
    else:
        revoke_refresh_token(payload["jti"])

    return ok({"message": "Logged out successfully"})

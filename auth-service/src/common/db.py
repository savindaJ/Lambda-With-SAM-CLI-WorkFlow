from datetime import datetime, timezone

# In-memory only (resets on cold start). Shared because all auth routes
# run in the same Lambda process via app.handler router.
_users_by_id: dict[str, dict] = {}
_users_by_email: dict[str, str] = {}
_refresh_tokens: dict[str, dict] = {}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_user_by_email(email: str):
    user_id = _users_by_email.get(email.lower())
    if not user_id:
        return None
    return _users_by_id.get(user_id)


def get_user_by_id(user_id: str):
    return _users_by_id.get(user_id)


def put_user(user: dict):
    _users_by_id[user["userId"]] = user
    _users_by_email[user["email"].lower()] = user["userId"]


def put_refresh_token(token_id: str, user_id: str, expires_at: int):
    _refresh_tokens[token_id] = {
        "tokenId": token_id,
        "userId": user_id,
        "expiresAt": expires_at,
        "revoked": False,
        "createdAt": now_iso(),
    }


def get_refresh_token(token_id: str):
    return _refresh_tokens.get(token_id)


def revoke_refresh_token(token_id: str):
    token = _refresh_tokens.get(token_id)
    if token:
        token["revoked"] = True


def revoke_all_user_tokens(user_id: str):
    for token in _refresh_tokens.values():
        if token.get("userId") == user_id:
            token["revoked"] = True

import os
from supabase import create_client, Client

# ──────────────────────────────────────────────────────────────────
# Supabase credentials — read from env vars, fall back to hardcoded.
# Set SUPABASE_URL and SUPABASE_KEY as environment variables in
# production for security.
# ──────────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.environ.get(
    "SUPABASE_URL",
    "https://uqlgxubapbcjggqwzcaw.supabase.co"
)
SUPABASE_KEY: str = os.environ.get(
    "SUPABASE_KEY",
    "sb_publishable_9gG0aH2Lc9CMxT2e54kUPQ_pAdmaMBo"
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

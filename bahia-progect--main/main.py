from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import os

# Import RAG function
from cancerpr.model2 import get_rag_response

# Import Supabase client
from database import supabase

app = FastAPI()

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static / Frontend ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "bahia brogect")

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# ── Status ────────────────────────────────────────────────────────
@app.get("/api/status")
async def get_status():
    return {"status": "success", "message": "Connected successfully to FastAPI backend!"}

# ── Auth Models ───────────────────────────────────────────────────
class AuthRequest(BaseModel):
    email: str
    password: str

# ── Bearer Token Security Scheme ──────────────────────────────────
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency: verifies the Supabase JWT. Returns the user if valid."""
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
        return response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized. Please log in again.")

# ── Signup ────────────────────────────────────────────────────────
@app.post("/api/signup")
async def signup(data: AuthRequest):
    try:
        response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
        })
        if response.user:
            return {
                "status": "success",
                "message": "Account created! Please check your email to confirm.",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                }
            }
        raise HTTPException(status_code=400, detail="Signup failed.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Login ─────────────────────────────────────────────────────────
@app.post("/api/login")
async def login(data: AuthRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
        if response.session and response.user:
            return {
                "status": "success",
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                }
            }
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# ── Chat (Protected) ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    prompt: str = None
    text: str = None
    lang: str = None

@app.post("/api/chat")
async def post_chat(request: ChatRequest, current_user=Depends(verify_token)):
    try:
        user_query = request.prompt or request.text or ""
        if not user_query:
            return {"status": "error", "reply": "No query provided"}

        print("\n" + "="*40)
        print(f"📥 Request from: {current_user.email}")
        print(f"📝 User Query: {user_query}")

        response_text = get_rag_response(user_query)

        print(f"🤖 AI Answer: {response_text[:120]}...")
        print("="*40 + "\n")

        return {
            "status": "success",
            "reply": response_text,
            "answer": response_text
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Backend Error: {str(e)}")
        return {"status": "error", "reply": f"Backend Error: {str(e)}"}

# ── Delete Message ────────────────────────────────────────────────
@app.delete("/api/messages/{msg_id}")
async def delete_message(msg_id: int, current_user=Depends(verify_token)):
    return {"status": "success", "message": f"Message {msg_id} deleted."}

# ── Data Endpoint ─────────────────────────────────────────────────
@app.get("/api/data")
async def get_data():
    return {
        "status": "success",
        "results": [
            {"id": 1, "test": "Hemoglobin", "status": "Normal"},
            {"id": 2, "test": "Blood Sugar", "status": "Elevated"},
            {"id": 3, "test": "Cholesterol", "status": "High"}
        ]
    }

# ── Button Click ──────────────────────────────────────────────────
class ButtonClick(BaseModel):
    btn_id: int

mock_results = {
    1: {"status": "Negative",  "message": "الحالة سليمة: نسبة الهيموجلوبين طبيعية.", "color": "green"},
    2: {"status": "Positive",  "message": "تحذير: حجم الورم يشير لاحتمالية إصابة.", "color": "red"},
    3: {"status": "Pending",   "message": "المؤشرات غير واضحة، يرجى إعادة التحليل.", "color": "orange"},
    4: {"status": "Critical",  "message": "حالة طارئة: يرجى التوجه لأقرب مستشفى.",  "color": "darkred"},
}

@app.post("/button-click")
async def handle_button(data: ButtonClick):
    result = mock_results.get(data.btn_id, {"status": "Unknown", "message": "زر غير معروف"})
    return {"success": True, "btn_pressed": data.btn_id, "diagnosis": result}

# Run: uvicorn main:app --reload
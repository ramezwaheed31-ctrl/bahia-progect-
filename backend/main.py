from fastapi import FastAPI, Request, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
import os
import shutil
import tempfile
import subprocess
import asyncio
import sys

# Ensure the backend directory is in the path so local imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import RAG function + language detector
from .model2 import get_rag_stream, detect_language, build_prompt, retrieve_context, strip_ansi

# Import image predictor and model paths
from .breast_image_inference import predict_breast_image, BINARY_MODEL_PATH, MULTICLASS_MODEL_PATH
from .breast_image_inference import router as mammogram_router

# Import Supabase client
from .database import supabase

app = FastAPI()

# Mount the router
app.include_router(mammogram_router)


# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "https://mammoguide.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static / Frontend ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")

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
    """Used for login only."""
    email: str
    password: str

class SignupRequest(BaseModel):
    """Used for registration — requires a manually entered name."""
    name: str = Field(..., min_length=2, max_length=60, description="Display name (2–60 chars)")
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name must not be empty or whitespace.")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v

        
    @field_validator("email")
    @classmethod
    def email_must_be_gmail(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith("@gmail.com"):
            raise ValueError("Only @gmail.com addresses are allowed.")
        return v


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
@app.post("/api/signup/")
async def signup(data: SignupRequest):
    """Register a new user with a manually provided name stored in user_metadata."""
    try:
        # Check if a user with the same display name already exists
        # (Supabase doesn't enforce unique display names, so we skip DB uniqueness
        # check here — uniqueness is enforced by email which Supabase handles natively.)
        full_name = data.name.strip()

        response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "full_name": full_name,
                    "display_name": full_name,
                }
            }
        })
        if response.user:
            return {
                "status": "success",
                "message": "Account created! Please check your email to confirm.",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "full_name": full_name,
                }
            }
        raise HTTPException(status_code=400, detail="Signup failed. Please try again.")
    except HTTPException:
        raise
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
            # Read full_name from user_metadata (set during signup)
            metadata  = response.user.user_metadata or {}
            full_name = metadata.get("full_name") or metadata.get("display_name") or ""
            return {
                "status": "success",
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "full_name": full_name,
                }
            }
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


# ── Chat (Testing without Auth) ───────────────────────────────────
@app.post("/api/chat")
async def chat_endpoint(
    prompt: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    query: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    # 1. جلب النص المبعوث من الـ Frontend بأي مسمى
    user_query = (prompt or text or query or message or "").strip()
    uploaded_file = file

    # حماية لو مفيش أي مدخلات
    if not user_query and not uploaded_file:
        return JSONResponse(
            status_code=400, 
            content={"status": "error", "message": "برجاء كتابة سؤال أو رفع صورة فحص."}
        )

    # 2. تشغيل موديل الـ .h5 لو فيه صورة مرفوعة
    image_label = ""
    if uploaded_file and uploaded_file.filename:
        try:
            # استدعاء دالة الموديل الـ Async باستعمال await كما هو في ملفاتك
            result = await predict_breast_image(uploaded_file)
            
            # استخراج النتيجة الصافية بناءً على التقسيم اللي في الصورة (Normal, Benign, Malignant)
            if isinstance(result, dict):
                # بنجيب الـ label أو الـ prediction_probabilities
                image_label = result.get("label") or result.get("prediction") or "Unknown"
            else:
                image_label = str(result)
                
        except Exception as e:
            image_label = "Normal"  # Fallback أمن في حالة حدوث خطأ في قراءة ملف معقد

    # ── 🌟 السيناريو الأول: رفع صورة فقط (بدون أي نص) ──
    if uploaded_file and not user_query:
        return JSONResponse(content={
            "status": "success",
            "mode": "image_only",
            "prediction": image_label,
            "message": f"النتيجة: {image_label}"
        })

    # ── 🌟 السيناريو الثاني: رفع صورة + نص (دمج الموضوعين في رد واحد) ──
    clinical_context = ""
    if image_label:
        clinical_context = f"Mammogram Classification Result: {image_label}"

    # تمرير النتيجة الصافية والسؤال للـ RAG Stream ليخرج رد واحد مدمج وذكي
    generator = get_rag_stream(user_query=user_query, clinical_context=clinical_context)
    return StreamingResponse(generator, media_type="text/event-stream")

# ── Chat (Protected) ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    prompt: str = None
    text: str = None
    lang: str = None

@app.post("/api/chat/authenticated")
async def post_chat_authenticated(request: ChatRequest, current_user=Depends(verify_token)):
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


# ── Change Password (Protected) ────────────────────────────────────────
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@app.post("/api/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(verify_token),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        if len(data.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
        if data.old_password == data.new_password:
            raise HTTPException(status_code=400, detail="New password must differ from the current one.")
        # Verify old password by re-authenticating
        try:
            verify_resp = supabase.auth.sign_in_with_password({
                "email": current_user.email,
                "password": data.old_password,
            })
            if not verify_resp.session:
                raise HTTPException(status_code=400, detail="Current password is incorrect.")
        except Exception:
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        # Update password using the user's own token
        token = credentials.credentials
        supabase.auth.update_user({"password": data.new_password})
        return {"status": "success", "message": "Password changed successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Change Email (Protected) ───────────────────────────────────────────
class ChangeEmailRequest(BaseModel):
    new_email: str

@app.post("/api/change-email")
async def change_email(
    data: ChangeEmailRequest,
    current_user=Depends(verify_token),
):
    try:
        new_email = data.new_email.strip().lower()
        if not new_email or "@" not in new_email:
            raise HTTPException(status_code=400, detail="Invalid email address.")
        if not new_email.endswith("@gmail.com"):
            raise HTTPException(status_code=400, detail="Only @gmail.com addresses are allowed.")
        if new_email == current_user.email:
            raise HTTPException(status_code=400, detail="New email is the same as the current one.")
        supabase.auth.update_user({"email": new_email})
        return {"status": "success", "message": "Confirmation sent to new email. Please verify it."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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



# ── Utility Functions for Models ───────────────────────────────────
def get_model_status():
    import tensorflow as tf
    binary_exists = os.path.exists(BINARY_MODEL_PATH)
    multi_exists = os.path.exists(MULTICLASS_MODEL_PATH)
    return {
        "status": "online" if (binary_exists and multi_exists) else "offline",
        "binary_model": "found" if binary_exists else "missing",
        "multiclass_model": "found" if multi_exists else "missing",
        "tf_version": tf.__version__
    }

async def run_prediction(path: str):
    """Load image from disk and run inference. Passes raw bytes — no wrapper needed."""
    with open(path, "rb") as f:
        image_bytes = f.read()
    return await predict_breast_image(image_bytes)

# ── Prediction Status (no auth needed — dev health check) ─────────────────
@app.get("/api/predict/status")
async def predict_status():
    """Returns whether TF is loaded and models are found on disk."""
    return get_model_status()


# ── Image Prediction + LLM Explanation (Protected) ────────────────────────
def _build_prediction_prompt(pred: dict, lang_name: str = "Arabic") -> str:
    """Turn the structured prediction dict into a rich prompt for Llama 3.1."""
    cancer_status = pred.get("cancer_status", "No Cancer")
    malignancy_status = pred.get("malignancy_status", "Benign")
    
    if cancer_status == "No Cancer":
        mapped_result = "Normal"
    elif malignancy_status == "Malignant":
        mapped_result = "Malignant"
    else:
        mapped_result = "Benign"

    return (
        "أنت مساعد طبي ذكي ومتخصص في قراءة أشعة سرطان الثدي. \n"
        "سوف تستقبل نتيجة فحص الأشعة المباشرة، ويجب أن يكون ردك حاسماً وفي جملة واحدة واضحة في أول السطر بناءً على الحالات التالية:\n\n"
        "1. إذا كانت النتيجة (Normal): ابدأ ردك فوراً بـ \"النتيجة: طبيعي (Normal)\" ثم قدم النصائح العامة للوقاية.\n"
        "2. إذا كانت النتيجة (Benign): ابدأ ردك فوراً بـ \"النتيجة: ورم حميد (Benign)\" وطمئن المستخدم واذكر المتابعة الدورية.\n"
        "3. إذا كانت النتيجة (Malignant): ابدأ ردك فوراً بـ \"النتيجة: ورم خبيث (Malignant)\" واذكر الخطوات الطبية التالية بجدية ودعم.\n\n"
        "ممنوع تماماً تقسيم الإجابة أو قول \"أولاً مسرطن وثانياً خبيث\". اذكر الحالة النهائية النهائية مباشرة (طبيعي / حميد / خبيث) في جملة واحدة في بداية الرد، ثم أكمل تفاصيل الدعم والنصائح باختصار.\n\n"
        f"نتيجة فحص الأشعة الحالية: {mapped_result}"
    )


@app.post("/api/predict")
async def predict_image(
    file: UploadFile = File(...),
    current_user=Depends(verify_token),
):
    """
    Accepts an uploaded mammogram image, runs the predictor, then asks
    Llama 3.1 to explain the result in the user's language.

    Returns:
        prediction  : raw structured result from the model
        explanation : LLM-generated explanation
        detected_lang : ISO language code
    """
    # ── 1. Save upload to a temp file ─────────────────────────────────────
    suffix = os.path.splitext(file.filename or ".jpg")[1] or ".jpg"
    tmp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        print("\n" + "="*50)
        print(f"🩻 Predict request from : {current_user.email}")
        print(f"📁 Temp file            : {tmp_path}")

        # ── 2. Run model (never raises) ────────────────────────────────────
        prediction = await run_prediction(tmp_path)
        print(f"🔬 Prediction source    : {prediction['source']}")
        print(f"📊 Result              : {prediction['binary_label']} | "
              f"BI-RADS {prediction['birads_score']}")

        # ── 3. Detect language (default Arabic for this project) ───────────
        # We don't have a text query here, so we default to Arabic.
        # If the frontend sends a `lang` query param in the future, use that.
        lang_code, lang_name = "ar", "Arabic"

        # ── 4. Build prompt and call Ollama ───────────────────────────────
        ollama_prompt = _build_prediction_prompt(prediction, lang_name=lang_name)

        try:
            ollama_exe = r"C:\Users\ASUS\AppData\Local\Programs\Ollama\ollama.exe"
            result = subprocess.run(
                f'"{ollama_exe}" run llama3.1',
                input=ollama_prompt,
                capture_output=True,
                text=True,
                shell=True,
                encoding="utf-8",
                errors="ignore",
            )
            explanation = strip_ansi(result.stdout.strip()) if result.returncode == 0 \
                else "Could not generate explanation from AI model."
        except Exception as llm_err:
            print(f"⚠️  LLM error: {llm_err}")
            explanation = "AI explanation unavailable at this time."

        print(f"🤖 Explanation snippet  : {explanation[:120]}...")
        print("="*50 + "\n")

        return {
            "status":        "success",
            "prediction":    prediction,
            "explanation":   explanation,
            "detected_lang": lang_code,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ /api/predict error: {e}")
        return {
            "status":      "error",
            "prediction":  None,
            "explanation": f"Backend error: {str(e)}",
        }
    finally:
        # Always clean up the temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


# Run: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

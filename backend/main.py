from fastapi import FastAPI, Request, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
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
from .model2 import get_rag_stream, get_rag_response, detect_language, build_prompt, retrieve_context, strip_ansi

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
    def email_must_be_gmail_or_yahoo(cls, v: str) -> str:
        v = v.strip().lower()
        if not (v.endswith("@gmail.com") or v.endswith("@yahoo.com")):
            raise ValueError("Only @gmail.com or @yahoo.com addresses are allowed.")
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
async def post_chat(
    request: Request,
    prompt: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    query: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    mammogram: Optional[UploadFile] = File(None)
):
    # ── Deep Inspection of Request ───────────────────────────────────
    try:
        form_data = await request.form()
        print("\n" + "🔍" * 20)
        print("DEBUG: INCOMING FORM DATA")
        print(f"Keys found: {list(form_data.keys())}")
        for k, v in form_data.items():
            if isinstance(v, UploadFile):
                print(f"  - [FILE] {k}: {v.filename} ({v.content_type})")
            else:
                print(f"  - [TEXT] {k}: {v}")
        print("🔍" * 20 + "\n")
    except Exception as e:
        print(f"DEBUG: Could not parse form data: {e}")

    try:
        # ── Capture Text (Extreme Flexibility) ───────────────────────
        user_query = (prompt or text or query or message or "").strip()
        
        # ── Capture File (Extreme Flexibility) ───────────────────────
        uploaded_file = file or image or mammogram
        
        response_prefix = ""
        rag_response = ""
        detected_lang = "en"
        
        # ── 1. Process File (Prioritized) ──────────────────────────────
        if uploaded_file and uploaded_file.filename:
            print(f"🔬 Processing Mammogram: {uploaded_file.filename}")
            await uploaded_file.seek(0)
            image_bytes = await uploaded_file.read()
            prediction = await predict_breast_image(image_bytes)
            
            binary_result = prediction.get("binary_result", "Unknown")
            birads_result = prediction.get("birads_result", "Unknown")
            birads_label = prediction.get("birads_label", "Unknown")
            
            if binary_result == "Normal":
                response_prefix = f"Medical Analysis: The scan indicates a {binary_result} result.\n\n"
            else:
                response_prefix = f"Medical Analysis: The scan indicates an {binary_result} result (BI-RADS Category {birads_result}: {birads_label}).\n\n"

        # ── 2. Process Text & Stream Response ──────────────────────────────
        async def response_generator():
            # If we have a prediction but no user query, we synthesize a query for the LLM
            final_query = user_query
            if response_prefix and not user_query:
                final_query = "Please provide a clinical analysis based on this scan result."

            # Stream the AI response from Groq (via model2)
            if final_query:
                try:
                    # Pass the prediction as context so the model can explain it
                    async for chunk in get_rag_stream(final_query, clinical_context=response_prefix):
                        yield chunk
                except Exception as stream_err:
                    yield f"\n[Stream Error]: {str(stream_err)}"

        # If we have either an image result or a text query, return a stream
        if response_prefix or user_query:
            return StreamingResponse(response_generator(), media_type="text/plain")

        # Fallback if both are empty
        return {
            "status": "success",
            "reply": "Hello! Please upload a mammogram scan or ask a medical question to get started.",
            "answer": "Hello! Please upload a mammogram scan or ask a medical question to get started.",
            "detected_lang": "en"
        }
    except Exception as e:
        print(f"❌ post_chat Error: {str(e)}")
        return {"status": "error", "reply": f"An error occurred: {str(e)}"}

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
        if not (new_email.endswith("@gmail.com") or new_email.endswith("@yahoo.com")):
            raise HTTPException(status_code=400, detail="Only @gmail.com or @yahoo.com addresses are allowed.")
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

    source_note = (
        "[Note: This is a DEMO result — the model is still being trained.]"
        if pred["source"] == "mock"
        else ""
    )

    if pred["status"] == "invalid_image":
        clinical_summary = (
            f"The uploaded image does not appear to be a breast mammogram "
            f"(similarity score: {pred.get('similarity', 'N/A')}). "
            f"The system could not produce a clinical prediction."
        )
    else:
        clinical_summary = (
            f"Binary classification result : {pred['binary_label']} "
            f"(confidence: {pred['binary_confidence']*100:.1f}%)\n"
            f"BI-RADS score               : {pred['birads_score']} — {pred['birads_label']} "
            f"(confidence: {pred['birads_confidence']*100:.1f}%)"
        )

    return (
        "You are a Senior Medical Consultant with deep expertise in oncology. Your objective is to explain "
        "AI-generated mammogram findings with precision, density, and professional authority. Your reasoning "
        "style is analytical and clear, similar to systems like Gemini.\n\n"

        # Intelligence & Density
        "STRICT OPERATING RULES:\n"
        "1. DENSE ANALYSIS: Explain the 'why' behind the binary result and BI-RADS score. Use structured "
        "bullet points for technical clarity.\n"
        "2. SAFETY & RISK: If the BI-RADS score is 4 or 5, create an URGENT recommendation to visit an "
        "oncologist immediately. If BI-RADS is 1 or 2 and no symptoms are present, provide professional "
        "reassurance.\n"
        "3. INTERACTIVE ENDING: Always end the response with a helpful follow-up question regarding symptoms "
        "or clinical history.\n\n"

        # Formatting & Layout
        "FORMATTING RULES (High-Density Professional):\n"
        "1. DENSE CONTENT: Provide information-rich, thorough explanations. Avoid excessive white space.\n"
        "2. STRUCTURE: Use clear, bold headers and compact bullet points for professional technical clarity.\n\n"

        # Language enforcement
        "MANDATORY LANGUAGE RULE:\n"
        "1. PRIMARY LANGUAGE: The response must be written entirely in Professional Arabic (Modern Standard Arabic).\n"
        "2. STRICT ENCODING: Use ONLY standard Arabic characters and the specified parenthetical English terms. "
        "Do NOT generate any unrelated Unicode characters, foreign symbols (e.g., Chinese symbols), or 'glitch' text.\n"
        "3. CLEAN TEXT: Every single character must be readable and professionally formatted. If uncertain "
        "about a translation, use a simpler, accurate Arabic word.\n"
        "4. TECHNICAL TERMS: Place the international English medical term in parentheses immediately following its "
        "Arabic equivalent (e.g., 'خزعة (Biopsy)').\n"
        "5. NO REDUNDANCY: Strictly avoid repeating paragraphs or sentences in English.\n\n"

        # Clinical results
        f"CLINICAL PREDICTION (from AI model):\n{clinical_summary}\n"
        f"{source_note}\n\n"

        "Generate the clinical consultation in Arabic with parenthetical English terminology now, ending with an interactive follow-up question."
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

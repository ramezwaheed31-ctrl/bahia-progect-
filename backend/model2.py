import sys
import os
import re
from langdetect import detect, LangDetectException
import json
import pandas as pd
import subprocess
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from duckduckgo_search import DDGS
import httpx
import asyncio

sys.stdout.reconfigure(encoding='utf-8')

# 1. Handle file paths dynamically using os.path.abspath
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Fallback to the exact filenames you requested if they exist, else try the fallback names.
csv_target = os.path.join(BASE_DIR, 'data.csv')
CSV_PATH = csv_target if os.path.exists(csv_target) else os.path.join(BASE_DIR, 'synthetic_cancer_data.csv')
JSON_PATH = os.path.join(BASE_DIR, 'cancer_info.json')

# ── Pre-load Medical Database ──
CANCER_DATA = []
try:
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            CANCER_DATA = json.load(f)
            print(f"✅ Performance Opt: Pre-loaded {len(CANCER_DATA)} records.")
except Exception as e:
    print(f"❌ Error pre-loading JSON: {e}")

json_target = os.path.join(BASE_DIR, 'data.json')
JSON_PATH = json_target if os.path.exists(json_target) else os.path.join(BASE_DIR, 'all_cancer_text_data.json')

# ---------------------------------------------------------
# Machine Learning Section
# ---------------------------------------------------------
try:
    df = pd.read_csv(CSV_PATH)
    
    X = df[['Age', 'Tumor_Size', 'Tumor_Grade']]
    y = df['Diagnosis']
    
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = LogisticRegression()
    model.fit(X_train_scaled, y_train)
except Exception as e:
    print(f"Warning: Could not train ML model. {e}")
    scaler = None
    model = None

def predict_patient(data):
    if not scaler or not model:
        return "Error: Model not trained."
    data_scaled = scaler.transform([data])
    prediction = model.predict(data_scaled)
    return "Malignant" if prediction[0] == 1 else "Benign"

def explain_result(result):
    if result == "Malignant":
        return "The case may be serious. Immediate medical consultation is recommended."
    else:
        return "The condition appears stable. Regular monitoring is recommended."

# ---------------------------------------------------------
# RAG System Section
# ---------------------------------------------------------
def retrieve_context(query: str) -> str:
    context_pieces = []
    query_lower = query.lower()
    query_words = set(query_lower.split())
    
    # Use pre-loaded data for speed
    for item in CANCER_DATA:
        if item['cancer_type'] in query_lower or any(w in item['content'].lower() for w in query_words if len(w) > 3):
            context_pieces.append(f"[{item['category'].upper()}] {item['content']}")

    # 3. Search CSV
    try:
        df_csv = pd.read_csv(CSV_PATH)
        # Removed [DATASET INFO] label to keep output pure
        context_pieces.append(f"Medical database context: Contains {len(df_csv)} relevant clinical records.")
    except Exception as e:
        print(f"Error reading CSV: {e}")

    # Deduplicate and return as a string
    unique_context = list(dict.fromkeys(context_pieces))
    # Increased context limit for more comprehensive data
    return "\n- ".join(unique_context)[:5000]

def web_search(query: str) -> str:
    """Performs a web search using DuckDuckGo as a fallback."""
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(query, max_results=5)]
            if not results:
                return ""
            
            formatted_results = []
            for r in results:
                # Removed 'Source: {r['href']}' to prevent citations
                formatted_results.append(f"Title: {r['title']}\nResearch Summary: {r['body']}")
            
            return "\n\n--- Clinical Research Data ---\n" + "\n\n".join(formatted_results)
    except Exception as e:
        print(f"DEBUG: Web search failed: {e}")
        return ""

# (re already imported at top)
def strip_ansi(text: str) -> str:
    """Remove ALL ANSI / VT100 terminal escape sequences from subprocess output.
    Handles codes like: [2D [K [7D [2J [?25h etc.
    """
    # Standard CSI sequences  e.g.  ESC [ ... final-byte
    ansi_escape = re.compile(
        r'\x1B'           # ESC
        r'(?:'            # non-capturing group
        r'[@-Z\\-_]'     # Fe sequences (single char after ESC)
        r'|'              # OR
        r'\['
        r'[0-?]*'         # parameter bytes
        r'[ -/]*'         # intermediate bytes
        r'[@-~]'          # final byte
        r')'
    )
    # Also clean up leftover lone bracket-number-letter patterns like [2D [K
    bracket_remnants = re.compile(r'\[\d*[A-Za-z]')
    result = ansi_escape.sub('', text)
    result = bracket_remnants.sub('', result)
    return result.strip()


# Language code → human-readable name map (extend as needed)
_LANG_NAMES = {
    "ar": "Arabic",
    "en": "English",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
    "it": "Italian",
    "pt": "Portuguese",
    "tr": "Turkish",
    "ru": "Russian",
    "zh-cn": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
}

def detect_language(text: str) -> tuple[str, str]:
    """Detect the language of *text*.

    Returns:
        (lang_code, lang_name)  e.g.  ('ar', 'Arabic')
    Falls back to ('en', 'English') on any detection failure.
    """
    try:
        code = detect(text)          # e.g. 'ar', 'en', 'fr' …
        name = _LANG_NAMES.get(code, code.upper())   # safe fallback to code itself
        return code, name
    except LangDetectException:
        return "en", "English"


def build_prompt(user_query: str, context: str, detected_lang: str = "English") -> str:
    """Builds the structured RAG prompt string sent to the LLM."""

    # ── Arabic-specific quality instructions ──
    arabic_quality_note = ""
    if detected_lang == "Arabic":
        arabic_quality_note = (
            "\nARABIC QUALITY RULES (critical):\n"
            "- Use professional, senior-level clinical Arabic (الفصحى).\n"
            "- Avoid literal translations or AI-like phrasing.\n"
            "- Use 'علاج كيميائي' for chemotherapy and 'علاج إشعاعي' for radiation.\n"
            "- Do NOT output any Latin characters.\n\n"
        )

    return (
        # ── Identity ─────────────────────────────────────────────────────
        "You are a Senior Medical Consultant with deep expertise in oncology. Your objective is to provide a "
        "comprehensive, analytical, and professional medical consultation. Your reasoning style is similar to "
        "advanced AI systems like Gemini—precise, dense, and intellectually rigorous.\n\n"

        # ── Intelligence & Density ──────────────────────────────────────
        "STRICT OPERATING RULES:\n"
        "1. DENSE ANALYSIS: Provide deep, analytical responses. Explain the 'why' behind any medical insights. "
        "Use structured bullet points for clarity and detailed reasoning.\n"
        "2. HYBRID KNOWLEDGE: Use the 'Clinical Reference Data' below as your primary source. If the topic is "
        "outside the provided data (e.g., other cancers), provide a brief, accurate overview from your built-in "
        "medical knowledge, clearly stating it is a 'general medical insight' and advising a specialist consultation.\n"
        "3. SAFETY & RISK: If the user describes red-flag symptoms (lumps, skin changes, intense pain), advise "
        "seeking medical attention immediately. If the clinical data indicates a BI-RADS 4 or 5 result, create "
        "an urgent recommendation to visit an oncologist. If BI-RADS is 1 or 2 and no symptoms are present, "
        "provide professional reassurance.\n"
        "4. NO AI META-TALK: Never mention 'searching files', 'database', or 'provided context'. Deliver the "
        "analysis as a direct clinical consultation.\n"
        "5. INTERACTIVE ENDING: Always end the response with a helpful follow-up question to keep the consultation going.\n\n"

        # ── Formatting & Layout ──────────────────────────────────────────
        "FORMATTING RULES (High-Density Professional):\n"
        "1. DENSE CONTENT: Provide information-rich, thorough responses. Avoid excessive white space. Ensure the "
        "report feels comprehensive and expert-level.\n"
        "2. STRUCTURE: Use clear, bold headers and compact bullet points for professional organization.\n"
        "3. PRECISION: Ensure the most important clinical advice is prominent but integrated into the flow of the "
        "comprehensive report.\n\n"

        # ── Language enforcement ──────────────────────────────────────────
        "MANDATORY LANGUAGE RULE:\n"
        "1. PRIMARY LANGUAGE: The response must be written entirely in Professional Arabic (Modern Standard Arabic).\n"
        "2. STRICT ENCODING: Use ONLY standard Arabic characters and the specified parenthetical English terms. "
        "Do NOT generate any unrelated Unicode characters, foreign symbols (e.g., Chinese, Cyrillic), or 'glitch' text.\n"
        "3. CLEAN TEXT: If you are uncertain about a technical translation, use a simpler, accurate Arabic word. "
        "Every single character must be readable and professionally formatted.\n"
        "4. TECHNICAL TERMS: Place the international English medical term in parentheses immediately following its "
        "Arabic equivalent (e.g., 'خزعة (Biopsy)').\n"
        "5. NO REDUNDANCY: Strictly avoid repeating paragraphs or sentences in English.\n\n"
        "a clean, professional Arabic document that uses English only for specific medical terminology to ensure "
        "clinical precision.\n\n"

        # ── Clinical Input ──────────────────────────────────────────────
        f"Clinical Reference Data:\n{context}\n\n"
        f"Consultation Subject: {user_query}\n\n"

        # ── Final instruction ─────────────────────────────────────────────
        "Generate the clinical consultation in Arabic with parenthetical English terminology now, ending with an interactive follow-up question."
    )
def get_rag_response(user_query: str, clinical_context: str = "") -> str:
    """Synchronous wrapper for get_rag_stream (collects all chunks)."""
    try:
        # Use a new event loop if necessary, but in FastAPI we're already in one.
        # This is primarily for the CLI or simple sync calls.
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def collect():
            full_text = ""
            async for chunk in get_rag_stream(user_query, clinical_context):
                full_text += chunk
            return full_text
            
        return loop.run_until_complete(collect())
    except Exception as e:
        return f"Error in sync wrapper: {str(e)}"
    finally:
        loop.close()

async def get_rag_stream(user_query: str, clinical_context: str = ""):
    """Streams response from Ollama using the pre-loaded context."""
    try:
        lang_code, lang_name = detect_language(user_query)
        search_query = f"{user_query} {clinical_context}".strip()
        context = retrieve_context(search_query)
        
        # Merge clinical context (like scan results) if provided
        if clinical_context:
            context = f"SCAN PREDICTION: {clinical_context}\n\n{context}".strip()

        # Selective Search Fallback
        if len(context.strip()) < 150:
            print("🔍 Context weak, triggering web search fallback...")
            web_context = web_search(search_query)
            context = f"{context}\n\n{web_context}".strip()

        prompt = build_prompt(user_query, context, detected_lang=lang_name)
        
        # ── Groq Integration ──────────────────────────────────────────
        # Prioritize Groq key from environment variables with file fallback
        groq_key = os.getenv("GROQ_API_KEY")

        if not groq_key:
            key_path = os.path.join(BASE_DIR, 'Groq_key.txt')
            if os.path.exists(key_path):
                with open(key_path, 'r', encoding='utf-8') as f:
                    groq_key = f.read().strip()

        if not groq_key:
            yield "\n[Error]: Groq API key not found in Environment Variables or Groq_key.txt"
            return

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "stream": True
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    yield f"\n[Groq API Error {response.status_code}]: {err_body.decode()}"
                    return

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            text = delta.get("content", "")
                            if text:
                                yield text
                        except Exception:
                            continue
    except Exception as e:
        yield f"\n[Streaming Error]: {str(e)}"

# ---------------------------------------------------------
# CLI Application
# ---------------------------------------------------------
if __name__ == "__main__":
    print("\n===================================")
    print(" Welcome to Cancer Assistant System 🧠")
    print("===================================")
    print("This system helps you with:")
    print("1 - Predict if a tumor is Benign or Malignant based on patient data")
    print("2 - Ask medical questions using AI (RAG connected to Database)")
    print("===================================")

    while True:
        print("\nChoose an option:")
        print("1 - Predict Patient Case")
        print("2 - Ask a Medical Question (AI Chat)")
        print("3 - Exit")

        choice = input("Enter your choice (1/2/3): ")

        if choice == "1":
            try:
                age = float(input("Enter Age: "))
                tumor_size = float(input("Enter Tumor Size: "))
                tumor_grade = float(input("Enter Tumor Grade (1-3): "))

                patient_data = [age, tumor_size, tumor_grade]

                result = predict_patient(patient_data)
                explanation = explain_result(result)

                print("\nPrediction:", result)
                print("Explanation:", explanation)

            except:
                print("Invalid input ❌ Please enter numeric values.")

        elif choice == "2":
            question = input("\nEnter your medical question: ")
            response = get_rag_response(question)
            print("\nOllama RAG Response:\n", response)

        elif choice == "3":
            print("Exiting program 👋")
            break

        else:
            print("Invalid choice ❌")

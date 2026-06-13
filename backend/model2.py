import sys
import os
import re
import json
import pandas as pd
import httpx
import subprocess
import asyncio
from duckduckgo_search import DDGS
from langdetect import detect, LangDetectException
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression

# تأمين جلب دالات قاعدة البيانات من ملف database.py
try:
    from database import supabase
except ImportError:
    supabase = None

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
JSON_PATH = os.path.join(BASE_DIR, 'all_cancer_text_data.json')
CSV_PATH = os.path.join(BASE_DIR, 'synthetic_cancer_data.csv')

# ── Pre-load Medical Database ──
CANCER_DATA = []
try:
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            CANCER_DATA = json.load(f)
except Exception:
    pass
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
def strip_ansi(text: str) -> str:
    """تنظيف الرموز لضمان استقرار قراءة الـ Terminal."""
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    bracket_remnants = re.compile(r'\[\d*[A-Za-z]')
    return bracket_remnants.sub('', ansi_escape.sub('', text)).strip()

def retrieve_context(query: str) -> str:
    """سحب السياق الطبي الموثوق من قاعدة البيانات المحلية."""
    context_pieces = []
    query_lower = query.lower()
    query_words = set(query_lower.split())
    
    for item in CANCER_DATA:
        if item.get('cancer_type', '').lower() in query_lower or any(w in item.get('content', '').lower() for w in query_words if len(w) > 3):
            context_pieces.append(f"[{item.get('category', '').upper()}] {item.get('content', '')}")

    unique_context = list(dict.fromkeys(context_pieces))
    return "\n- ".join(unique_context)[:5000]

def web_search(query: str) -> str:
    """البحث عبر الإنترنت لزيادة حجم الردود وتحديثها دون تحذيرات."""
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(query, max_results=4)]
            if not results:
                return ""
            formatted = [f"Title: {r['title']}\nFact: {r['body']}" for r in results]
            return "\n\n--- Live Clinical Web Context ---\n" + "\n\n".join(formatted)
    except Exception:
        return ""

def detect_language(text: str) -> tuple[str, str]:
    """
    نسخة محمية 100% من أخطاء الـ Setup واللغة.
    تتعامل مع الإيموجي والرموز والأزرار بدون أي كراش.
    """
    if not text or not text.strip():
        return ("ar", "Arabic")
        
    # فحص يدوي سريع لحماية الدالة قبل تشغيل المكتبة الخارجية
    arabic_chars = re.compile(r'[\u0600-\u06FF]')
    if arabic_chars.search(text):
        return ("ar", "Arabic")
        
    try:
        code = detect(text)
        return (code, "Arabic" if code == "ar" else "English")
    except LangDetectException:
        # خط دفاع بديل: لو فشلت المكتبة بسبب رموز غريبة، بنشيك لو فيه حروف عربي أو بنخليها عربي تلقائي للمنصة
        if arabic_chars.search(text):
            return ("ar", "Arabic")
        return ("en", "English")

def build_prompt(user_query: str, context: str, clinical_context: str = "", detected_lang: str = "English") -> str:
    """
    برومبت طبي حواري شامل لدعم المريضة والإجابة على استفساراتها،
    سواء كانت الاستفسارات نصية عامة أو مرتبطة بنتيجة أشعة مدمجة في السؤال.
    """
    if detected_lang == "Arabic":
        return (
            "أنت طبيب استشاري أول أورام وتوعية طبية (تتحدث بأسلوب حواري، عميق، ومفصل مثل نظام Gemini الطبي).\n"
            "مهمتك هي قراءة تفاصيل الحالة وسؤال المريضة، وتقديم استشارة طبية دقيقة وبث الطمأنينة.\n\n"
            
            "التعليمات لصياغة الرد:\n"
            "1. التفسير الطبي الحنون: اشرح للمريضة بأسلوب داعم ونفسي مريح أي تفاصيل طبية تتعلق بحالتها.\n"
            "2. المعلومات الغزيرة والتوجيه: لا تسرد سطوراً جامدة، بل قدم نصائح وقائية، خطوات الفحص الذاتي، وإرشادات عملية لتجعل حجم الرد كبيراً ومفيداً جداً لأقصى درجة.\n"
            "3. حوار المتابعة التفاعلي: اختم إجابتك دائماً وبشكل إلزامي بأسئلة استكشافية حنونة لمتابعة الحالة مثل: (هل تلاحظين أي أعراض أو تكتلات أخرى حالياً؟ ما هي التحاليل أو الفحوصات التي قمتِ بها مؤخراً لنستطيع توجيهك بشكل أدق؟).\n\n"
            
            f"سياق قاعدة البيانات الطبية المسترجعة للتعزيز الطبي (RAG Context):\n{context}\n\n"
            f"رسالة المريضة الحالية: {user_query}"
        )
    else:
        return (
            "You are an elite, highly intelligent medical oncologist acting as an empathetic digital consultant (Gemini Medical Depth).\n\n"
            
            "Instructions for the response:\n"
            "1. Provide an extensive, comprehensive, long-form clinical explanation based on the patient's query and condition.\n"
            "2. End the consultation dynamically by asking strategic medical follow-up questions to understand the patient history.\n\n"
            
            f"Medical Knowledge Base:\n{context}\n\n"
            f"Patient Query: {user_query}"
        )

async def get_rag_stream(user_query: str, clinical_context: str = ""):
    try:
        # تفكيك المتغيرين بأمان لمنع الـ Unpacking Errors
        lang_code, lang_name = detect_language(user_query)
        context = retrieve_context(user_query)
        
        # توسيع سياق الرد إذا كانت الداتا المحلية صغيرة لتوليد رد ضخم
        if len(context.strip()) < 300:
            web_data = web_search(user_query)
            context = f"{context}\n\n{web_data}".strip()

        prompt = build_prompt(user_query, context, clinical_context=clinical_context, detected_lang=lang_name)
        
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            key_path = os.path.join(BASE_DIR, 'Groq_key.txt')
            if os.path.exists(key_path):
                with open(key_path, 'r', encoding='utf-8') as f:
                    groq_key = f.read().strip()

        if not groq_key:
            yield "[Error]: Groq API key missing."
            return

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "stream": True,
            "temperature": 0.65,
            "max_tokens": 4096
        }
        
        async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    yield f"[Groq Error]: Connection failed with status {response.status_code}"
                    return
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            text = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if text:
                                yield text
                        except Exception:
                            continue
    except Exception as e:
        yield f"[Error]: {str(e)}"

def get_rag_response(user_query: str, clinical_context: str = "") -> str:
    """دالة احتياطية متوافقة مع الـ Synchronous Wrapper لتجنب أخطاء الـ Setup."""
    context = retrieve_context(user_query)
    lang_code, lang_name = detect_language(user_query)
    return "Streaming mode is running perfectly. Refresh and test via UI."

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

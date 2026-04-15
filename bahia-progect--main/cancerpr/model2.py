import sys
import os
import re
import json
import pandas as pd
import subprocess
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression

sys.stdout.reconfigure(encoding='utf-8')

# 1. Handle file paths dynamically using os.path.abspath
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Fallback to the exact filenames you requested if they exist, else try the fallback names.
csv_target = os.path.join(BASE_DIR, 'data.csv')
CSV_PATH = csv_target if os.path.exists(csv_target) else os.path.join(BASE_DIR, 'synthetic_cancer_data.csv')

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
    
    # 2. Search JSON
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            query_lower = query.lower()
            query_words = set(query_lower.split())
            
            for item in data:
                # Basic string matching: if it mentions the cancer type or some keywords
                if item['cancer_type'] in query_lower or any(w in item['content'].lower() for w in query_words if len(w) > 3):
                    context_pieces.append(f"[{item['category'].upper()}] {item['content']}")
    except Exception as e:
        print(f"Error reading JSON: {e}")

    # 3. Search CSV
    try:
        df_csv = pd.read_csv(CSV_PATH)
        context_pieces.append(f"[DATASET INFO] Medical database contains {len(df_csv)} patient records with columns: {', '.join(df_csv.columns)}.")
    except Exception as e:
        print(f"Error reading CSV: {e}")

    # Deduplicate and return as a string
    unique_context = list(dict.fromkeys(context_pieces))
    return "\n- ".join(unique_context)[:2000]

import re
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

def build_prompt(user_query: str, context: str) -> str:
    """Builds the structured RAG prompt string sent to the LLM."""
    return (
        "You are Bahia, the medical assistant for project 'Bahia'.\n\n"

        # ── Language rule — placed FIRST so it overrides everything ──
        "STRICT RULE — LANGUAGE DETECTION (highest priority):\n"
        "1. Read the user's question and detect its language.\n"
        "2. Always respond using the EXACT same language as the user's question.\n"
        "3. If the user asks in English  → reply ONLY in English.\n"
        "4. If the user asks in Arabic   → reply ONLY in Arabic.\n"
        "5. NEVER switch languages unless the user explicitly asks you to.\n"
        "6. This rule overrides all other instructions.\n\n"

        # ── Formatting rules ──
        "Formatting instructions:\n"
        "- Structure your answer using Markdown: ## for section headers, ** for bold terms, - for bullet points.\n"
        "- Be clear, professional, and concise.\n"
        "- Do NOT output ANSI codes, escape sequences, or any terminal control characters.\n"
        "- Do NOT produce symbols like [2D, [K, or bracket-number-letter patterns.\n\n"

        f"Medical Context from database:\n{context}\n\n"
        f"User Question: {user_query}"
    )

def get_rag_response(user_query: str) -> str:
    """CLI-only: builds prompt and calls Ollama via subprocess."""
    try:
        context = retrieve_context(user_query)
        prompt  = build_prompt(user_query, context)

        ollama_executable = r"C:\Users\ASUS\AppData\Local\Programs\Ollama\ollama.exe"
        result = subprocess.run(
            f'"{ollama_executable}" run llama3.1',
            input=prompt,
            capture_output=True,
            text=True,
            shell=True,
            cwd=BASE_DIR,
            encoding='utf-8',
            errors='ignore'
        )

        if result.returncode != 0:
            print(f"[Ollama Error] Return code: {result.returncode}")
            print(f"[Ollama Stderr]: {result.stderr}")
            return f"Ollama Error: {result.stderr.strip()}"

        output = result.stdout.strip()
        if not output:
            print("[Ollama Warning] Empty output. Stderr:", result.stderr)
            return "Ollama returned an empty string."

        return strip_ansi(output)
    except Exception as e:
        return f"Error: Unable to connect to AI model. Details: {str(e)}"

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

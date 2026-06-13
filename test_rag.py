import os
import ollama
from dotenv import load_dotenv
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer

# Load environment variables
load_dotenv()

# 1. إعدادات الاتصال
URL = os.getenv("SUPABASE_URL", "https://uqlgxubapbcjggqwzcaw.supabase.co")
KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(URL, KEY)

# 2. تحميل الموديل (BGE-M3)
print("Loading BGE-M3 Model...")
model = SentenceTransformer('BAAI/bge-m3')

def test_rag_flow(user_query):
    print(f"\nUser Query: {user_query}")
    
    # 3. توليد الـ Embedding للسؤال
    print("Generating Embedding...")
    query_embedding = model.encode(user_query).tolist()
    
    # 4. البحث في Supabase
    print("Searching Database...")
    try:
        response = supabase.rpc(
            'match_documents',
            {
                'query_embedding': query_embedding,
                'match_threshold': 0.1,
                'match_count': 5
            }
        ).execute()
        
        matches = response.data
        
        if not matches:
            print("لم يتم العثور على نتائج متعلقة.")
            return

        # 5. صياغة الإجابة باستخدام Llama 3.1
        print("Aura is thinking...")
        
        # تجميع النصوص اللي لقيناها عشان الموديل يقرأها
        context_text = "\n".join([f"- {m['title']}" for m in matches])
        
        prompt = f"""
        أنت Aura، مساعد طبي ذكي. استخدم المعلومات التالية فقط للإجابة على سؤال المستخدم بدقة وباللغة العربية.
        إذا لم تجد الإجابة في المعلومات، قل "عذراً، هذه المعلومة غير متوفرة في سجلاتي الطبية حالياً".

        المعلومات المستخرجة:
        {context_text}

        سؤال المستخدم: {user_query}

        الإجابة:
        """
        
        # استدعاء Llama 3.1 (لازم يكون Ollama شغال في الخلفية)
        final_res = ollama.generate(model='llama3.1', prompt=prompt)
        
        print("\n" + "="*30)
        print("إجابة Aura Medical:")
        print(final_res['response'])
        print("="*30)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    query = input("اسأل Aura عن أي شيء طبي: ")
    test_rag_flow(query)
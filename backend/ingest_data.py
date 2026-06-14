import os
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer

# 1. إعدادت supabase (حط روابطك الحقيقية هنا)
URL = "https://uqlgxubapbcjggqwzcaw.supabase.co"
KEY = "sb_publishable_9gG0aH2Lc9CMxT2e54kUPQ_pAdmaMBo"  # حط الـ Key بتاعك هنا
supabase: Client = create_client(URL, KEY)

# 2. تحميل الموديل (BGE-M3) اللي بيطلع 1024
print("Loading Model...")
model = SentenceTransformer('BAAI/bge-m3')

# 3. البيانات الطبية بتاعتك (تقدر تزود نصوص أكتر هنا)
medical_data = [
    {"title": "Breast Cancer Symptoms",
     "content": "Lumps, skin dimpling, and nipple discharge are common symptoms."},
    {"title": "Diagnosis Methods",
     "content": "Mammograms, ultrasounds, and biopsies are used for diagnosis."},
    {"title": "Treatment Options",
     "content": "Surgery, chemotherapy, and radiation therapy are standard treatments."}
]


def start_ingestion():
    print("Starting to upload data to Aura Database...")
    for item in medical_data:
        # تحويل النص لأرقام (1024 بُعد)
        embedding = model.encode(item['content']).tolist()

        # رفع البيانات للجدول
        try:
            supabase.table("documents").insert({
                "title": item['title'],
                "content": item['content'],
                "embedding": embedding
            }).execute()
            print(f"✅ Successfully uploaded: {item['title']}")
        except Exception as e:
            print(f"❌ Error uploading {item['title']}: {e}")


if __name__ == "__main__":
    start_ingestion()

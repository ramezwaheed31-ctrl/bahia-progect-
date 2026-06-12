import io
import os
import time
import numpy as np
import tensorflow as tf
from PIL import Image
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "breast_cancer_model.keras")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(BASE_DIR, "breast_cancer_model.h5")

BINARY_MODEL_PATH = MODEL_PATH
MULTICLASS_MODEL_PATH = MODEL_PATH

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"[FATAL] Model file not found: {MODEL_PATH}")

print(f"[*] Loading model from: {MODEL_PATH}", flush=True)
_model = tf.keras.models.load_model(MODEL_PATH, compile=False)
print(f"[+] Model loaded OK", flush=True)

def load_models():
    return _model, _model

async def predict_breast_image(file_or_bytes) -> dict:
    ts = time.time()

    if hasattr(file_or_bytes, "read"):
        image_bytes = await file_or_bytes.read()
        await file_or_bytes.seek(0)
    else:
        image_bytes = file_or_bytes

    # --- القراءة الاحترافية لـ EfficientNet (عشان نمنع الـ Normal Bias) ---
    img_tensor = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
    img_tensor = tf.image.resize(img_tensor, [224, 224])
    
    img_array = img_tensor.numpy()
    img_array = np.expand_dims(img_array, axis=0)
    
    from tensorflow.keras.applications.efficientnet import preprocess_input
    img_array = preprocess_input(img_array)

    # --- Prediction ---
    prediction_probabilities = _model.predict(img_array, verbose=0)
    predicted_idx = int(np.argmax(prediction_probabilities[0]))

    # --- الترتيب المتطابق مع النوت بوك بالملي ---
    if predicted_idx == 0:
        mapped_result = "Benign"
        cancer_status = "Cancer"
        malignancy_status = "Benign"
    elif predicted_idx == 1:
        mapped_result = "Malignant"
        cancer_status = "Cancer"
        malignancy_status = "Malignant"
    else:
        mapped_result = "Normal"
        cancer_status = "No Cancer"
        malignancy_status = "Benign"

    return {
        "status": "success",
        "source": "model",
        "prediction": mapped_result,
        "label": mapped_result,
        "binary_label": mapped_result,
        "cancer_status": cancer_status,
        "malignancy_status": malignancy_status,
        "raw_probs": prediction_probabilities[0].tolist()
    }


# --- Direct upload endpoint ---
@router.post("/api/v1/mammogram/upload")
async def upload_mammogram(file: UploadFile = File(...)):
    fname = (file.filename or "").lower()
    if not fname.endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a .jpg or .png image."
        )
        
    try:
        result = await predict_breast_image(file)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}"
        )
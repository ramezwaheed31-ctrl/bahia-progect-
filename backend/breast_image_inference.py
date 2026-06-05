import os
import time
import tensorflow as tf
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException

# Create a FastAPI router for the integration
router = APIRouter()

# Paths to your trained models
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BINARY_MODEL_PATH = os.path.join(BASE_DIR, "mammogram_binary_classifier.h5")
MULTICLASS_MODEL_PATH = os.path.join(BASE_DIR, "mammogram_birads_classifier.h5")

_binary_model = None
_multi_model = None

print(f"Checking model files at: {BASE_DIR}", flush=True)
if os.path.exists(BINARY_MODEL_PATH) and os.path.exists(MULTICLASS_MODEL_PATH):
    print("Loading models into memory...", flush=True)
    _binary_model = tf.keras.models.load_model(BINARY_MODEL_PATH, compile=False)
    _multi_model = tf.keras.models.load_model(MULTICLASS_MODEL_PATH, compile=False)
    print("SUCCESS: BOTH MODELS LOADED SUCCESSFULLY", flush=True)
else:
    print("ERROR: MODEL FILES NOT FOUND AT THE SPECIFIED PATH", flush=True)
    if not os.path.exists(BINARY_MODEL_PATH): print(f"Missing: {BINARY_MODEL_PATH}", flush=True)
    if not os.path.exists(MULTICLASS_MODEL_PATH): print(f"Missing: {MULTICLASS_MODEL_PATH}", flush=True)

def load_models():
    """Returns the globally loaded models."""
    return _binary_model, _multi_model

async def predict_breast_image(image_bytes: bytes):
    """
    Accepts raw image bytes, applies preprocessing matching the training notebook,
    and runs sequential inference (Binary -> Multiclass).
    """
    # Force clear any previous local bindings
    image = None
    image_batch = None
    
    print(f"\n--- NEW PREDICTION REQUEST AT: {time.time()} ---", flush=True)
    
    binary_model, multi_model = load_models()
    print("USING LOADED MODELS FOR PREDICTION", flush=True)
    
    try:
        # 1. Preprocessing: EXACT match to Doctor's Notebook (Cell 18)
        try:
            # Decode image as 3-channel RGB
            image = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
        except Exception as e:
            return {"birads_result": "Unknown", "birads_label": "Invalid image data", "confidence": 0.0}
            
        # Resize to (224, 224)
        image = tf.image.resize(image, [224, 224])
        
        # Scaling: 1/255 normalization (as seen in notebook line 581)
        image = image / 255.0
        
        # Add batch dimension
        image_batch = tf.expand_dims(image, axis=0)
        
        # 2. Check if models are loaded
        if binary_model is None or multi_model is None:
            return {"birads_result": "Unknown", "birads_label": "Models not found on disk"}

        # 3. Binary Prediction (Normal vs Abnormal)
        y_pred_prob_bin = binary_model.predict(image_batch)
        print(f"RAW BINARY PROBABILITIES: {y_pred_prob_bin}", flush=True)
        
        # Handle both single-output (sigmoid) and two-output (softmax) binary models
        if y_pred_prob_bin.shape[-1] == 1:
            y_pred_bin = int(y_pred_prob_bin[0][0] > 0.5)
        else:
            y_pred_bin = np.argmax(y_pred_prob_bin, axis=1)[0]

        # Assume 0 is Normal and 1 is Abnormal.
        # NOTE: You may need to swap this mapping depending on how your binary model was trained!
        binary_mapping = {
            0: "Normal",
            1: "Abnormal"
        }
        
        binary_result = binary_mapping.get(y_pred_bin, "Unknown")
        
        # 4. Sequential Logic
        if binary_result == "Normal":
            # Return immediately if normal
            return {
                "binary_result": "Normal",
                "birads_result": "Normal",
                "birads_label": "Normal (No BI-RADS category needed)"
            }
            
        elif binary_result == "Abnormal":
            # Pass to Multiclass Model for BI-RADS classification
            y_pred_prob_multi = multi_model.predict(image_batch)
            print(f"RAW MULTICLASS PROBABILITIES: {y_pred_prob_multi}", flush=True)
            
            # Get the index with the highest probability
            y_pred_multi = int(np.argmax(y_pred_prob_multi[0]))
            highest_prob = float(np.max(y_pred_prob_multi[0]))
            
            # Print confidence percentage to the terminal
            print(f"Confidence: {highest_prob * 100:.2f}%", flush=True)
            
            # Validation: check if confidence is below 30%
            if highest_prob < 0.30:
                return {
                    "binary_result": "Abnormal",
                    "birads_result": "Unknown",
                    "birads_label": "The image provided does not look like a valid mammogram",
                    "confidence": highest_prob
                }
            
            # Multi-class mapping (updated to sequential DDSM mapping as requested)
            birads_mapping = {
                0: {"result": "1", "label": "BI-RADS 1"}, # Normal
                1: {"result": "3", "label": "BI-RADS 3"}, # Probably Benign
                2: {"result": "4", "label": "BI-RADS 4"}, # Suspicious
                3: {"result": "5", "label": "BI-RADS 5"}  # Highly Suggestive
            }
            
            prediction = birads_mapping.get(y_pred_multi, {"result": "Unknown", "label": "Unknown"})
            
            warning_msg = None
            # Add a check: if binary is Abnormal but BI-RADS is 1, trigger a warning
            if prediction["result"] == "1":
                warning_msg = "Warning: Binary model predicted 'Abnormal' but Multiclass predicted 'BIRAD 1'. Please verify model mapping or check for class imbalance."
                print(warning_msg, flush=True)
                
            response = {
                "binary_result": "Abnormal",
                "birads_result": prediction["result"],
                "birads_label": prediction["label"],
                "confidence": highest_prob
            }
            
            if warning_msg:
                response["warning"] = warning_msg
                
            return response
        
        else:
            return {"birads_result": "Unknown", "birads_label": "Unknown binary prediction", "confidence": 0.0}
    finally:
        # Explicitly delete/clear local variables containing image data to free memory
        del image
        del image_batch
        del image_bytes

@router.post("/api/v1/mammogram/upload")
async def upload_mammogram(file: UploadFile = File(...)):
    """
    Endpoint to receive the uploaded image and return BI-RADS classification.
    """
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
    
    try:
        # Read file as bytes and pass to the prediction function
        await file.seek(0)
        image_bytes = await file.read()
        result = await predict_breast_image(image_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

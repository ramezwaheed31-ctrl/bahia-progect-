import os
import tensorflow as tf

# حدد المسار الكامل للمجلد اللي فيه الملفات
BASE_DIR = r"C:\Users\ASUS\OneDrive\Desktop\FastApiProgicte"
binary_path = os.path.join(BASE_DIR, "mammogram_binary_classifier.h5")
multiclass_path = os.path.join(BASE_DIR, "mammogram_birads_classifier.h5")

print(f"Checking files at: {BASE_DIR}")

if os.path.exists(binary_path) and os.path.exists(multiclass_path):
    binary_model = tf.keras.models.load_model(binary_path, compile=False)
    multiclass_model = tf.keras.models.load_model(multiclass_path, compile=False)
    print("SUCCESS: BOTH MODELS LOADED SUCCESSFULLY")
else:
    print("ERROR: MODEL FILES NOT FOUND AT THE SPECIFIED PATH")
    if not os.path.exists(binary_path): print(f"Missing: {binary_path}")
    if not os.path.exists(multiclass_path): print(f"Missing: {multiclass_path}")

import os
import tensorflow as tf
import numpy as np

BASE_DIR = r"C:\Users\ASUS\OneDrive\Desktop\FastApiProgicte"
binary_path = os.path.join(BASE_DIR, "mammogram_binary_classifier.h5")

print("Loading model...")
model = tf.keras.models.load_model(binary_path, compile=False)

print("Testing with random noise...")
# Create a few random images
np.random.seed(42)
img1 = np.random.rand(1, 224, 224, 3).astype(np.float32)
img2 = np.random.rand(1, 224, 224, 3).astype(np.float32)
img3 = np.zeros((1, 224, 224, 3), dtype=np.float32)
img4 = np.ones((1, 224, 224, 3), dtype=np.float32)

pred1 = model.predict(img1, verbose=0)
pred2 = model.predict(img2, verbose=0)
pred3 = model.predict(img3, verbose=0)
pred4 = model.predict(img4, verbose=0)

print(f"Random Image 1: {pred1[0][0]}")
print(f"Random Image 2: {pred2[0][0]}")
print(f"All Zeros: {pred3[0][0]}")
print(f"All Ones: {pred4[0][0]}")

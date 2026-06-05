# Cell 1: Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')

# Cell 2: Verify your dataset folder

import os

# Your dataset path in Drive
DATA_DIR = "/content/drive/MyDrive/kaggle_datasets/CBIS-DDSM"

# List contents to confirm
print("Contents of CBIS-DDSM folder:")
print(os.listdir(DATA_DIR))

# Check for the JPEG folder
jpeg_path = os.path.join(DATA_DIR, "jpeg")
if os.path.exists(jpeg_path):
    print(f"\nJPEG folder found with {len(os.listdir(jpeg_path))} items")
else:
    print("\nWarning: 'jpeg' folder not found. Please check the folder name.")

from google.colab import drive
drive.mount('/content/drive')

# Cell 3: Install dependencies

!pip install pandas numpy matplotlib scikit-learn tensorflow opencv-python -q

# Cell 4: Load metadata (auto-detect CSV file)

import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
import os

DATA_DIR = "/content/drive/MyDrive/kaggle_datasets/CBIS-DDSM"

# Look for Excel files (.xlsx, .xls) instead of CSV
excel_files = [f for f in os.listdir(DATA_DIR) if f.endswith(('.xlsx', '.xls'))]
print("Excel files found:", excel_files)

if not excel_files:
    raise FileNotFoundError("No Excel (.xlsx) file found in the dataset folder.")

# Use the first Excel file (usually mass_case_description.xlsx)
META_FILE = os.path.join(DATA_DIR, excel_files[0])
df = pd.read_excel(META_FILE)   # <-- الأول زي ما هو

print(f"Loaded {len(df)} cases")
print("Columns:", df.columns.tolist())



# ===================== ADD ONLY THIS PART =====================

META_FILE2 = "/content/drive/MyDrive/kaggle_datasets/CBIS-DDSM/correctSheetlast.xlsx"

df_table = pd.read_excel(META_FILE2, sheet_name="tabel ")
df_correct = pd.read_excel(META_FILE2, sheet_name="correctSheet")

print("Table loaded:", df_table.shape)
print("CorrectSheet loaded:", df_correct.shape)

# Cell 4: Load metadata (auto-detect CSV file)

import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
import os

DATA_DIR = "/content/drive/MyDrive/kaggle_datasets/CBIS-DDSM"

# Look for Excel files (.xlsx, .xls) instead of CSV
excel_files = [f for f in os.listdir(DATA_DIR) if f.endswith(('.xlsx', '.xls'))]
print("Excel files found:", excel_files)

if not excel_files:
    raise FileNotFoundError("No Excel (.xlsx) file found in the dataset folder.")

# Use the first Excel file (usually mass_case_description.xlsx)
META_FILE = os.path.join(DATA_DIR, excel_files[0])
df = pd.read_excel(META_FILE)   # <-- الأول زي ما هو

print(f"Loaded {len(df)} cases")
print("Columns:", df.columns.tolist())



# ===================== ADD ONLY THIS PART =====================

META_FILE2 = "/content/drive/MyDrive/kaggle_datasets/CBIS-DDSM/correctSheetlast.xlsx"

df_table = pd.read_excel(META_FILE2, sheet_name="tabel ")
df_correct = pd.read_excel(META_FILE2, sheet_name="correctSheet")

print("Table loaded:", df_table.shape)
print("CorrectSheet loaded:", df_correct.shape)

df = df_correct

# Cell 5: Map BI-RADS to binary and multi-class labels

import pandas as pd

birads_col = "Assesment"
print(f"Using BI-RADS column: {birads_col}")

# -----------------------------
# 1) Extract BI-RADS number
# -----------------------------
def parse_birads_value(val):
    if pd.isna(val):
        return -1

    val_str = str(val).strip().upper()

    if "BIRAD" in val_str:
        try:
            return int(''.join(filter(str.isdigit, val_str)))
        except:
            return -1

    if val_str.isdigit():
        return int(val_str)

    return -1


# -----------------------------
# 2) Binary classification
# -----------------------------
def map_to_binary(birads_val):
    if birads_val == 1:
        return 0   # Normal
    elif birads_val in [3, 4, 5]:
        return 1   # Abnormal
    else:
        return -1


# -----------------------------
# 3) Multi-class mapping (FIXED)
#    based on YOUR actual folders: 1,3,4,5
# -----------------------------
def fix_class(x):
    if x == 1:
        return 0
    elif x == 3:
        return 1
    elif x == 4:
        return 2
    elif x == 5:
        return 3
    else:
        return -1


# -----------------------------
# Apply processing
# -----------------------------
df_processed = df.copy()

df_processed["parsed_birads"] = df_processed[birads_col].apply(parse_birads_value)

df_processed["binary_label"] = df_processed["parsed_birads"].apply(map_to_binary)

df_processed = df_processed[df_processed["binary_label"] != -1]

df_processed["birads_class"] = df_processed["parsed_birads"].apply(fix_class)

df_processed = df_processed[df_processed["birads_class"] != -1]

df = df_processed


# -----------------------------
# Results
# -----------------------------
print(f"Total valid cases: {len(df)}")

print("\nBinary distribution:\n", df["binary_label"].value_counts())

print("\nBI-RADS distribution:\n", df["birads_class"].value_counts())

# Cell 6: Find image paths (recursive search)

import re # Import re for regex operations

# Look for a column that might contain the image filename
possible_filename_cols = ['image_file_path', 'file_path', 'image_filename', 'filename', 'image_full_path']
filename_col = None
for col in possible_filename_cols:
    if col in df.columns:
        filename_col = col
        break

image_paths_collected = {} # Dictionary to store all image paths for each patient ID

# Define image extensions to look for
IMG_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff')

if filename_col:
    print(f"Using filename column: {filename_col}")
    df['image_full_path'] = df[filename_col] # Assuming the column already contains full paths
else:
    print("No direct filename column. Searching for images by patientID...")

    # First, clean patientID in DataFrame to a standard 'BCXXXXXX' format (no spaces, all caps)
    def clean_df_patient_id(pid):
        if pd.isna(pid):
            return None
        pid_str = str(pid).strip()
        # Try to extract 'BC' followed by numbers, optionally with spaces
        match = re.search(r'BC\s*(\d+)', pid_str, re.IGNORECASE)
        if match:
            # Pad with leading zeros to ensure 6 digits, e.g., BC007741
            return 'BC' + match.group(1).zfill(6)
        return None

    # Apply cleaning to the patientID column
    df['patientID_cleaned'] = df['PatientID'].apply(clean_df_patient_id)
    # Drop rows where patientID could not be cleaned (no valid 'BCXXXXXX' pattern found)
    initial_df_len_before_cleaning = len(df)
    df.dropna(subset=['patientID_cleaned'], inplace=True)
    if len(df) < initial_df_len_before_cleaning:
        print(f"Warning: Removed {initial_df_len_before_cleaning - len(df)} rows due to unparsable patientIDs.")

    # Recursively search for image files
    for root, _, files in os.walk(DATA_DIR):
        for file in files:
            if file.lower().endswith(IMG_EXTENSIONS):
                full_path = os.path.join(root, file)

                # Extract patientID from filename (e.g., '2018_BC005421_CC_L.jpg' -> 'BC005421')
                filename_parts = os.path.splitext(file)[0].split('_')
                extracted_patient_id = None
                if len(filename_parts) > 1:
                    # Assuming filename format is 'YYYY_BCXXXXXX_VIEW_SIDE'
                    potential_id_part = filename_parts[1].strip().upper()
                    # Validate if it looks like BC followed by digits
                    if potential_id_part.startswith('BC') and potential_id_part[2:].isdigit():
                        extracted_patient_id = potential_id_part

                if extracted_patient_id:
                    # Store all image paths for a given patient ID
                    if extracted_patient_id not in image_paths_collected:
                        image_paths_collected[extracted_patient_id] = []
                    image_paths_collected[extracted_patient_id].append(full_path)

    # After collecting all image paths for each cleaned patient ID,
    # create a mapping from patientID_cleaned to a single image path.
    # For now, we take the first image found for each patient. This is a simplification;
    # a more robust solution might require view/laterality matching if available in metadata.
    single_image_path_map = {pid: paths[0] for pid, paths in image_paths_collected.items() if paths}

    # Create the 'image_full_path' column by mapping cleaned patient IDs to image paths
    df['image_full_path'] = df['patientID_cleaned'].map(single_image_path_map)

    # Drop the temporary 'patientID_cleaned' column as it's no longer needed
    df.drop(columns=['patientID_cleaned'], inplace=True)

    # Filter out rows where image paths were not found after the search
    initial_len_after_cleaning = len(df)
    df.dropna(subset=['image_full_path'], inplace=True)
    if len(df) < initial_len_after_cleaning:
        print(f"Warning: Removed {initial_len_after_cleaning - len(df)} rows due to missing image paths after search.")

print(f"Found {len(df['image_full_path'].dropna())} image paths.")
if df['image_full_path'].isnull().any():
    print("Some entries still have missing image paths after search.")

print(len(df))
print(df['image_full_path'].isnull().sum())

from sklearn.utils.class_weight import compute_class_weight
import numpy as np

classes = np.array([0, 1])
weights = compute_class_weight('balanced', classes=classes, y=df['binary_label'])

class_weights = {0: weights[0], 1: weights[1]}
print(class_weights)

import tensorflow as tf # Ensure tf is imported here if not already

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

def load_and_preprocess_image(image_full_path, label):
    # Ensure image_full_path is a string tensor for consistency
    image_full_path_str = tf.cast(image_full_path, tf.string)

    # Encapsulate the file existence check within tf.py_function
    # The lambda function decodes the tensor path to a Python string before checking existence.
    file_exists = tf.py_function(
        lambda path: tf.io.gfile.exists(path.numpy().decode('utf-8')),
        [image_full_path_str],
        tf.bool
    )

    # Define functions for tf.cond to execute based on file_exists
    def process_image():
        image = tf.io.read_file(image_full_path)
        image = tf.image.decode_jpeg(image, channels=3) # Use decode_jpeg as indicated by original intent
        image = tf.image.resize(image, IMG_SIZE)
        image = image / 255.0
        return image, label

    def return_blank_image():
        # Use tf.print to log warning in graph mode
        tf.print(f"Warning: Image not found at {image_full_path_str}, returning blank image.", output_stream=tf.experimental.io.to_stderr())
        return tf.zeros((IMG_SIZE[0], IMG_SIZE[1], 3)), label

    # Use tf.cond for conditional execution within the TensorFlow graph
    return tf.cond(file_exists, process_image, return_blank_image)

import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
import os
import sys

# Restore the original load_and_preprocess_image definition here too for completeness,
# though it's already defined in Cell 7.
# This ensures that if this cell is run independently, the function is available.
# For proper execution flow, Cell 7 should still be run first, then this cell.
def load_and_preprocess_image(image_path, label):
    def load_image():
        image = tf.io.read_file(image_path)
        image = tf.image.decode_jpeg(image, channels=3)  # adjust if PNG
        image = tf.image.resize(image, [IMG_SIZE[0], IMG_SIZE[1]]) # Use IMG_SIZE tuple
        image = image / 255.0  # normalize to [0,1]
        return image

    def return_blank_image():
        tf.print(f"Warning: Image not found at {image_path}, returning blank image.")
        return tf.zeros([IMG_SIZE[0], IMG_SIZE[1], 3]) # Use IMG_SIZE tuple

    # The actual check should use the py_function version from Cell 7 for graph compatibility
    # For simplicity, if this cell is run after Cell 7, the global load_and_preprocess_image will be used.
    # If run in isolation, tf.io.gfile.exists might still error on SymbolicTensor.
    # However, given the context, we expect Cell 7 to define the robust version.
    # So we call the function defined in Cell 7, assuming it's up-to-date.
    # This part of the code would ideally just call the *global* load_and_preprocess_image.
    # But for an isolated fix within this cell, we need its definition or to rely on Cell 7.
    # Reusing the logic from Cell 7 for `tf.cond` call.
    image_full_path_str = tf.cast(image_path, tf.string)
    file_exists = tf.py_function(
        lambda path: tf.io.gfile.exists(path.numpy().decode('utf-8')),
        [image_full_path_str],
        tf.bool
    )
    image = tf.cond(file_exists, load_image, return_blank_image)
    return image, label


# --- Diagnostic check: Verify 'image_full_path' column exists ---
print("Columns in df before splitting:", df.columns.tolist())
if 'image_full_path' not in df.columns:
    raise KeyError("Error: 'image_full_path' column not found in DataFrame 'df'. "
                   "Please re-run Cell 6 to ensure image paths are correctly mapped.")
# -----------------------------------------------------------------

# Split data
train_val_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['binary_label'])
train_df, val_df = train_test_split(train_val_df, test_size=0.2, random_state=42, stratify=train_val_df['binary_label'])

# Binary datasets - use 'image_full_path' as the first element of the tensor slices
train_ds = tf.data.Dataset.from_tensor_slices((train_df['image_full_path'].values, train_df['binary_label'].values))
train_ds = train_ds.map(load_and_preprocess_image, num_parallel_calls=tf.data.AUTOTUNE)
train_ds = train_ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

val_ds = tf.data.Dataset.from_tensor_slices((val_df['image_full_path'].values, val_df['binary_label'].values))
val_ds = val_ds.map(load_and_preprocess_image, num_parallel_calls=tf.data.AUTOTUNE)
val_ds = val_ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

test_ds = tf.data.Dataset.from_tensor_slices((test_df['image_full_path'].values, test_df['binary_label'].values))
test_ds = test_ds.map(load_and_preprocess_image, num_parallel_calls=tf.data.AUTOTUNE)
test_ds = test_ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

# Multi-class BI-RADS datasets
train_multi = tf.data.Dataset.from_tensor_slices((train_df['image_full_path'].values, train_df['birads_class'].values))
train_multi = train_multi.map(load_and_preprocess_image, num_parallel_calls=tf.data.AUTOTUNE).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

val_multi = tf.data.Dataset.from_tensor_slices((val_df['image_full_path'].values, val_df['birads_class'].values))
val_multi = val_multi.map(load_and_preprocess_image, num_parallel_calls=tf.data.AUTOTUNE).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

test_multi = tf.data.Dataset.from_tensor_slices((test_df['image_full_path'].values, test_df['birads_class'].values))
test_multi = test_multi.map(load_and_preprocess_image, num_parallel_calls=tf.data.AUTOTUNE).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

for x, y in train_ds.take(1):
    print(x.shape, y.shape)

# Cell 9: Build binary classification model (Normal vs. Abnormal)

from tensorflow.keras.applications import ResNet50
from tensorflow.keras import layers, models

base = ResNet50(weights='imagenet', include_top=False, input_shape=(224,224,3))
base.trainable = False

model_binary = models.Sequential([
    base,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dense(128, activation='relu'),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(1, activation='sigmoid')
])

model_binary.compile(optimizer='adam',
                     loss='binary_crossentropy',
                     metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])

model_binary.summary()

# Cell 10: Multi-class model
base2 = ResNet50(weights='imagenet', include_top=False, input_shape=(224,224,3))
base2.trainable = True

model_multi = models.Sequential([
    base2,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(4, activation='softmax')
])

model_multi.compile(optimizer='adam',
                    loss='sparse_categorical_crossentropy',
                    metrics=['accuracy'])

model_multi.summary()

# Cell 11: Train binary
EPOCHS = 20
history_bin = model_binary.fit(train_ds, validation_data=val_ds, epochs=EPOCHS)

# Cell 12: Train multi-class
history_multi = model_multi.fit(train_multi, validation_data=val_multi, epochs=EPOCHS)

# Cell 13: Evaluate binary
loss, acc, prec, rec = model_binary.evaluate(test_ds)
print(f"Binary Test -> Acc: {acc:.4f}, Prec: {prec:.4f}, Rec: {rec:.4f}")

# Plot accuracy/loss
def plot_history(hist, title):
    plt.figure(figsize=(12,4))
    plt.subplot(1,2,1)
    plt.plot(hist.history['accuracy'], label='Train')
    plt.plot(hist.history['val_accuracy'], label='Val')
    plt.title(f'{title} - Accuracy')
    plt.legend()
    plt.subplot(1,2,2)
    plt.plot(hist.history['loss'], label='Train')
    plt.plot(hist.history['val_loss'], label='Val')
    plt.title(f'{title} - Loss')
    plt.legend()
    plt.show()

plot_history(history_bin, "Binary")

# Cell 15: Evaluate multi-class
loss_multi, acc_multi = model_multi.evaluate(test_multi)
print(f"Multi-class Test Accuracy: {acc_multi:.4f}")

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report

# Get true labels from the test_df for multi-class classification
y_test_true = test_df['birads_class'].values

# Predict probabilities for the test_multi dataset
# model_multi.predict expects a tf.data.Dataset, which test_multi is
y_pred_prob = model_multi.predict(test_multi)
y_pred = np.argmax(y_pred_prob, axis=1)   # class with highest probability

# y_test_true should be integer labels (0, 1, 2, 3)
cm = confusion_matrix(y_test_true, y_pred)

# Define class names based on the fix_class mapping (0->1, 1->3, 2->4, 3->5)
class_names = ['BIRAD 1', 'BIRAD 3', 'BIRAD 4', 'BIRAD 5']

# Plot
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=class_names,
            yticklabels=class_names)
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix - Multi-class (4 classes)')
plt.show()

# Optional: print precision/recall/f1 per class
print(classification_report(y_test_true, y_pred, target_names=class_names))

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report

# Get true labels from the test_df for binary classification
y_test_true_binary = test_df['binary_label'].values

# Predict probabilities for the test_ds dataset
y_pred_prob_binary = model_binary.predict(test_ds)
y_pred_binary = (y_pred_prob_binary > 0.5).astype(int)

# Compute confusion matrix
cm_binary = confusion_matrix(y_test_true_binary, y_pred_binary)

# Plot using seaborn
plt.figure(figsize=(6,5))
sns.heatmap(cm_binary, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Normal', 'Abnormal'],
            yticklabels=['Normal', 'Abnormal'])
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix - Binary Classification')
plt.show()

# Optional: Print classification report
print(classification_report(y_test_true_binary, y_pred_binary, target_names=['Normal', 'Abnormal']))

# Cell 16: Save models
model_binary.save('/content/drive/MyDrive/mammogram_binary_classifier.h5')
model_multi.save('/content/drive/MyDrive/mammogram_birads_classifier.h5')
print("Models saved to Drive.")

# Cell 17: Create feature extractor (ResNet50 base) and reference mammogram features
feature_extractor = tf.keras.Model(
    inputs=model_binary.layers[0].input,
    outputs=model_binary.layers[0].output
)

def get_feature_vector(image_tensor):
    features = feature_extractor.predict(image_tensor, verbose=0)
    features = tf.reduce_mean(features, axis=[1,2])  # global average pool
    return features.numpy()

# Collect 100 random training mammograms
sample_ds = train_ds.unbatch().take(100)
feat_list = []
for img, _ in sample_ds:
    img_batch = tf.expand_dims(img, axis=0)
    feat_list.append(get_feature_vector(img_batch))
ref_features = np.vstack(feat_list)
mean_feature = np.mean(ref_features, axis=0)

# Similarity threshold (tune as needed)
SIMILARITY_THRESHOLD = 0.6

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

print("Reference feature shape:", mean_feature.shape)

import cv2
from google.colab.patches import cv2_imshow
#path = "/content/drive/MyDrive/kaggle_datasets/CBIS-DDSM/Birad3/b3/2019_BC0026061_ MLO_R.jpg"

img = cv2.imread('/content/drive/MyDrive/kaggle_datasets/CBIS-DDSM/Birad3/b3/2013_BC003026_ CC_R.jpg')
res = cv2.resize(img, (300,300))

cv2_imshow(res)

# Cell 18: Prediction with mammogram check
def preprocess_image_for_inference(image_path):
    image = tf.io.read_file(image_path)
    image = tf.image.decode_image(image, channels=3, expand_animations=False)
    image = tf.image.resize(image, IMG_SIZE)
    image = image / 255.0
    return tf.expand_dims(image, axis=0)

def is_breast_image(image_path):
    proc = preprocess_image_for_inference(image_path)
    feat = get_feature_vector(proc)
    sim = cosine_sim(feat[0], mean_feature)
    return sim >= SIMILARITY_THRESHOLD, sim

def predict_with_validation(image_path):
    is_breast, sim = is_breast_image(image_path)
    if not is_breast:
        return {
            'valid': False,
            'message': f"Image does not appear to be a breast mammogram. Similarity: {sim:.3f} < {SIMILARITY_THRESHOLD}"
        }
    proc = preprocess_image_for_inference(image_path)

    # Binary
    prob_abn = model_binary.predict(proc, verbose=0)[0][0]
    if prob_abn >= 0.5:
        bin_label = "Abnormal"
        bin_conf = prob_abn
    else:
        bin_label = "Normal"
        bin_conf = 1 - prob_abn

    # Multi-class
    probs = model_multi.predict(proc, verbose=0)[0]
    birads = np.argmax(probs) + 1
    birads_conf = probs[birads-1]

    return {
        'valid': True,
        'similarity': sim,
        'binary_label': bin_label,
        'binary_confidence': bin_conf,
        'birads_score': birads,
        'birads_confidence': birads_conf,
        'birads_probs': probs
    }

# Cell 19: Upload image and get prediction
from google.colab import files

print("Upload a mammogram image (JPEG/PNG):")
uploaded = files.upload()

for fname, content in uploaded.items():
    with open(fname, 'wb') as f:
        f.write(content)
    result = predict_with_validation(fname)
    print(f"\n--- Results for {fname} ---")
    if not result['valid']:
        print("❌", result['message'])
    else:
        print(f"✓ Mammogram similarity: {result['similarity']:.3f}")
        print(f"• Normal/Abnormal: {result['binary_label']} (conf: {result['binary_confidence']:.4f})")
        print(f"• Predicted BI-RADS: {result['birads_score']} (conf: {result['birads_confidence']:.4f})")
        print("• Full BI-RADS distribution:")
        for i, p in enumerate(result['birads_probs']):
            print(f"   BI-RADS {i+1}: {p:.4f}")

# Cell 20: Optional – compute similarities among training mammograms
intra_sims = []
for i in range(len(ref_features)):
    for j in range(i+1, len(ref_features)):
        intra_sims.append(cosine_sim(ref_features[i], ref_features[j]))
print(f"Mean intra-class similarity: {np.mean(intra_sims):.3f} ± {np.std(intra_sims):.3f}")
plt.hist(intra_sims, bins=30)
plt.xlabel("Cosine similarity")
plt.ylabel("Frequency")
plt.title("Similarity among mammogram images (training set)")
plt.show()

model_binary.save('breast_cancer_binary_model.h5')
model_multi.save('breast_cancer_multiclass_model.h5')




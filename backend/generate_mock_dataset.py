import os
from PIL import Image
import numpy as np

DISEASE_CLASS_NAMES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

def generate_mock_dataset():
    dataset_dir = os.path.join("data", "plantvillage")
    os.makedirs(dataset_dir, exist_ok=True)
    
    print("Generating mock PlantVillage dataset...")
    for idx, class_name in enumerate(DISEASE_CLASS_NAMES):
        class_path = os.path.join(dataset_dir, class_name)
        os.makedirs(class_path, exist_ok=True)
        
        # Generate 2 dummy images for each class
        for img_idx in range(2):
            img_path = os.path.join(class_path, f"mock_{img_idx}.jpg")
            if not os.path.exists(img_path):
                # Create a 224x224 RGB image with random colors
                arr = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
                img = Image.fromarray(arr)
                img.save(img_path)
                
    print(f"Generated mock dataset with {len(DISEASE_CLASS_NAMES)} classes at {dataset_dir}")

if __name__ == "__main__":
    generate_mock_dataset()

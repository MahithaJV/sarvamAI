"""
Train a plant disease detection model using transfer learning with MobileNetV2 (PyTorch).

This script uses the PlantVillage dataset and trains a CNN classifier
that can identify 38 classes of crop diseases from leaf images.

Usage:
    python train_disease_model.py

Requirements:
    - PyTorch, torchvision
    - Pillow
    - PlantVillage dataset at data/plantvillage/

The trained model will be saved to models/disease_model.pth
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms, models

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 10
MODEL_OUTPUT_PATH = os.path.join("models", "disease_model.pth")
DATASET_DIR = os.path.join("data", "plantvillage")

os.makedirs("models", exist_ok=True)


def check_dataset():
    """Verify the PlantVillage dataset exists."""
    if os.path.exists(DATASET_DIR) and len(os.listdir(DATASET_DIR)) > 0:
        print(f"Dataset found at {DATASET_DIR}")
        return True

    print("PlantVillage dataset not found.")
    print("Please download the PlantVillage dataset and extract it to: data/plantvillage/")
    print("The directory should contain subfolders for each class, e.g.:")
    print("  data/plantvillage/Tomato___Early_blight/")
    print("  data/plantvillage/Tomato___healthy/")
    print("  data/plantvillage/Corn_(maize)___Common_rust_/")
    print("")
    print("You can download it from:")
    print("  - https://www.kaggle.com/datasets/emmarex/plantdisease")
    print("  - https://github.com/spMohanty/PlantVillage-Dataset")
    return False


def train():
    """Train the disease detection model using MobileNetV2 transfer learning."""
    if not check_dataset():
        return

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Data transforms with augmentation for training
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    # Load full dataset to get class info
    full_dataset = datasets.ImageFolder(DATASET_DIR, transform=train_transform)
    num_classes = len(full_dataset.classes)
    print(f"Found {num_classes} classes: {full_dataset.classes}")

    # Split into train and validation (80/20)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    # Apply validation transform to val set
    val_dataset.dataset = datasets.ImageFolder(DATASET_DIR, transform=val_transform)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    print(f"Training samples: {train_size}, Validation samples: {val_size}")

    # Build model using MobileNetV2 with pre-trained weights
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)

    # Freeze feature extractor layers
    for param in model.features.parameters():
        param.requires_grad = False

    # Replace the classifier head
    model.classifier[1] = nn.Linear(model.last_channel, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

    best_val_acc = 0.0

    print(f"\nTraining for {EPOCHS} epochs...")
    for epoch in range(EPOCHS):
        # Training phase
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for batch_idx, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

            if (batch_idx + 1) % 50 == 0:
                print(f"  Epoch {epoch+1}/{EPOCHS}, Batch {batch_idx+1}/{len(train_loader)}, Loss: {loss.item():.4f}")

        train_acc = correct / total
        train_loss = running_loss / len(train_loader)

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                _, predicted = torch.max(outputs, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()

        val_acc = val_correct / val_total
        val_loss = val_loss / len(val_loader)
        scheduler.step(val_loss)

        print(f"Epoch {epoch+1}/{EPOCHS} — Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}, Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), MODEL_OUTPUT_PATH)
            print(f"  -> Best model saved (Val Acc: {val_acc:.4f})")

    print(f"\nTraining complete. Best validation accuracy: {best_val_acc:.4f}")
    print(f"Model saved to {MODEL_OUTPUT_PATH}")

    # Save class names mapping
    class_names_path = os.path.join("models", "disease_class_names.txt")
    with open(class_names_path, "w") as f:
        for idx, name in enumerate(full_dataset.classes):
            f.write(f"{idx}: {name}\n")
    print(f"Class names saved to {class_names_path}")


if __name__ == "__main__":
    train()

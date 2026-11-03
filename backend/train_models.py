import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import pickle
import os

os.makedirs("models", exist_ok=True)

def train_price_model():
    if not os.path.exists("data/crop_prices.csv"):
        print("Data not found. Run generate_data.py first.")
        return

    df = pd.DataFrame(pd.read_csv("data/crop_prices.csv"))
    
    # Encode categorical variable (crop)
    le = LabelEncoder()
    df['crop_encoded'] = le.fit_transform(df['crop'])
    
    # Features & Target
    X = df[['day_of_year', 'crop_encoded', 'rainfall', 'temperature', 'humidity']]
    y = df['price']
    
    # Train the model
    # Training on full dataset
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    
    # Save the model
    with open("models/price_model.pkl", "wb") as f:
        pickle.dump(model, f)
        
    # Save label encoder
    with open("models/crop_encoder.pkl", "wb") as f:
        pickle.dump(le, f)
        
    print("Model trained and saved to models/price_model.pkl")

if __name__ == "__main__":
    train_price_model()

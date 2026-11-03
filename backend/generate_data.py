import pandas as pd
import numpy as np
import random
import os

# Create data directory
os.makedirs("data", exist_ok=True)

def generate_price_data():
    np.random.seed(42)
    random.seed(42)
    
    crops = ['Wheat', 'Rice', 'Corn', 'Cotton']
    data = []
    
    # Generate 730 days (2 years) of synthetic historical data for each crop
    for crop in crops:
        base_price = random.randint(1500, 3000)
        # Seasonal base prices logic
        for day in range(1, 731):
            day_of_year = (day - 1) % 365 + 1
            
            # Apply daily price variation (-2% to +2%)
            price_change = random.uniform(-0.02, 0.02)
            # Add a slight seasonal drift based on day_of_year
            drift = np.sin((day_of_year / 365) * 2 * np.pi) * 5
            base_price = base_price * (1 + price_change) + drift
            
            # constrain absolute minimum price
            base_price = max(base_price, 500)
            
            # features: rainfall(mm), temperature(C), humidity(%) with some daily fluctuation
            rainfall = max(0, random.uniform(50, 200) + np.sin((day_of_year / 365) * 2 * np.pi) * 50)
            temperature = random.uniform(20, 35) + np.cos((day_of_year / 365) * 2 * np.pi) * 10
            humidity = random.uniform(40, 80)
            
            data.append({
                'day_of_year': day_of_year,
                'crop': crop,
                'rainfall': round(rainfall, 2),
                'temperature': round(temperature, 2),
                'humidity': round(humidity, 2),
                'price': round(base_price, 2)
            })
            
    df = pd.DataFrame(data)
    df.to_csv("data/crop_prices.csv", index=False)
    print(f"Generated {len(df)} rows of data in data/crop_prices.csv")

if __name__ == "__main__":
    generate_price_data()

import pandas as pd
import pickle
from sklearn.linear_model import LinearRegression

# Load data (adjust path as needed)
data = pd.read_csv('../public/crop_prices.csv')
X = data[['some_feature']]  # Replace with your features
y = data['Market Price'] / 100  # Convert to ₹/KG

# Train model
model = LinearRegression()
model.fit(X, y)

# Save model
with open('model.pkl', 'wb') as file:
    pickle.dump(model, file)
print("Model saved as model.pkl")
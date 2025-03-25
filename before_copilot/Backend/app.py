from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# Load the trained model
model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')  # Ensure correct path
with open(model_path, 'rb') as file:
    model = pickle.load(file)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get data from frontend
        data = request.get_json()

        crop = data.get('crop')
        region = data.get('region')
        features = data.get('features')  # List of historical prices (e.g., last 7 days)

        # Validate input
        if not isinstance(features, list) or len(features) == 0:
            return jsonify({'error': 'Invalid input: Features should be a non-empty list'}), 400

        # Convert to NumPy array
        input_data = np.array(features, dtype=np.float32).reshape(1, -1)

        # Make prediction
        prediction = model.predict(input_data)[0]

        # Return prediction as JSON
        return jsonify({
            'crop': crop,
            'region': region,
            'predicted_price': float(prediction)  # ₹/KG
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500  # Return error message

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

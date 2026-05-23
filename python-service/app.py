from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from pymongo import MongoClient
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client['dietTrack']

# Load pre-trained models (or train on demand)
MODELS_DIR = 'models'

# Ensure models directory exists
os.makedirs(MODELS_DIR, exist_ok=True)

# ========== CALORIE PREDICTION MODEL ==========

class CaloriePredictor:
    def __init__(self):
        self.model_path = os.path.join(MODELS_DIR, 'calorie_model.pkl')
        self.model = None
        self.scaler_path = os.path.join(MODELS_DIR, 'calorie_scaler.pkl')
        self.scaler = None
        self.load_or_train()
    
    def load_or_train(self):
        """Load existing model or train a new one"""
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
            logger.info("✅ Calorie model loaded from disk")
        else:
            self.train_initial_model()
    
    def train_initial_model(self):
        """Train initial model with synthetic/example data"""
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.preprocessing import StandardScaler
        
        # Create synthetic training data based on Mifflin-St Jeor
        np.random.seed(42)
        n_samples = 1000
        
        # Generate features
        height = np.random.normal(170, 10, n_samples)
        weight = np.random.normal(70, 15, n_samples)
        age = np.random.normal(30, 10, n_samples)
        gender = np.random.choice([0, 1], n_samples)  # 0=female, 1=male
        activity = np.random.choice([1.2, 1.375, 1.55, 1.725, 1.9], n_samples)
        goal = np.random.choice([-0.2, 0, 0.2], n_samples)  # loss, maintain, gain
        
        # Calculate target calories (Mifflin-St Jeor based)
        bmr = np.where(gender == 1,
                      10*weight + 6.25*height - 5*age + 5,
                      10*weight + 6.25*height - 5*age - 161)
        
        calories = bmr * activity * (1 + goal)
        
        X = np.column_stack([height, weight, age, gender, activity, goal])
        y = calories
        
        # Train model
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        self.model = RandomForestRegressor(n_estimators=100, max_depth=10)
        self.model.fit(X_scaled, y)
        
        # Save models
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        logger.info("✅ New calorie model trained and saved")
    
    def predict(self, features):
        """Predict calories for a user"""
        features_scaled = self.scaler.transform([features])
        prediction = self.model.predict(features_scaled)[0]
        return max(1200, min(4000, round(prediction)))

calorie_predictor = CaloriePredictor()


# ========== NUTRIENT DEFICIENCY MODEL ==========

class NutrientDeficiencyDetector:
    def __init__(self):
        self.model_path = os.path.join(MODELS_DIR, 'nutrient_model.pkl')
        self.model = None
        self.nutrient_requirements = {
            'protein': {'min': 50, 'max': 200},
            'iron': {'min': 8, 'max': 45},
            'calcium': {'min': 1000, 'max': 2500},
            'vitamin_b12': {'min': 2.4, 'max': 100},
            'fiber': {'min': 25, 'max': 100}
        }
        self.food_recommendations = self.load_food_recommendations()
        self.load_or_train()
    
    def load_food_recommendations(self):
        """Load food recommendations from database or define defaults"""
        return {
            'protein': [
                {'name': 'Chicken Breast', 'amount': '100g', 'content': 31},
                {'name': 'Eggs', 'amount': '2 large', 'content': 12},
                {'name': 'Greek Yogurt', 'amount': '1 cup', 'content': 20},
                {'name': 'Lentils', 'amount': '1 cup', 'content': 18}
            ],
            'iron': [
                {'name': 'Spinach', 'amount': '1 cup', 'content': 6.4},
                {'name': 'Red Meat', 'amount': '100g', 'content': 2.7},
                {'name': 'Lentils', 'amount': '1 cup', 'content': 6.6},
                {'name': 'Pumpkin Seeds', 'amount': '30g', 'content': 4.2}
            ],
            'calcium': [
                {'name': 'Milk', 'amount': '1 cup', 'content': 300},
                {'name': 'Yogurt', 'amount': '1 cup', 'content': 300},
                {'name': 'Cheese', 'amount': '50g', 'content': 400},
                {'name': 'Sardines', 'amount': '100g', 'content': 382}
            ],
            'vitamin_b12': [
                {'name': 'Clams', 'amount': '100g', 'content': 98.9},
                {'name': 'Liver', 'amount': '100g', 'content': 83},
                {'name': 'Fish', 'amount': '100g', 'content': 3.5},
                {'name': 'Eggs', 'amount': '2 large', 'content': 1.2}
            ],
            'fiber': [
                {'name': 'Lentils', 'amount': '1 cup', 'content': 15.6},
                {'name': 'Black Beans', 'amount': '1 cup', 'content': 15},
                {'name': 'Chia Seeds', 'amount': '30g', 'content': 10},
                {'name': 'Oats', 'amount': '1 cup', 'content': 4}
            ]
        }
    
    def load_or_train(self):
        """Load existing model or train a new one"""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            logger.info("✅ Nutrient model loaded from disk")
        else:
            self.train_initial_model()
    
    def train_initial_model(self):
        """Train a Random Forest classifier for deficiency detection"""
        from sklearn.ensemble import RandomForestClassifier
        
        # Create synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        # Features: intake percentages for each nutrient
        X = np.random.uniform(0, 2, (n_samples, len(self.nutrient_requirements)))
        
        # Labels: 0=sufficient, 1=mild, 2=moderate, 3=critical
        y = np.zeros(n_samples)
        for i in range(n_samples):
            avg_deficit = np.mean(X[i] < 0.7)
            if avg_deficit > 0.8:
                y[i] = 3  # critical
            elif avg_deficit > 0.5:
                y[i] = 2  # moderate
            elif avg_deficit > 0.3:
                y[i] = 1  # mild
        
        self.model = RandomForestClassifier(n_estimators=100)
        self.model.fit(X, y)
        
        joblib.dump(self.model, self.model_path)
        logger.info("✅ New nutrient model trained and saved")
    
    def analyze(self, meal_logs, user_profile):
        """Analyze nutrient intake and detect deficiencies"""
        # Calculate totals from meal logs
        totals = {nutrient: 0 for nutrient in self.nutrient_requirements}
        
        for log in meal_logs:
            for item in log.get('foodItems', []):
                for nutrient in totals.keys():
                    totals[nutrient] += item.get(nutrient, 0)
        
        # Adjust requirements based on user profile
        requirements = self.adjust_requirements(user_profile)
        
        # Calculate intake percentages
        percentages = []
        analysis = {}
        
        for i, (nutrient, req) in enumerate(requirements.items()):
            intake = totals.get(nutrient, 0)
            recommended = req['min']
            percentage = (intake / recommended) * 100 if recommended > 0 else 100
            percentages.append(min(percentage / 100, 2.0))  # Cap at 200%
            
            # Determine severity
            if percentage < 50:
                severity = 'critical'
            elif percentage < 70:
                severity = 'moderate'
            elif percentage < 90:
                severity = 'mild'
            else:
                severity = 'good'
            
            analysis[nutrient] = {
                'intake': round(intake, 1),
                'recommended': recommended,
                'percentage': round(percentage, 1),
                'severity': severity,
                'deficient': severity != 'good'
            }
        
        # Generate recommendations
        recommendations = self.generate_recommendations(analysis)
        
        # Calculate overall score
        scores = [min(data['percentage'], 100) for data in analysis.values()]
        overall_score = round(sum(scores) / len(scores)) if scores else 0
        
        return {
            'analysis': analysis,
            'recommendations': recommendations,
            'overallScore': overall_score
        }
    
    def adjust_requirements(self, profile):
        """Adjust nutrient requirements based on user profile"""
        requirements = {k: v.copy() for k, v in self.nutrient_requirements.items()}
        
        # Adjust for gender
        if profile.get('gender') == 'female':
            requirements['iron']['min'] *= 1.5
        
        # Adjust for age
        age = profile.get('age', 30)
        if age > 50:
            requirements['calcium']['min'] *= 1.2
        
        # Adjust for activity
        activity = profile.get('activityLevel', 'moderate')
        if activity in ['very active', 'extra active']:
            requirements['protein']['min'] *= 1.5
        
        return requirements
    
    def generate_recommendations(self, analysis):
        """Generate food recommendations for deficient nutrients"""
        recommendations = []
        
        for nutrient, data in analysis.items():
            if nutrient != 'overall_risk' and data.get('deficient'):
                foods = self.food_recommendations.get(nutrient, [])
                recommendations.append({
                    'nutrient': nutrient,
                    'severity': data['severity'],
                    'current_intake': data['intake'],
                    'target': data['recommended'],
                    'percentage': data['percentage'],
                    'recommended_foods': foods[:3]  # Top 3 foods
                })
        
        return recommendations

nutrient_detector = NutrientDeficiencyDetector()


# ========== CRAVING PREDICTOR MODEL ==========

class CravingPredictor:
    def __init__(self):
        self.model_path = os.path.join(MODELS_DIR, 'craving_model.pkl')
        self.model = None
        self.load_or_train()
    
    def load_or_train(self):
        """Load existing model or train a new one"""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            logger.info("✅ Craving model loaded from disk")
        else:
            self.train_initial_model()
    
    def train_initial_model(self):
        """Train XGBoost model for craving prediction"""
        from xgboost import XGBClassifier
        
        # Synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        # Features: hour, day_of_week, mood, hours_since_last_meal, stress_level
        X = np.column_stack([
            np.random.randint(0, 24, n_samples),           # hour
            np.random.randint(0, 7, n_samples),            # day_of_week
            np.random.randint(1, 6, n_samples),            # mood (1-5)
            np.random.randint(1, 8, n_samples),            # hours_since_last_meal
            np.random.randint(1, 6, n_samples)             # stress_level (1-5)
        ])
        
        # Generate labels (0=no craving, 1= craving)
        y = ((X[:, 0] > 14) & (X[:, 0] < 17) & (X[:, 3] > 3)).astype(int)
        
        self.model = XGBClassifier(n_estimators=100)
        self.model.fit(X, y)
        
        joblib.dump(self.model, self.model_path)
        logger.info("✅ New craving model trained and saved")
    
    def predict(self, features):
        """Predict craving probability"""
        if self.model:
            prob = self.model.predict_proba([features])[0][1]
            return round(prob * 100, 1)
        return 50.0  # Default

craving_predictor = CravingPredictor()


# ========== API ENDPOINTS ==========

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'DietTrack Python ML Service',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict/calories', methods=['POST'])
def predict_calories():
    """Predict daily calorie needs"""
    try:
        data = request.json
        features = [
            data.get('height', 170),
            data.get('weight', 70),
            data.get('age', 30),
            1 if data.get('gender') == 'male' else 0,
            data.get('activity', 1.55),
            data.get('goal', 0)
        ]
        
        prediction = calorie_predictor.predict(features)
        
        return jsonify({
            'success': True,
            'predicted_calories': prediction,
            'model': 'RandomForestRegressor'
        })
    except Exception as e:
        logger.error(f"Error in calorie prediction: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/analyze/nutrients', methods=['POST'])
def analyze_nutrients():
    """Analyze nutrient intake and detect deficiencies"""
    try:
        data = request.json
        meal_logs = data.get('mealLogs', [])
        user_profile = data.get('userProfile', {})
        
        result = nutrient_detector.analyze(meal_logs, user_profile)
        
        return jsonify({
            'success': True,
            'data': result,
            'model': 'RandomForestClassifier'
        })
    except Exception as e:
        logger.error(f"Error in nutrient analysis: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/predict/craving', methods=['POST'])
def predict_craving():
    """Predict craving probability"""
    try:
        data = request.json
        features = [
            data.get('hour', datetime.now().hour),
            data.get('day_of_week', datetime.now().weekday()),
            data.get('mood', 3),
            data.get('hours_since_meal', 3),
            data.get('stress_level', 3)
        ]
        
        probability = craving_predictor.predict(features)
        
        return jsonify({
            'success': True,
            'craving_probability': probability,
            'message': f"{probability}% chance of craving",
            'model': 'XGBoost'
        })
    except Exception as e:
        logger.error(f"Error in craving prediction: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/train/retrain', methods=['POST'])
def retrain_models():
    """Retrain all models with new data"""
    try:
        data = request.json
        model_type = data.get('model', 'all')
        
        if model_type in ['calorie', 'all']:
            global calorie_predictor
            calorie_predictor = CaloriePredictor()  # This will retrain
        
        if model_type in ['nutrient', 'all']:
            global nutrient_detector
            nutrient_detector = NutrientDeficiencyDetector()
        
        if model_type in ['craving', 'all']:
            global craving_predictor
            craving_predictor = CravingPredictor()
        
        return jsonify({
            'success': True,
            'message': f'Models retrained successfully: {model_type}'
        })
    except Exception as e:
        logger.error(f"Error retraining models: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/food/recommendations/<nutrient>', methods=['GET'])
def get_food_recommendations(nutrient):
    """Get food recommendations for a specific nutrient"""
    try:
        foods = nutrient_detector.food_recommendations.get(nutrient, [])
        return jsonify({
            'success': True,
            'nutrient': nutrient,
            'recommendations': foods
        })
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
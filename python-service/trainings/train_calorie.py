import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def train_advanced_calorie_model():
    """Train an advanced calorie prediction model using real data from MongoDB"""
    from pymongo import MongoClient
    
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['dietTrack']
    
    # Get user profiles and their actual calorie logs
    users = db.users.find()
    features = []
    targets = []
    
    for user in users:
        # Get user profile
        profile = db.userprofiles.find_one({'userId': user['_id']})
        if not profile:
            continue
        
        # Get meal logs for this user
        logs = db.meallogs.find({'userId': user['_id']})
        
        # Calculate average daily calories
        daily_calories = {}
        for log in logs:
            date = log['date'].strftime('%Y-%m-%d')
            if date not in daily_calories:
                daily_calories[date] = 0
            daily_calories[date] += log.get('totalCalories', 0)
        
        if daily_calories:
            avg_calories = sum(daily_calories.values()) / len(daily_calories)
            
            # Extract features
            features.append([
                profile.get('height', 170),
                profile.get('weight', 70),
                profile.get('age', 30),
                1 if profile.get('gender') == 'male' else 0,
                profile.get('activityLevel', 1.55),
                1 if profile.get('goal') == 'weight gain' else -1 if profile.get('goal') == 'weight lose' else 0
            ])
            targets.append(avg_calories)
    
    if len(features) < 10:
        print("⚠️ Not enough real data. Using synthetic data...")
        # Generate synthetic data
        np.random.seed(42)
        n_samples = 1000
        features = np.column_stack([
            np.random.normal(170, 10, n_samples),
            np.random.normal(70, 15, n_samples),
            np.random.normal(30, 10, n_samples),
            np.random.choice([0, 1], n_samples),
            np.random.choice([1.2, 1.375, 1.55, 1.725, 1.9], n_samples),
            np.random.choice([-1, 0, 1], n_samples)
        ])
        
        # Calculate targets using Mifflin-St Jeor
        bmr = np.where(features[:, 3] == 1,
                      10*features[:, 1] + 6.25*features[:, 0] - 5*features[:, 2] + 5,
                      10*features[:, 1] + 6.25*features[:, 0] - 5*features[:, 2] - 161)
        
        targets = bmr * features[:, 4] * (1 + features[:, 5] * 0.1)
    
    # Train multiple models
    X_train, X_test, y_train, y_test = train_test_split(features, targets, test_size=0.2)
    
    models = {
        'RandomForest': RandomForestRegressor(n_estimators=200, max_depth=15),
        'GradientBoosting': GradientBoostingRegressor(n_estimators=150, learning_rate=0.1)
    }
    
    best_model = None
    best_score = -float('inf')
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"\n📊 {name} Model Performance:")
        print(f"   MAE: {mae:.2f} calories")
        print(f"   R² Score: {r2:.3f}")
        
        if r2 > best_score:
            best_score = r2
            best_model = model
            best_name = name
    
    # Save best model
    os.makedirs('models', exist_ok=True)
    joblib.dump(best_model, 'models/calorie_model.pkl')
    print(f"\n✅ Best model ({best_name}) saved with R²: {best_score:.3f}")
    
    return best_model

if __name__ == '__main__':
    train_advanced_calorie_model()
"""
Tripzy ML Service - Crowd Prediction Model Training
Generates synthetic dataset and trains a Random Forest classifier
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
import joblib
import json
import os
from datetime import datetime, timedelta
import random

# ─── Dataset Generation ───────────────────────────────────────────────────────

def generate_crowd_dataset(n_samples=5000):
    """Generate realistic crowd prediction training data"""
    np.random.seed(42)
    random.seed(42)

    location_types = {
        'tourist_spot': {'base_crowd': 0.7, 'weekend_boost': 0.2, 'holiday_boost': 0.25},
        'museum': {'base_crowd': 0.55, 'weekend_boost': 0.25, 'holiday_boost': 0.3},
        'market': {'base_crowd': 0.5, 'weekend_boost': 0.15, 'holiday_boost': 0.1},
        'restaurant': {'base_crowd': 0.4, 'weekend_boost': 0.3, 'holiday_boost': 0.2},
        'park': {'base_crowd': 0.3, 'weekend_boost': 0.35, 'holiday_boost': 0.2},
        'transport_hub': {'base_crowd': 0.6, 'weekend_boost': 0.1, 'holiday_boost': 0.25},
        'beach': {'base_crowd': 0.35, 'weekend_boost': 0.4, 'holiday_boost': 0.35},
        'shopping_mall': {'base_crowd': 0.5, 'weekend_boost': 0.3, 'holiday_boost': 0.35}
    }

    locations = ['Paris', 'Tokyo', 'New York', 'London', 'Rome', 'Barcelona',
                 'Bangkok', 'Singapore', 'Dubai', 'Sydney', 'Amsterdam', 'Istanbul']

    # Hour-of-day crowd multipliers
    hour_multipliers = {
        0: 0.05, 1: 0.03, 2: 0.02, 3: 0.02, 4: 0.05, 5: 0.10,
        6: 0.20, 7: 0.40, 8: 0.55, 9: 0.70, 10: 0.85, 11: 0.90,
        12: 0.95, 13: 1.00, 14: 0.95, 15: 0.90, 16: 0.85, 17: 0.90,
        18: 0.80, 19: 0.70, 20: 0.55, 21: 0.40, 22: 0.25, 23: 0.12
    }

    # Month seasonality
    month_multipliers = {
        1: 0.6, 2: 0.65, 3: 0.75, 4: 0.85, 5: 0.95, 6: 1.0,
        7: 1.0, 8: 0.98, 9: 0.88, 10: 0.80, 11: 0.70, 12: 0.90
    }

    data = []
    start_date = datetime(2022, 1, 1)

    for _ in range(n_samples):
        # Random datetime
        days_offset = random.randint(0, 730)
        dt = start_date + timedelta(days=days_offset, hours=random.randint(0, 23))

        loc_type = random.choice(list(location_types.keys()))
        location = random.choice(locations)
        loc_config = location_types[loc_type]

        # Compute crowd score (0-100)
        score = loc_config['base_crowd'] * 100

        # Time of day effect
        score *= hour_multipliers[dt.hour]

        # Day of week effect
        is_weekend = dt.weekday() >= 5
        is_friday = dt.weekday() == 4
        if is_weekend:
            score += loc_config['weekend_boost'] * 100
        elif is_friday and dt.hour >= 16:
            score += 10

        # Month / season effect
        score *= month_multipliers[dt.month]

        # Holiday effect (simplified)
        is_holiday = random.random() < 0.08
        if is_holiday:
            score += loc_config['holiday_boost'] * 100

        # Weather effect (rain reduces outdoor crowds)
        weather = random.choice(['clear', 'clouds', 'rain', 'snow', 'fog'])
        if weather in ['rain', 'snow'] and loc_type in ['park', 'beach', 'tourist_spot']:
            score *= 0.6
        elif weather == 'clear' and loc_type in ['park', 'beach']:
            score *= 1.2

        # Special events
        has_event = random.random() < 0.05
        if has_event:
            score += random.uniform(10, 30)

        # Add noise
        score += np.random.normal(0, 8)
        score = np.clip(score, 0, 100)

        # Label
        if score < 35:
            label = 'low'
        elif score < 65:
            label = 'medium'
        else:
            label = 'high'

        data.append({
            'hour': dt.hour,
            'day_of_week': dt.weekday(),
            'month': dt.month,
            'is_weekend': int(is_weekend),
            'is_holiday': int(is_holiday),
            'has_event': int(has_event),
            'location_type': loc_type,
            'location': location,
            'weather': weather,
            'temperature': random.uniform(0, 40),
            'humidity': random.uniform(20, 95),
            'crowd_score': round(score, 2),
            'crowd_level': label
        })

    df = pd.DataFrame(data)
    df.to_csv('data/crowd_dataset.csv', index=False)
    print(f"✅ Generated {n_samples} samples → data/crowd_dataset.csv")
    return df


# ─── Model Training ───────────────────────────────────────────────────────────

def train_model():
    """Train Random Forest crowd prediction model"""
    os.makedirs('data', exist_ok=True)
    os.makedirs('models', exist_ok=True)

    print("📊 Generating training dataset...")
    df = generate_crowd_dataset(5000)

    print(f"\nDataset info:")
    print(f"  Samples: {len(df)}")
    print(f"  Class distribution:\n{df['crowd_level'].value_counts()}")

    # Feature engineering
    features = ['hour', 'day_of_week', 'month', 'is_weekend', 'is_holiday',
                'has_event', 'temperature', 'humidity']

    # Encode categoricals
    le_location_type = LabelEncoder()
    le_weather = LabelEncoder()
    le_location = LabelEncoder()

    df['location_type_enc'] = le_location_type.fit_transform(df['location_type'])
    df['weather_enc'] = le_weather.fit_transform(df['weather'])
    df['location_enc'] = le_location.fit_transform(df['location'])

    features += ['location_type_enc', 'weather_enc', 'location_enc']

    X = df[features]
    y = df['crowd_level']

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Train model
    print("\n🤖 Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n📈 Model Performance:")
    print(f"  Accuracy: {accuracy:.3f} ({accuracy*100:.1f}%)")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Feature importance
    importances = dict(zip(features, model.feature_importances_))
    importances_sorted = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))
    print("\n🔑 Feature Importances (top 5):")
    for feat, imp in list(importances_sorted.items())[:5]:
        print(f"  {feat}: {imp:.3f}")

    # Save model and encoders
    joblib.dump(model, 'models/crowd_model.pkl')
    joblib.dump(le_location_type, 'models/le_location_type.pkl')
    joblib.dump(le_weather, 'models/le_weather.pkl')
    joblib.dump(le_location, 'models/le_location.pkl')

    # Save metadata
    metadata = {
        'accuracy': accuracy,
        'features': features,
        'location_types': list(le_location_type.classes_),
        'weather_types': list(le_weather.classes_),
        'locations': list(le_location.classes_),
        'trained_at': datetime.now().isoformat(),
        'model_type': 'RandomForestClassifier',
        'n_samples': len(df)
    }
    with open('models/metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"\n✅ Model saved to models/crowd_model.pkl")
    print(f"✅ Metadata saved to models/metadata.json")
    return model, metadata


if __name__ == '__main__':
    train_model()

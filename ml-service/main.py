"""
Tripzy ML Service - FastAPI Application
Crowd Level Prediction API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import joblib
import json
import numpy as np
import os
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tripzy ML Service",
    description="AI-powered crowd prediction for travel planning",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Model Loading ────────────────────────────────────────────────────────────

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
model = None
le_location_type = None
le_weather = None
le_location = None
metadata = {}

def load_models():
    """Load trained ML models"""
    global model, le_location_type, le_weather, le_location, metadata
    try:
        model = joblib.load(os.path.join(MODEL_DIR, 'crowd_model.pkl'))
        le_location_type = joblib.load(os.path.join(MODEL_DIR, 'le_location_type.pkl'))
        le_weather = joblib.load(os.path.join(MODEL_DIR, 'le_weather.pkl'))
        le_location = joblib.load(os.path.join(MODEL_DIR, 'le_location.pkl'))
        with open(os.path.join(MODEL_DIR, 'metadata.json')) as f:
            metadata = json.load(f)
        logger.info(f"✅ Models loaded. Accuracy: {metadata.get('accuracy', 'N/A'):.3f}")
        return True
    except FileNotFoundError:
        logger.warning("⚠️  Model files not found. Run train_model.py first. Using fallback prediction.")
        return False

# Load on startup
models_loaded = load_models()


# ─── Request/Response Schemas ─────────────────────────────────────────────────

class CrowdPredictionRequest(BaseModel):
    location: str = Field(..., example="Paris")
    datetime: Optional[str] = Field(None, example="2024-06-15T14:00:00")
    location_type: Optional[str] = Field("tourist_spot", example="tourist_spot")
    weather: Optional[str] = Field("clear", example="clear")
    temperature: Optional[float] = Field(22.0, example=22.0)
    humidity: Optional[float] = Field(65.0, example=65.0)
    is_holiday: Optional[bool] = Field(False)
    has_event: Optional[bool] = Field(False)

class CrowdPredictionResponse(BaseModel):
    level: str
    score: float
    confidence: float
    peak_hours: List[str]
    recommendation: str
    model_used: str

class BatchPredictionRequest(BaseModel):
    predictions: List[CrowdPredictionRequest]

# ─── Fallback Prediction ──────────────────────────────────────────────────────

def fallback_predict(location: str, dt: datetime, location_type: str) -> dict:
    """Rule-based fallback when ML model not available"""
    hour = dt.hour
    dow = dt.weekday()
    is_weekend = dow >= 5
    month = dt.month

    # Base score by location type
    base_scores = {
        'tourist_spot': 65, 'museum': 55, 'market': 50,
        'restaurant': 45, 'park': 35, 'beach': 40,
        'transport_hub': 60, 'shopping_mall': 55
    }
    score = base_scores.get(location_type, 50)

    # Hour adjustments
    if 10 <= hour <= 17:
        score += 20
    elif 7 <= hour <= 9 or 18 <= hour <= 20:
        score += 10
    elif hour < 7 or hour > 21:
        score -= 25

    # Weekend boost
    if is_weekend:
        score += 15

    # Peak season (Jun-Aug)
    if 6 <= month <= 8:
        score += 10

    score = max(0, min(100, score + np.random.randint(-5, 6)))

    level = 'high' if score >= 65 else ('medium' if score >= 35 else 'low')

    return {
        'level': level,
        'score': round(float(score), 1),
        'confidence': 0.65,
        'peak_hours': ['10:00', '12:00', '14:00', '16:00'] if is_weekend else ['12:00', '17:00'],
        'recommendation': _get_recommendation(level, hour),
        'model_used': 'fallback_rules'
    }

def _get_recommendation(level: str, hour: int) -> str:
    if level == 'high':
        if hour < 10:
            return "Currently peak hours. Visit early morning (before 10 AM) or after 6 PM for fewer crowds."
        return "High crowd density predicted. Consider an alternative attraction or visit after 7 PM."
    elif level == 'medium':
        return "Moderate crowds expected. Weekday mornings are generally less crowded."
    else:
        return "Low crowd density – great time to visit! Enjoy a more relaxed experience."


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": models_loaded,
        "model_accuracy": metadata.get('accuracy'),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model/info")
def model_info():
    """Get information about the trained model"""
    if not models_loaded:
        return {"status": "not_loaded", "message": "Run train_model.py to train the model"}
    return {
        "model_type": metadata.get('model_type'),
        "accuracy": metadata.get('accuracy'),
        "trained_at": metadata.get('trained_at'),
        "n_training_samples": metadata.get('n_samples'),
        "features": metadata.get('features'),
        "supported_location_types": metadata.get('location_types'),
        "supported_weather": metadata.get('weather_types')
    }

@app.post("/predict/crowd", response_model=CrowdPredictionResponse)
def predict_crowd(request: CrowdPredictionRequest):
    """
    Predict crowd level for a given location and time.
    
    Returns:
    - level: 'low', 'medium', or 'high'
    - score: 0-100 numerical crowd score
    - confidence: model confidence 0-1
    - peak_hours: list of peak crowd times
    - recommendation: human-readable advice
    """
    try:
        # Parse datetime
        if request.datetime:
            dt = datetime.fromisoformat(request.datetime.replace('Z', '+00:00'))
        else:
            dt = datetime.now()

        # Use ML model if available
        if models_loaded and model is not None:
            # Encode categorical features
            loc_type = request.location_type or 'tourist_spot'
            weather = request.weather or 'clear'
            location = request.location.title()

            # Handle unseen labels gracefully
            try:
                loc_type_enc = le_location_type.transform([loc_type])[0]
            except ValueError:
                loc_type_enc = 0  # Default

            try:
                weather_enc = le_weather.transform([weather])[0]
            except ValueError:
                weather_enc = 0

            try:
                location_enc = le_location.transform([location])[0]
            except ValueError:
                location_enc = 0

            features = np.array([[
                dt.hour,
                dt.weekday(),
                dt.month,
                int(dt.weekday() >= 5),
                int(request.is_holiday or False),
                int(request.has_event or False),
                request.temperature or 22.0,
                request.humidity or 65.0,
                loc_type_enc,
                weather_enc,
                location_enc
            ]])

            # Predict
            prediction = model.predict(features)[0]
            probabilities = model.predict_proba(features)[0]
            confidence = float(max(probabilities))

            # Get numerical crowd score from probabilities
            class_scores = {'low': 20, 'medium': 55, 'high': 85}
            classes = list(model.classes_)
            score = sum(class_scores.get(cls, 50) * prob
                       for cls, prob in zip(classes, probabilities))

            is_weekend = dt.weekday() >= 5
            peak_hours = ['10:00', '12:00', '14:00', '16:00'] if is_weekend else ['12:00', '17:00', '19:00']

            return CrowdPredictionResponse(
                level=prediction,
                score=round(score, 1),
                confidence=round(confidence, 3),
                peak_hours=peak_hours,
                recommendation=_get_recommendation(prediction, dt.hour),
                model_used='random_forest'
            )
        else:
            # Use fallback
            result = fallback_predict(request.location, dt, request.location_type or 'tourist_spot')
            return CrowdPredictionResponse(**result)

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/crowd/batch")
def predict_crowd_batch(request: BatchPredictionRequest):
    """Batch crowd predictions for multiple locations/times"""
    results = []
    for pred_req in request.predictions[:20]:  # Max 20 per batch
        try:
            result = predict_crowd(pred_req)
            results.append({'input': pred_req.model_dump(), 'prediction': result.model_dump()})
        except Exception as e:
            results.append({'input': pred_req.model_dump(), 'error': str(e)})
    return {'results': results, 'count': len(results)}


@app.get("/predict/crowd/hourly")
def predict_hourly(
    location: str = "Paris",
    date: Optional[str] = None,
    location_type: Optional[str] = "tourist_spot"
):
    """Get crowd predictions for all 24 hours of a day"""
    target_date = date or datetime.now().strftime('%Y-%m-%d')
    predictions = []

    for hour in range(24):
        dt_str = f"{target_date}T{hour:02d}:00:00"
        req = CrowdPredictionRequest(
            location=location,
            datetime=dt_str,
            location_type=location_type
        )
        pred = predict_crowd(req)
        predictions.append({
            'hour': hour,
            'time': f"{hour:02d}:00",
            'level': pred.level,
            'score': pred.score
        })

    return {
        'location': location,
        'date': target_date,
        'predictions': predictions,
        'best_hours': [p['time'] for p in predictions if p['level'] == 'low'][:4]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

from sqlalchemy.orm import Session
from app.models.debate import RawDebate
from app.services.sentiment_model import get_sentiment_pipeline
from datetime import datetime, timedelta

def forecast_sentiment_trend(db: Session, keyword: str, days_ahead: int = 30):
    """
    Predicts citizen sentiment trend for a specific topic over the next X days.
    """
    # Lazy imports to prevent startup blocking
    import pandas as pd
    import numpy as np
    from sklearn.linear_model import LinearRegression
    # 1. Fetch historical data
    debates = db.query(RawDebate).filter(RawDebate.text.ilike(f"%{keyword}%")).all()
    
    if len(debates) < 5:
        return {"error": "Not enough data points for prediction (need >5)"}

    # 2. Analyze historical sentiment
    data = []
    pipeline = get_sentiment_pipeline()
    
    for debate in debates:
        if not debate.text: continue
        
        # Simple analysis for trend (use score, ignore label for regression)
        # Note: We assume label 'POSITIVE' > 0.5, 'NEGATIVE' < 0.5 or similar.
        # But our new emotion model returns 'joy', 'anger'. 
        # We need a numeric proxy.
        # Let's trust the 'score' from the model BUT we need to sign it.
        # If label is 'joy', 'surprise' -> Positive (+1)
        # If label is 'anger', 'fear', 'disgust', 'sadness' -> Negative (-1)
        # If 'neutral' -> 0
        
        result = pipeline(debate.text[:512])[0]
        label = result['label']
        score = result['score']
        
        numeric_score = 0
        if label in ['joy', 'surprise', 'love']:
            numeric_score = score
        elif label in ['anger', 'fear', 'disgust', 'sadness']:
            numeric_score = -score
        
        data.append({
            "date": debate.date,
            "score": numeric_score
        })

    if not data:
        return {"error": "No valid sentiment data extracted"}

    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # 3. Prepare for Regression
    # Convert dates to ordinal for regression
    df['date_ordinal'] = df['date'].map(datetime.toordinal)
    
    X = df['date_ordinal'].values.reshape(-1, 1)
    y = df['score'].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    # 4. Forecast
    last_date = df['date'].max()
    future_dates = [last_date + timedelta(days=i) for i in range(1, days_ahead + 1)]
    future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)
    
    predictions = model.predict(future_ordinals)
    
    # Clip predictions to -1 to 1
    predictions = np.clip(predictions, -1, 1)
    
    forecast = []
    for date, pred in zip(future_dates, predictions):
        forecast.append({
            "date": date.strftime("%Y-%m-%d"),
            "predicted_score": round(pred, 2),
            "trend": "Positive" if pred > 0.1 else "Negative" if pred < -0.1 else "Neutral"
        })
        
    return {
        "topic": keyword,
        "historical_points": len(df),
        "forecast_days": days_ahead,
        "trend_direction": "Improving" if model.coef_[0] > 0 else "Declining",
        "forecast": forecast
    }

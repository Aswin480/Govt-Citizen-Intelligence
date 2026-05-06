# from bertopic import BERTopic (Lazy loaded instead)
from sqlalchemy.orm import Session
from app.models.debate import RawDebate
# import pandas as pd # Lazy loaded

def run_topic_modeling(db: Session):
    """
    Runs BERTopic on parliamentary speeches stored in DB.
    Returns discovered topics and their keywords.
    """
    import pandas as pd
    print("Fetching debates from DB...")
    
    # 1. Fetch speeches
    debates = db.query(RawDebate).all()
    
    # Extract just the text column (Corrected from 'speech_text' to 'text' as per simplified model)
    documents = [d.text for d in debates if d.text]

    if not documents:
        return {"error": "No debate data available. Please ingest data first."}

    if len(documents) < 5:
        # BERTopic needs distinct clusters. If we only have 2 sample speeches, 
        # we return a dummy response to prevent crashing during development.
        return {
            "status": "warning",
            "message": "Not enough data for full topic modeling (need >15 speeches).",
            "sample_topics": [
                {"topic_id": 0, "name": "0_healthcare_policy_rural", "count": 1},
                {"topic_id": 1, "name": "1_infrastructure_development", "count": 1}
            ]
        }

    print(f"Training BERTopic on {len(documents)} documents...")

    # 2. Initialize BERTopic
    # min_topic_size=2 ensures it works even with small datasets
    from bertopic import BERTopic
    topic_model = BERTopic(language="english", min_topic_size=2, verbose=True)

    # 3. Fit model
    topics, probs = topic_model.fit_transform(documents)

    # 4. Extract topic information
    topic_info = topic_model.get_topic_info()
    
    # Convert DataFrame to JSON-friendly list
    results = []
    for _, row in topic_info.iterrows():
        results.append({
            "topic_id": int(row["Topic"]),
            "count": int(row["Count"]),
            "name": row["Name"]
        })

    return {
        "total_documents": len(documents),
        "topics": results
    }

# 🔌 API Documentation

## Base URL
`http://localhost:8001`

## Endpoints

### 🩺 Health Check
- **GET** `/health`
- **Response**: `{"status": "ok", "version": "1.0.0"}`

### 📜 Schemes
- **POST** `/schemes/evaluate`
- **Body**:
  ```json
  {
    "scheme_id": 1,
    "user_profile": {
      "state": "Tamil Nadu",
      "occupation": "Farmer",
      "income": 50000
    }
  }
  ```
- **Response**: `{"status": "Eligible", "reason": "..."}`

### ⚖️ Policies
- **POST** `/policies/evaluate`
- **Body**: `{"policy_id": 1, "user_profile": {...}}`
- **Response**: `{"impact": "High", "summary": "..."}`

### 🎨 Posters
- **POST** `/posters/policy`
- **Params**: `title`, `description`
- **Response**: Returns a generated image URL.

### 🧠 Analytics
- **POST** `/sentiment/analyze`
- **Body**: `{"text": "Speech content..."}`
- **Response**: `{"sentiment": "Positive", "confidence": 0.98}`

---

## Error Codes
- **404**: Resource not found.
- **422**: Validation Error (Check your JSON body).
- **500**: Internal Server Error (Check logs).

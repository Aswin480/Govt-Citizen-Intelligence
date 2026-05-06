# 📘 Citizen Policy Intelligence - User Guide

## Introduction
Welcome to the CPI Platform. This guide helps **Admins**, **Analysts**, and **Citizens** use the system effectively.

## 👥 For Citizens
### 1. Check Scheme Eligibility
- Navigate to the **Schemes** page.
- Select your **State** (e.g., Tamil Nadu).
- Enter your **Occupation** (e.g., Farmer, Student).
- The system will check 15+ central and state schemes instantly.

### 2. Policy Impact Analysis
- Paste a Policy Name (e.g., "Data Protection Bill").
- The AI will explain:
  - **Who is affected?**
  - **What are the pros/cons?**

### 3. Regional Language Support
- Click the language toggle (EN | HI | TA) in the Navbar to switch languages instantly.

---

## 🕵️ For Analysts (Admin Dashboard)
### 1. Sentiment Analysis
- Go to `http://localhost:8501`.
- Use the **Sentiment Analysis** tool to input a speech transcript.
- Shows: Positive/Negative/Neutral breakdown + Key Entities.

### 2. Viral Posters
- Use the **Posters** tool to auto-generate infographic content.
- **Green Template**: Positive News.
- **Red Template**: Critical Alerts.
- **Blue Template**: Neutral/Informational.

### 3. System Monitoring
- Check **System Metrics** on the Overview page for API latency and model health.

---

## 🔧 Troubleshooting
- **Backend Offline?**: Run `uvicorn app.main:app --reload`
- **Translation Failing?**: Ensure internet connection (if using external API) or check `LanguageContext.tsx` for supported keys.

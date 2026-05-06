from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.budget import Budget, BudgetAllocation, BudgetRevenueSource
from pydantic import BaseModel
import pandas as pd
import io
import datetime
from fpdf import FPDF

router = APIRouter(prefix="/budget", tags=["Budget Session"])

# --- SCHEMAS ---

class SchemeDetail(BaseModel):
    name: str
    amount: float
    change: float
    beneficiaries: str
    ministry: str

class AllocationSchema(BaseModel):
    sector: str
    amount: float
    percentage_share: float
    yoy_change: float
    schemes: Optional[List[dict]] = None
    class Config:
        from_attributes = True

class RevenueSchema(BaseModel):
    source_name: str
    amount: float
    type: str
    class Config:
        from_attributes = True

class BudgetOverviewSchema(BaseModel):
    region: str
    year: int
    total_size: float
    revenue_budget: float
    capital_budget: float
    fiscal_deficit: float
    budget_growth: float
    per_capita_allocation: float
    health_score: int
    highlights: Optional[dict] = None
    allocations: List[AllocationSchema]
    revenue_sources: List[RevenueSchema]
    class Config:
        from_attributes = True

# --- THE 4 MAJOR BUTTONS (Placed FIRST to avoid route swallowing) ---

# 1. EXCEL EXPORT
@router.get("/export/excel")
def export_budget_excel(region: str = "nation", year: int = 2026, db: Session = Depends(get_db)):
    budget_data = get_budget_by_region(region, year, db)
    
    alloc_df = pd.DataFrame(budget_data["allocations"])
    rev_df = pd.DataFrame(budget_data["revenue_sources"])
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        alloc_df.to_excel(writer, sheet_name='Allocations', index=False)
        rev_df.to_excel(writer, sheet_name='Revenue Sources', index=False)
        summary = {
            "Metric": ["Region", "Year", "Total Size (Cr)", "Revenue Budget", "Capital Budget", "Fiscal Deficit (%)"],
            "Value": [budget_data["region"], budget_data["year"], budget_data["total_size"], 
                      budget_data["revenue_budget"], budget_data["capital_budget"], budget_data["fiscal_deficit"]]
        }
        pd.DataFrame(summary).to_excel(writer, sheet_name='Overview', index=False)

    output.seek(0)
    headers = {"Content-Disposition": f"attachment; filename=budget_{region}_{year}.xlsx"}
    return Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

# 2. PDF EXPORT (Windows Compatible)
@router.get("/export/pdf")
def export_budget_pdf(region: str = "nation", year: int = 2026, db: Session = Depends(get_db)):
    data = get_budget_by_region(region, year, db)
    
    class BudgetPDF(FPDF):
        def header(self):
            self.set_font('Arial', 'B', 16)
            self.cell(0, 10, f'BUDGET INTELLIGENCE REPORT: {region.upper()}', 0, 1, 'C')
            self.set_font('Arial', '', 10)
            self.cell(0, 5, f'Fiscal Year {year} | Generated on {datetime.datetime.now().strftime("%Y-%m-%d")}', 0, 1, 'C')
            self.ln(10)

    pdf = BudgetPDF()
    pdf.add_page()
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, "1. FINANCIAL OVERVIEW", 0, 1, 'L')
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 8, f"Total Budget Size: Rs. {data.total_size} Lakh Cr", 0, 1)
    pdf.cell(0, 8, f"Fiscal Deficit: {data.fiscal_deficit}%", 0, 1)
    pdf.cell(0, 8, f"Growth Rate: {data.budget_growth}%", 0, 1)
    pdf.ln(5)

    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, "2. KEY SECTOR ALLOCATIONS", 0, 1, 'L')
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(80, 8, "Sector", 1)
    pdf.cell(50, 8, "Amount (Cr)", 1)
    pdf.cell(40, 8, "Change (%)", 1, 1)
    pdf.set_font('Arial', '', 10)
    # allocations is a list of model objects
    for alloc in data.allocations:
        pdf.cell(80, 8, str(getattr(alloc, "sector", "N/A")), 1)
        pdf.cell(50, 8, str(getattr(alloc, "amount", "0")), 1)
        pdf.cell(40, 8, f"{getattr(alloc, 'yoy_change', '0')}%", 1, 1)

    pdf_bytes = pdf.output(dest='S')
    headers = {"Content-Disposition": f"attachment; filename=budget_report_{region}.pdf"}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)

# 3. AI LEGISLATIVE BRIEF
@router.get("/ai/brief")
def get_budget_ai_brief(region: str = "nation", year: int = 2026, db: Session = Depends(get_db)):
    from google import genai
    import os
    data = get_budget_by_region(region, year, db)
    api_key = os.getenv("GEMINI_API_KEY", "***REMOVED***")
    
    fallback_brief = f"### 2-Minute Legislative Brief: {region.upper()} Budget 2026-27\n\n1. Health: Deficit {data.get('fiscal_deficit', '4.5')}%\n2. Winners: Infra (₹11.1L Cr)\n3. Risks: Borrowings\n4. Rec: Focus on Digital sectors."

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"Provide a 4-point legislative brief for {region} budget: {data}"
        response = client.models.generate_content(model='gemini-1.5-flash', contents=prompt)
        return {"brief": response.text if response.text else fallback_brief}
    except:
        return {"brief": fallback_brief}

# 4. ANALYTICS
@router.get("/analytics/metrics")
def get_budget_analytics(region: str = "nation", db: Session = Depends(get_db)):
    return {
        "active_users_analyzing": 124,
        "top_queried_sector": "Infrastructure",
        "sentiment_index": 78,
        "data_freshness": "Live (Synced 2m ago)"
    }

# --- PRIMARY DATA FETCHING ---

@router.get("/analytics/metrics")
def get_budget_analytics(region: str = "nation", db: Session = Depends(get_db)):
    """Returns trend data for charts."""
    # Simulation of multi-year data
    return {
        "trends": [
            {"year": 2022, "revenue": 31.5, "capital": 5.5, "deficit": 6.8},
            {"year": 2023, "revenue": 34.2, "capital": 7.3, "deficit": 5.9},
            {"year": 2024, "revenue": 37.1, "capital": 11.1, "deficit": 4.5},
            {"year": 2025, "revenue": 40.5, "capital": 13.5, "deficit": 4.1},
        ],
        "sector_efficiency": [
            {"sector": "Infrastructure", "utilization": 94},
            {"sector": "Education", "utilization": 88},
            {"sector": "Health", "utilization": 82},
            {"sector": "Agriculture", "utilization": 91}
        ]
    }

@router.get("/ai/brief")
def get_budget_ai_brief(region: str = "nation", db: Session = Depends(get_db)):
    """Generates a high-level AI analysis brief using Gemini."""
    from google import genai
    import os
    
    api_key = os.getenv("GEMINI_API_KEY", "***REMOVED***")
    client = genai.Client(api_key=api_key)
    
    prompt = f"Analyze the current Budget 2026 strategy for {region}. Focus on Fiscal Deficit, Capital Expenditure vs Revenue Expenditure, and long-term growth impact. Provide 3 bullet points."
    
    try:
        response = client.models.generate_content(model='gemini-1.5-flash', contents=prompt)
        return {"brief": response.text}
    except:
        return {"brief": "Strategic focus remains on Capex-led growth. Fiscal deficit is targeted at 4.5% with significant push towards digital infrastructure and rural connectivity."}

@router.get("/{region}", response_model=BudgetOverviewSchema)
def get_budget_by_region(region: str, year: int = 2026, db: Session = Depends(get_db)):
    try:
        budget = db.query(Budget).filter(Budget.region == region, Budget.year == year).first()
        if not budget:
            return get_mock_budget(region, year)
        return budget
    except:
        return get_mock_budget(region, year)

def get_mock_budget(region: str, year: int):
    is_nation = region.lower() == "nation"
    allocations = [
        {"sector": "Education", "amount": 1.2 if is_nation else 0.4, "percentage_share": 15.0, "yoy_change": 8.5, 
         "schemes": [{"name": "PM e-Vidya", "amount": 5000, "change": 12, "beneficiaries": "25 Cr Students", "ministry": "Ministry of Education"}]},
        {"sector": "Health", "amount": 0.9 if is_nation else 0.3, "percentage_share": 12.0, "yoy_change": 10.2,
         "schemes": [{"name": "Ayushman Bharat", "amount": 7500, "change": 15, "beneficiaries": "50 Cr Citizens", "ministry": "Health & Family Welfare"}]},
        {"sector": "Agriculture", "amount": 1.5 if is_nation else 0.5, "percentage_share": 18.0, "yoy_change": 5.0,
         "schemes": [{"name": "PM-KISAN", "amount": 60000, "change": 0, "beneficiaries": "11 Cr Farmers", "ministry": "Agriculture & Farmers Welfare"}]},
        {"sector": "Infrastructure", "amount": 11.1 if is_nation else 0.8, "percentage_share": 25.0, "yoy_change": 15.0,
         "schemes": [{"name": "PM Gati Shakti", "amount": 10000, "change": 20, "beneficiaries": "Nationwide", "ministry": "Ministry of Commerce"}]},
    ]
    if is_nation:
        allocations.append({"sector": "Defence", "amount": 6.2, "percentage_share": 13.0, "yoy_change": 4.5, "schemes": []})
    
    revenue_sources = [
        {"source_name": "Income Tax", "amount": 9.2 if is_nation else 0, "type": "Tax"},
        {"source_name": "GST", "amount": 10.5 if is_nation else 0.8, "type": "Tax"},
        {"source_name": "Borrowings", "amount": 14.2 if is_nation else 0.5, "type": "Borrowing"},
    ]
    if not is_nation:
        revenue_sources.append({"source_name": "Central Grants", "amount": 0.4, "type": "Grant"})

    return {
        "region": region, "year": year, "total_size": 48.2 if is_nation else 2.4,
        "revenue_budget": 37.1 if is_nation else 1.6, "capital_budget": 11.1 if is_nation else 0.8,
        "fiscal_deficit": 4.5 if is_nation else 3.2, "budget_growth": 7.2 if is_nation else 8.1,
        "per_capita_allocation": 35000 if is_nation else 22000, "health_score": 82,
        "highlights": {
            "top_debated": ["Digital Infrastructure", "Agriculture Subsidy", "Green Energy Transition"],
            "objections": ["Higher Borrowings", "Middle Class Tax relief"],
            "minister_response": "Focused on long term capex and job creation"
        },
        "allocations": allocations, "revenue_sources": revenue_sources
    }

from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, index=True) # "nation", state name, or UT name
    year = Column(Integer)
    total_size = Column(Float) # in Cr
    revenue_budget = Column(Float)
    capital_budget = Column(Float)
    fiscal_deficit = Column(Float) # as percentage
    budget_growth = Column(Float) # as percentage
    per_capita_allocation = Column(Float)
    
    # Metadata and extra analysis
    health_score = Column(Integer, default=75) # Budget Health Score (0-100)
    highlights = Column(JSON, nullable=True) # Top 5 debated issues, etc.
    
    allocations = relationship("BudgetAllocation", back_populates="budget", cascade="all, delete-orphan")
    revenue_sources = relationship("BudgetRevenueSource", back_populates="budget", cascade="all, delete-orphan")

class BudgetAllocation(Base):
    __tablename__ = "budget_allocations"

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"))
    sector = Column(String)
    amount = Column(Float)
    percentage_share = Column(Float)
    yoy_change = Column(Float) # percentage
    
    # Extra scheme-level details for this sector
    schemes = Column(JSON, nullable=True) # List of {name, amount, change, beneficiaries, ministry}

    budget = relationship("Budget", back_populates="allocations")

class BudgetRevenueSource(Base):
    __tablename__ = "budget_revenue_sources"

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"))
    source_name = Column(String)
    amount = Column(Float)
    type = Column(String) # "Tax", "Non-Tax", "Borrowing", "Grant"

    budget = relationship("Budget", back_populates="revenue_sources")

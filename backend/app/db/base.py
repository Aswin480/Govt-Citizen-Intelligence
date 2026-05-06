from sqlalchemy.orm import declarative_base

Base = declarative_base()
# Models should be imported in main.py, NOT here, to avoid circular imports.
# from app.models.scheme import Scheme 
# (Commented out because importing model here which imports Base causes Circular Import: Base -> Scheme -> Base)
# instead I will make sure main.py has it from app.models import scheme

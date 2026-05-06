import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine
from app.db.base import Base
from app.models import user, debate, policy, scheme, party, speaker, system, citizen, element_style, style_change_log, dynamic_component, budget, news, state

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Done.")

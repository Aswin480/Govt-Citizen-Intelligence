"""
Migration: Add Dynamic Components Table
"""
import sqlite3
import os

# Get database path
db_path = os.path.join(os.path.dirname(__file__), "..", "..", "government.db")

create_table_sql = """
CREATE TABLE IF NOT EXISTS dynamic_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR,
    content TEXT,
    props JSON,
    style JSON,
    parent_id VARCHAR,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR
);
"""

indexes = [
    "CREATE INDEX IF NOT EXISTS idx_component_type ON dynamic_components(type);",
    "CREATE INDEX IF NOT EXISTS idx_component_parent ON dynamic_components(parent_id);"
]

def run_migrations():
    print("🚀 Starting Dynamic Components migration...\n")
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create table
        cursor.execute(create_table_sql)
        print("✓ Created table: dynamic_components")
        
        # Create indexes
        for idx in indexes:
            cursor.execute(idx)
            print("✓ Created index")
            
        conn.commit()
        print("\n✅ Migration complete!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        
    conn.close()

if __name__ == "__main__":
    run_migrations()

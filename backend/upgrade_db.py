import sqlite3

def upgrade_db():
    print("Checking database schema...")
    conn = sqlite3.connect("citizen_policy.db")
    cursor = conn.cursor()
    
    try:
        # Check if 'affected_states' exists in 'policies' table
        cursor.execute("SELECT affected_states FROM policies LIMIT 1")
    except sqlite3.OperationalError:
        print("Column 'affected_states' missing. Adding it...")
        try:
            cursor.execute("ALTER TABLE policies ADD COLUMN affected_states TEXT")
            print("Added 'affected_states'.")
        except Exception as e:
            print(f"Error adding affected_states: {e}")

    try:
        # Check if 'target_groups' exists
        cursor.execute("SELECT target_groups FROM policies LIMIT 1")
    except sqlite3.OperationalError:
        print("Column 'target_groups' missing. Adding it...")
        try:
            cursor.execute("ALTER TABLE policies ADD COLUMN target_groups TEXT")
            print("Added 'target_groups'.")
        except Exception as e:
            print(f"Error adding target_groups: {e}")
            
    conn.commit()
    conn.close()
    print("Database schema check complete.")

if __name__ == "__main__":
    upgrade_db()

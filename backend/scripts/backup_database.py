"""
Automated Database Backup Script
Creates daily backups with 7-day retention
"""
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).resolve().parent
# If script is in backend/scripts/backup_database.py
# Parent = backend/scripts
# Parent.Parent = backend
# Configuration
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_BACKEND = SCRIPT_DIR.parent 

# Absolute paths
BACKUP_DIR = PROJECT_BACKEND / "backups"
DATABASE_FILE = PROJECT_BACKEND / "citizen_policy.db"
RETENTION_DAYS = 7

def backup_database():
    """Create database backup with timestamp"""
    # Create backup directory if it doesn't exist
    BACKUP_DIR.mkdir(exist_ok=True)
    
    # Check if database exists
    if not DATABASE_FILE.exists():
        print(f"❌ Database not found: {DATABASE_FILE}")
        return False
    
    # Create backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"government_backup_{timestamp}.db"
    
    try:
        # Copy database file
        shutil.copy2(DATABASE_FILE, backup_file)
        file_size = backup_file.stat().st_size / (1024 * 1024)  # Size in MB
        print(f"✓ Backup created: {backup_file.name} ({file_size:.2f} MB)")
        return True
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False

def cleanup_old_backups():
    """Remove backups older than RETENTION_DAYS"""
    if not BACKUP_DIR.exists():
        return
    
    cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
    deleted_count = 0
    
    for backup_file in BACKUP_DIR.glob("government_backup_*.db"):
        try:
            file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
            if file_time < cutoff_date:
                backup_file.unlink()
                print(f"✓ Deleted old backup: {backup_file.name}")
                deleted_count += 1
        except Exception as e:
            print(f"✗ Error deleting {backup_file.name}: {e}")
    
    if deleted_count > 0:
        print(f"\n📦 Cleaned up {deleted_count} old backup(s)")

def list_backups():
    """List all available backups"""
    if not BACKUP_DIR.exists():
        print("No backups directory found")
        return
    
    backups = sorted(BACKUP_DIR.glob("government_backup_*.db"), reverse=True)
    
    if not backups:
        print("No backups found")
        return
    
    print(f"\n📋 Available backups ({len(backups)}):")
    print("=" * 70)
    
    for backup in backups:
        file_time = datetime.fromtimestamp(backup.stat().st_mtime)
        file_size = backup.stat().st_size / (1024 * 1024)  # MB
        age_days = (datetime.now() - file_time).days
        
        print(f"  {backup.name}")
        print(f"    Created: {file_time.strftime('%Y-%m-%d %H:%M:%S')} ({age_days} days ago)")
        print(f"    Size: {file_size:.2f} MB")
        print()

def restore_backup(backup_name: str):
    """Restore database from backup"""
    backup_file = BACKUP_DIR / backup_name
    
    if not backup_file.exists():
        print(f"❌ Backup not found: {backup_name}")
        return False
    
    try:
        # Create a backup of current database before restoring
        if DATABASE_FILE.exists():
            current_backup = DATABASE_FILE.parent / f"{DATABASE_FILE.stem}_before_restore.db"
            shutil.copy2(DATABASE_FILE, current_backup)
            print(f"✓ Current database backed up to: {current_backup.name}")
        
        # Restore from backup
        shutil.copy2(backup_file, DATABASE_FILE)
        print(f"✓ Database restored from: {backup_name}")
        return True
    except Exception as e:
        print(f"❌ Restore failed: {e}")
        return False

def main():
    """Main backup routine"""
    print("=" * 70)
    print("🔄 Database Backup System")
    print("=" * 70)
    print()
    
    # Create backup
    if backup_database():
        # Clean up old backups
        cleanup_old_backups()
        
        # List current backups
        list_backups()
        
        print("=" * 70)
        print("✅ Backup completed successfully!")
        print("=" * 70)
    else:
        print("=" * 70)
        print("❌ Backup failed!")
        print("=" * 70)

if __name__ == "__main__":
    main()

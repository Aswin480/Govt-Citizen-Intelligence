import sys
import os
import json
import argparse

# Add project root to path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ocr import OCRService
from app.services.extraction import ExtractionService

def main():
    parser = argparse.ArgumentParser(description="AI Document Intelligence Engine - CLI")
    parser.add_argument("--file", type=str, required=True, help="Path to PDF or Text file")
    parser.add_argument("--schema", type=str, help="Path to JSON schema definition (optional)")
    args = parser.parse_args()

    # 1. Setup Input
    file_path = args.file
    if not os.path.exists(file_path):
        print(f"[Error] File not found: {file_path}")
        return

    # Define the schema (Admin's rules)
    extraction_schema = {
        "full_name": "The full name of the person",
        "id_number": "The unique ID number",
        "email": "Email address if present",
        "phone": "Phone number if present",
        "issue_date": "Date of issue",
        "summary": "Brief summary of the document content"
    }

    if args.schema and os.path.exists(args.schema):
        with open(args.schema, 'r') as f:
            extraction_schema = json.load(f)

    print("\n--- AI Document Intelligence Engine (CLI Mode) ---")
    print(f"Target File: {file_path}")
    print("--------------------------------------------------")

    # 2. Initialize Services
    try:
        # Initialize OCR only if needed (for PDFs)
        ocr_service = OCRService(use_gpu=False) 
        extractor_service = ExtractionService(model_name="llama3") 
    except Exception as e:
        print(f"Initialization Error: {e}")
        return

    # 3. Run Pipeline
    try:
        raw_text = ""
        
        # Check file type
        if file_path.lower().endswith('.pdf'):
            print("\n[Step 1] Detected PDF. Running OCR (The Eyes)...")
            raw_text = ocr_service.process_pdf(file_path)
        elif file_path.lower().endswith('.txt'):
            print("\n[Step 1] Detected Text File. Reading content directly...")
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_text = f.read()
        else:
            print("[Error] Unsupported file format. Please provide .pdf or .txt")
            return

        print(f"Content Loaded ({len(raw_text)} chars).")
        # print(f"Preview: {raw_text[:200]}...")

        print("\n[Step 2] Running Extraction (The Brain)...")
        data = extractor_service.extract_data(raw_text, extraction_schema)
        
        print("\n[Step 3] Final Extracted Data:")
        print(json.dumps(data, indent=2))
        
        print("\n[Success] Extraction complete.")

    except Exception as e:
        print(f"\n[Error] Pipeline failed: {e}")

if __name__ == "__main__":
    main()

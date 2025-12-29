from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File
import tempfile
import shutil
import json

from extract import extract_from_pdf
from parser import extract_structured_fields
from id_parser import extract_id_fields

app = FastAPI()


@app.post("/extract-license")
async def extract_license(file: UploadFile = File(...)):
    print("\n" + "="*60)
    print("[ML Service] 📜 LICENSE EXTRACTION REQUEST")
    print("="*60)
    print(f"[ML Service] 📄 File: {file.filename}, Size: {file.size} bytes")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            pdf_path = tmp.name
        print(f"[ML Service] 💾 Saved to: {pdf_path}")

        # OCR
        print("[ML Service] 🔍 Running OCR extraction...")
        ocr_result = extract_from_pdf(pdf_path)
        print(f"[ML Service] ✅ OCR completed. Text length: {len(ocr_result.get('raw_ocr_text', ''))} chars")

        # STRUCTURED EXTRACTION (NO LLM)
        print("[ML Service] 🧮 Extracting structured fields...")
        structured = extract_structured_fields(ocr_result["raw_ocr_text"])

        print("\n[ML Service] 📊 EXTRACTED LICENSE DATA:")
        print("-" * 60)
        print(json.dumps(structured, indent=2, ensure_ascii=False))
        print("-" * 60)
        
        result = {
            "success": True,
            "method": "GOOGLE_VISION_OCR + REGEX",
            "structured_certificate": structured
        }
        
        print(f"[ML Service] ✅ License extraction SUCCESS")
        print("="*60 + "\n")
        
        return result

    except Exception as e:
        print(f"\n[ML Service] ❌ ERROR: {str(e)}")
        print("="*60 + "\n")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/extract-id-license")
async def extract_id(file: UploadFile = File(...)):
    print("\n" + "="*60)
    print("[ML Service] 🆔 ID EXTRACTION REQUEST")
    print("="*60)
    print(f"[ML Service] 📄 File: {file.filename}, Size: {file.size} bytes")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            pdf_path = tmp.name
        print(f"[ML Service] 💾 Saved to: {pdf_path}")

        # OCR
        print("[ML Service] 🔍 Running OCR extraction...")
        ocr_result = extract_from_pdf(pdf_path)
        print(f"[ML Service] ✅ OCR completed. Text length: {len(ocr_result.get('raw_ocr_text', ''))} chars")

        # STRUCTURED ID EXTRACTION
        print("[ML Service] 🧮 Extracting ID fields...")
        structured = extract_id_fields(ocr_result["raw_ocr_text"])
        
        print("\n[ML Service] 📊 EXTRACTED ID DATA:")
        print("-" * 60)
        print(json.dumps(structured, indent=2, ensure_ascii=False))
        print("-" * 60)
        
        result = {
            "success": True,
            "method": "GOOGLE_VISION_OCR + ID_REGEX",
            "structured_id": structured
        }
        
        print(f"[ML Service] ✅ ID extraction SUCCESS")
        print("="*60 + "\n")
        
        return result

    except Exception as e:
        print(f"\n[ML Service] ❌ ERROR: {str(e)}")
        print("="*60 + "\n")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/health")
def health():
    return {"status": "ok"}       
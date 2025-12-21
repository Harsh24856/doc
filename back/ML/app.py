from fastapi import FastAPI, UploadFile, File
import tempfile
import shutil

from extract import extract_from_pdf
from parser import extract_structured_fields

app = FastAPI()


@app.post("/extract-license")
async def extract_license(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            pdf_path = tmp.name

        # OCR
        ocr_result = extract_from_pdf(pdf_path)

        # STRUCTURED EXTRACTION (NO LLM)
        structured = extract_structured_fields(ocr_result["raw_ocr_text"])

        return {
            "success": True,
            "method": "GOOGLE_VISION_OCR + REGEX",
            "structured_certificate": structured
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
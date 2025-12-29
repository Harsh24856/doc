import io
import os
import json
from google.cloud import vision
from google.oauth2 import service_account
from pdf2image import convert_from_path

# --- Load Google Vision credentials from env ---
if "GOOGLE_VISION_KEY" not in os.environ:
    raise RuntimeError("GOOGLE_VISION_KEY environment variable is missing")

credentials_info = json.loads(os.environ["GOOGLE_VISION_KEY"])

credentials = service_account.Credentials.from_service_account_info(
    credentials_info,
    scopes=["https://www.googleapis.com/auth/cloud-platform"],
)

client = vision.ImageAnnotatorClient(credentials=credentials)


def extract_from_pdf(pdf_path: str):
    """
    Extract full OCR text + blocks from PDF using Google Vision
    """

    # 1. Convert PDF → Image
    images = convert_from_path(pdf_path, dpi=300)
    image = images[0]

    # 2. Encode image as PNG bytes
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    content = buf.getvalue()

    vision_image = vision.Image(content=content)

    # 3. DOCUMENT OCR (best for certificates)
    response = client.document_text_detection(image=vision_image)

    if not response.full_text_annotation:
        raise RuntimeError("No text detected by Google Vision")

    full_text = response.full_text_annotation.text

    blocks = []
    for page in response.full_text_annotation.pages:
        for block in page.blocks:
            words = []
            for paragraph in block.paragraphs:
                for word in paragraph.words:
                    word_text = "".join(s.text for s in word.symbols)
                    words.append(word_text)
            blocks.append(" ".join(words))

    return {
        "raw_ocr_text": full_text,
        "blocks": blocks,
        "method": "GOOGLE_VISION_OCR",
        "success": True
    }

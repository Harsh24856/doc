import re

def clean(text):
    return re.sub(r"\s+", " ", text).strip() if text else None


def extract_id_fields(raw_text: str):
    """
    Extracts DOB, Gender, ID Number & Type.
    Name is NOT extracted from OCR.
    Name must be taken from user.name (DB / form).
    """

    result = {
        "dob": None,
        "gender": None,
        "id_number": None,
        "id_type": None
    }

    text = raw_text.upper()

    lines = [clean(l) for l in text.splitlines() if l.strip()]

    # -------------------------
    # GENDER
    # -------------------------
    for l in lines:
        if l in ("MALE", "FEMALE", "TRANSGENDER"):
            result["gender"] = l.title()
            break

    # -------------------------
    # DOB (multiple formats)
    # -------------------------
    dob_patterns = [
        r"\b\d{2}[/-]\d{2}[/-]\d{4}\b",   # DD/MM/YYYY
        r"\b\d{4}[/-]\d{2}[/-]\d{2}\b"    # YYYY-MM-DD
    ]

    for p in dob_patterns:
        m = re.search(p, text)
        if m:
            result["dob"] = m.group(0)
            break

    # -------------------------
    # AADHAAR (masked or full)
    # -------------------------
    aadhaar_masked = re.search(r"X{4,8}\d{4}", text)
    aadhaar_full = re.search(r"\b\d{4}\s?\d{4}\s?\d{4}\b", text)

    if aadhaar_masked:
        result["id_number"] = aadhaar_masked.group(0)
        result["id_type"] = "AADHAAR"
    elif aadhaar_full:
        result["id_number"] = aadhaar_full.group(0)
        result["id_type"] = "AADHAAR"

    # -------------------------
    # PAN
    # -------------------------
    pan_match = re.search(r"\b[A-Z]{5}\d{4}[A-Z]\b", text)
    if pan_match:
        result["id_number"] = pan_match.group(0)
        result["id_type"] = "PAN"

    # -------------------------
    # PASSPORT
    # -------------------------
    passport_match = re.search(r"\b[A-Z]\d{7}\b", text)
    if passport_match:
        result["id_number"] = passport_match.group(0)
        result["id_type"] = "PASSPORT"

    return result
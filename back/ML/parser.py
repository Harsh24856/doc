import re

def clean(text):
    return re.sub(r"\s+", " ", text).strip() if text else None


def extract_structured_fields(raw_text: str):
    result = {
        "name": None,
        "registration_number": None,
        "registration_council": None,
        "primary_qualification": None,
        "additional_qualification": None
    }

    # NAME (FIXED)
    name_match = re.search(
        r"Name\s*\n\s*([A-Z ]+)\n",
        raw_text
    )

    # REGISTRATION NUMBER
    reg_match = re.search(
        r"\n(\d{4,6})\n\s*\(\d{2}\.\d{2}\.\d{4}\)",
        raw_text
    )

    # MEDICAL COUNCIL
    council_match = re.search(
        r"\(\s*([A-Za-z ]+Medical Council)\s*\)",
        raw_text
    )

    # PRIMARY QUALIFICATION
    mbbs_match = re.search(
        r"MBBS.*?\(\d{4}\)",
        raw_text,
        re.IGNORECASE | re.DOTALL
    )

    # ADDITIONAL QUALIFICATION
    additional_match = re.search(
        r"(MS|MD|DM)\s*\(.*?\).*?\d{4}",
        raw_text,
        re.IGNORECASE | re.DOTALL
    )

    if name_match:
        result["name"] = clean(name_match.group(1)).title()

    if reg_match:
        result["registration_number"] = reg_match.group(1)

    if council_match:
        result["registration_council"] = clean(council_match.group(1))

    if mbbs_match:
        result["primary_qualification"] = clean(mbbs_match.group(0))

    if additional_match:
        result["additional_qualification"] = clean(additional_match.group(0))

    return result
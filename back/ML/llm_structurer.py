import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

PROMPT = """
You are verifying a medical certificate.

Extract ONLY the following fields:
- name
- registration_number
- registration_council
- primary_qualification
- additional_qualification

Rules:
- Use ONLY the text provided
- DO NOT guess or invent values
- If a field is not clearly present, return null
- Return STRICT JSON only
- No explanations

Text:
<<<RAW_OCR_TEXT>>>
"""


def structure_ocr_text(raw_text: str):
    prompt = PROMPT.replace("<<<RAW_OCR_TEXT>>>", raw_text)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    return json.loads(response.choices[0].message.content)
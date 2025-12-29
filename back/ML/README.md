# ML Service - DocSpace

Python FastAPI service for OCR extraction from medical license PDFs using Google Cloud Vision API.

## 🚀 Quick Start

### Prerequisites

**System Dependencies:**
```bash
# macOS (Homebrew)
brew install poppler

# Ubuntu/Debian
sudo apt-get install poppler-utils

# Fedora
sudo dnf install poppler-utils
```

**Python:**
- Python 3.11+
- pip

**Google Cloud:**
- Google Cloud Project with Vision API enabled
- Service account credentials JSON file

### Installation

```bash
# Navigate to ML directory
cd back/ML

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Google Vision Setup

1. **Get credentials:**
   - Go to Google Cloud Console
   - Create a service account
   - Download JSON key file
   - Enable Vision API for the project

2. **Place credentials:**
   ```bash
   # Copy your service account JSON to:
   back/ML/.env
   GOOGLE_VISION_KEY=
   ```

3. **Optional - Set environment variable:**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/google-vision-key.json"
   ```

   **Note:** The code automatically looks for `google-vision-key.json` in the current directory if the environment variable is not set.

### Run Server

```bash
# Activate virtual environment (if using)
source venv/bin/activate

# Start FastAPI server
uvicorn app:app --host 0.0.0.0 --port 8001 --reload

# Server will be available at http://localhost:8001
```

## 📁 Project Structure

```
ML/
├── app.py                    # FastAPI application
├── extract.py               # Google Vision OCR extraction
├── parser.py                # Text parsing and field extraction
├── llm_structurer.py        # LLM-based structuring (optional)
├── requirements.txt         # Python dependencies
├── google-vision-key.json   # Google credentials (not in git)
└── README.md
```

## 🔌 API Endpoints

### Extract License
```
POST /extract-license
Content-Type: multipart/form-data

Body:
  file: PDF file

Response:
{
  "success": true,
  "method": "GOOGLE_VISION_OCR + REGEX",
  "structured_certificate": {
    "name": "...",
    "registration_number": "...",
    "registration_council": "...",
    "primary_qualification": "...",
    "additional_qualification": "..."
  }
}
```

## 🔧 How It Works

1. **PDF to Image**: Converts PDF pages to images using `pdf2image`
2. **OCR Extraction**: Uses Google Cloud Vision API for text extraction
3. **Text Parsing**: Extracts structured fields using regex patterns
4. **Response**: Returns structured JSON with extracted data

## 🐛 Troubleshooting

### Poppler not found
```bash
# Verify installation
which pdftoppm  # Should return path

# Reinstall if needed
brew install poppler  # macOS
sudo apt-get install poppler-utils  # Ubuntu
```

### Google Vision API errors
- Verify `google-vision-key.json` exists and is valid
- Check Vision API is enabled in Google Cloud Console
- Verify service account has Vision API permissions
- Check API quotas and billing

### Import errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Port already in use
```bash
# Change port
uvicorn app:app --port 8002

# Or kill process
lsof -ti:8001 | xargs kill
```

## 📦 Dependencies

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `google-cloud-vision` - Google Vision API client
- `pdf2image` - PDF to image conversion
- `pillow` - Image processing
- `python-multipart` - Form data handling

## 🧪 Testing

```bash
# Test extraction (if test file exists)
python test_extraction.py
```

## 🚀 Production

```bash
# Run with production settings
uvicorn app:app --host 0.0.0.0 --port 8001 --workers 4
```

## 📝 Notes

- Automatically loads credentials from `google-vision-key.json` if present
- Falls back to `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Uses Google Vision Document Text Detection for better accuracy
- Processes first page of PDF only (can be extended)

## 🔐 Security

- **Never commit** `google-vision-key.json` to git
- Use environment variables in production
- Rotate service account keys regularly
- Restrict service account permissions to minimum required

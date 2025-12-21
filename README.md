# DocSpace 🚀

A comprehensive medical license verification platform with OCR extraction, registry verification, and admin dashboard.

## 🏗️ Architecture

```
DocSpace/
├── front/              # React + Vite Frontend
├── back/
│   ├── server/         # Node.js + Express Backend API
│   ├── ML/             # Python FastAPI OCR Service (Google Vision)
│   └── playwright-service/  # Node.js Playwright Service (NMC Registry)
└── docker-compose.yml  # Multi-service orchestration
```

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker Desktop installed and running
- Git

### Setup

1. **Clone the repository**
```bash
git clone <REPO_URL>
cd DocSpace
```

2. **Set up environment variables**
```bash
# Backend server
cp back/server/.env.example back/server/.env
# Edit back/server/.env with your Supabase credentials

# ML service - Place your Google Vision credentials
# Copy google-vision-key.json to back/ML/google-vision-key.json
```

3. **Start all services**
```bash
docker-compose up --build
```

4. **Access services**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- ML Service: http://localhost:8001
- Playwright Service: http://localhost:9000

## 📖 Local Development Setup

For local development without Docker, see individual service READMEs:
- [Frontend README](front/README.md)
- [Backend Server README](back/server/README.md)
- [ML Service README](back/ML/README.md)
- [Playwright Service README](back/playwright-service/README.md)

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS

### Backend
- Node.js + Express
- Supabase (Database & Storage)
- JWT Authentication
- bcrypt

### ML Service
- Python 3.11
- FastAPI
- Google Cloud Vision API
- pdf2image (Poppler)

### Playwright Service
- Node.js
- Playwright
- Express

## 📁 Project Structure

```
DocSpace/
├── front/                      # React frontend
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   └── config/            # API configuration
│   └── Dockerfile
│
├── back/
│   ├── server/                # Main backend API
│   │   ├── route/            # API routes
│   │   ├── middleware/       # Auth & upload middleware
│   │   └── Dockerfile
│   │
│   ├── ML/                   # OCR service
│   │   ├── app.py           # FastAPI app
│   │   ├── extract.py       # Google Vision extraction
│   │   ├── parser.py        # Text parsing
│   │   └── Dockerfile
│   │
│   └── playwright-service/   # Registry verification
│       ├── index.js         # Express server
│       ├── imrCheck.js      # NMC registry scraper
│       └── Dockerfile
│
└── docker-compose.yml        # Service orchestration
```

## 🔧 Environment Variables

### Backend Server
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_ADMIN_KEY=your_supabase_admin_key
JWT_SECRET=your_jwt_secret
ML_SERVICE_URL=http://localhost:8001
PLAYWRIGHT_SERVICE_URL=http://localhost:9000
```

### ML Service
- `GOOGLE_APPLICATION_CREDENTIALS` (optional - auto-detects `google-vision-key.json`)

## 🧪 Development Commands

### Docker
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild after dependency changes
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

### Individual Services
See each service's README for local development commands.

## 🔐 Security Notes

- Never commit `.env` files
- Never commit `google-vision-key.json` or other credentials
- Use environment variables for sensitive data
- All credentials are in `.gitignore`

## 🐛 Troubleshooting

### Port already in use
```bash
# Stop existing containers
docker-compose down

# Or change ports in docker-compose.yml
```

### Services can't connect
- Ensure all services are running
- Check service URLs in environment variables
- In Docker, services use service names (e.g., `ml-service:8001`)
- Locally, use `localhost:8001`

### ML Service errors
- Ensure `google-vision-key.json` exists in `back/ML/`
- Check Poppler is installed (for local dev)
- Verify Google Vision API is enabled

### Playwright Service errors
- Ensure Chromium is installed
- Check network connectivity for NMC website
- Increase timeout if needed

## 📝 API Endpoints

### Backend API (Port 3000)
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /verification/submit` - Submit verification documents
- `GET /admin/verifications/pending` - Get pending verifications
- `POST /admin/verifications/:userId/ai-check` - Run AI verification

### ML Service (Port 8001)
- `POST /extract-license` - Extract text from license PDF

### Playwright Service (Port 9000)
- `POST /mci-check` - Check NMC registry

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally and with Docker
4. Submit a pull request

## 📄 License

ISC License

## 👥 Maintainers

Built with ❤️ by the DocSpace team.

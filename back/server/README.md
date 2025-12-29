# Backend Server - DocSpace

Node.js + Express backend API for DocSpace platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and credentials
- ML Service running (port 8001)
- Playwright Service running (port 9000)

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

Create a `.env` file in `back/server/`:

```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_ADMIN_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key

# Service URLs (for Docker, use service names)
ML_SERVICE_URL=http://localhost:8001
PLAYWRIGHT_SERVICE_URL=http://localhost:9000
GNEWS_KEY=your_gnews_key
NEWSDATA_API_KEY=your_newsdata_api_key
GEMINI_API_KEY=your_gemini_api_key
   SMTP_HOST=your_smtp_host
   SMTP_PORT=your_smtp_port
   SMTP_USER=your_smtp_uer
   SMTP_PASS=your_smtp_pass
   SMTP_FROM=your_smtp_from
FRONTEND_URL=http://localhost:5173
GOOGLE_VISION_KEY=your_google_vision_key in json format
```

### Run Server

```bash
# Development mode (with nodemon auto-reload)
npm start
# or
npm run dev

# Server will start on http://localhost:3000
```

## 📁 Project Structure

```
server/
├── route/              # API routes
│   ├── auth.js        # Authentication routes
│   ├── admin.js       # Admin routes
│   ├── profile.js     # User profile routes
│   ├── verification.js # Verification routes
│   └── ...
├── middleware/         # Middleware functions
│   ├── auth.js       # JWT authentication
│   ├── admin.js      # Admin authorization
│   └── upload.js     # File upload handling
├── models/            # Data models
├── db.js             # Supabase client
├── Admin.js          # Supabase admin client
└── server.js         # Express app entry point
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration

### User Profile
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Verification
- `POST /verification/submit` - Submit verification documents
- `GET /verification/status` - Get verification status

### Admin
- `GET /admin/verifications/pending` - Get pending verifications
- `GET /admin/verifications/:userId/document/:type` - Get document URL
- `POST /admin/verifications/:userId/ai-check` - Run AI verification
- `POST /admin/verifications/:userId/:action` - Approve/reject user

## 🔐 Authentication

The API uses JWT tokens:
- Tokens are issued on login
- Tokens must be sent in `Authorization: Bearer <token>` header
- Admin routes require `role: "admin"` in token

## 🔗 Service Integration

The backend integrates with:
- **ML Service** (port 8001): OCR extraction from PDFs
- **Playwright Service** (port 9000): NMC registry verification

Service URLs are configurable via environment variables.

## 🐛 Troubleshooting

### Port already in use
```bash
# Change PORT in .env or kill process using port 3000
lsof -ti:3000 | xargs kill
```

### Supabase connection errors
- Verify `SUPABASE_URL` and keys in `.env`
- Check Supabase project is active
- Verify network connectivity

### Service connection errors
- Ensure ML service is running on port 8001
- Ensure Playwright service is running on port 9000
- Check service URLs in environment variables
- In Docker, use service names: `ml-service:8001`

### JWT errors
- Verify `JWT_SECRET` is set in `.env`
- Check token is being sent in Authorization header
- Verify token hasn't expired

## 📦 Dependencies

- express - Web framework
- @supabase/supabase-js - Database client
- jsonwebtoken - JWT authentication
- bcrypt - Password hashing
- cors - CORS middleware
- dotenv - Environment variables
- node-fetch - HTTP client
- form-data - Form data handling

## 🧪 Testing

```bash
# Run tests (if available)
npm test
```

## 🚀 Production

```bash
# Set NODE_ENV
export NODE_ENV=production

# Start server
npm start
```

## 📝 Notes

- Uses ES modules (`"type": "module"`)
- Nodemon for development auto-reload
- CORS enabled for frontend (localhost:5173)
- File uploads handled via Supabase Storage


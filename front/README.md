# Frontend - DocSpace

React + Vite frontend application for medical license verification.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Backend server running (port 3000)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

## 📦 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## ⚙️ Configuration

### API Configuration

Edit `src/config/api.js` to set the backend API URL:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

Or set environment variable:
```bash
export VITE_API_URL=http://localhost:3000
```

## 🏗️ Project Structure

```
front/
├── src/
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── GetVerified.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── ...
│   ├── components/         # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   ├── config/             # Configuration
│   │   └── api.js
│   ├── App.jsx             # Main app component
│   └── main.jsx           # Entry point
├── public/                 # Static assets
└── package.json
```

## 🔐 Authentication

The app uses JWT tokens stored in `localStorage`:
- Token is stored after login
- Token is sent in `Authorization` header for protected routes
- Token is cleared on logout

## 🎨 Styling

- Tailwind CSS for styling
- Responsive design
- Modern UI components

## 🐛 Troubleshooting

### API connection errors
- Ensure backend server is running on port 3000
- Check `VITE_API_URL` environment variable
- Verify CORS is enabled on backend

### Build errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## 📝 Environment Variables

```env
VITE_API_URL=http://localhost:3000
```

## 🚀 Production Build

```bash
# Build for production
npm run build

# Output will be in dist/ directory
# Serve with any static file server (nginx, etc.)
```

## 📦 Dependencies

- React 18
- Vite
- React Router
- Tailwind CSS

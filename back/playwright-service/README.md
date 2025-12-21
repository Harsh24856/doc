# Playwright Service - DocSpace

Node.js service using Playwright to verify medical licenses against the NMC (National Medical Commission) Indian Medical Register.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Playwright browsers (installed automatically)

### Installation

```bash
# Navigate to playwright-service directory
cd back/playwright-service

# Install dependencies
npm install

# Install Playwright browsers (required)
npx playwright install chromium
```

### Run Server

```bash
# Start the service
npm start

# Server will be available at http://localhost:9000
```

## 📁 Project Structure

```
playwright-service/
├── index.js          # Express server
├── imrCheck.js       # NMC registry verification logic
├── package.json
└── README.md
```

## 🔌 API Endpoints

### MCI Check
```
POST /mci-check
Content-Type: application/json

Body:
{
  "name": "Doctor Name",
  "registration_number": "12345"
}

Response:
{
  "status": "FOUND" | "NOT_FOUND" | "ERROR",
  "source": "NMC_IMR",
  "record": {
    "serial_no": "...",
    "year_of_info": "...",
    "registration_number": "...",
    "state_medical_council": "...",
    "name": "...",
    "father_name": "..."
  }
}
```

## 🔧 How It Works

1. **Navigate to NMC IMR**: Opens the Indian Medical Register search page
2. **Fill Form**: Enters doctor name and registration number
3. **Submit**: Submits the search form
4. **Extract Results**: Parses the results table
5. **Return Data**: Returns structured JSON with registry information

## ⚙️ Configuration

The service runs in headless mode by default. To see the browser:

Edit `imrCheck.js`:
```javascript
const browser = await chromium.launch({
  headless: false,  // Set to false to see browser
  slowMo: 100       // Slow down actions (ms)
});
```

## 🐛 Troubleshooting

### Playwright browsers not installed
```bash
# Install Chromium
npx playwright install chromium

# Install all browsers
npx playwright install
```

### Timeout errors
- NMC website may be slow - increase timeout in `imrCheck.js`
- Check network connectivity
- Verify NMC website is accessible

### Selector errors
- NMC website structure may have changed
- Update selectors in `imrCheck.js`:
  - `#doctorName` - Name input
  - `#doctorRegdNo` - Registration input
  - `#doctor_advance_Details` - Submit button
  - `#doct_info5 tbody tr` - Results table

### Port already in use
```bash
# Change port in index.js
app.listen(9001, ...)

# Or kill process
lsof -ti:9000 | xargs kill
```

## 📦 Dependencies

- `express` - Web framework
- `playwright` - Browser automation

## 🧪 Testing

```bash
# Test the service
curl -X POST http://localhost:9000/mci-check \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Doctor",
    "registration_number": "12345"
  }'
```

## 🚀 Production

```bash
# Run with PM2 (process manager)
npm install -g pm2
pm2 start index.js --name playwright-service

# Or use Docker (see docker-compose.yml)
```

## 📝 Notes

- Uses headless browser by default
- Waits for dynamic content to load
- Handles AJAX-loaded results
- Extracts first matching record only
- May need selector updates if NMC website changes

## 🔐 Security

- No authentication required (internal service)
- Should be behind firewall/proxy in production
- Rate limiting recommended for production use

## ⚠️ Important

- This service scrapes the NMC website
- Respect rate limits and terms of service
- Website structure may change - monitor for updates
- Consider caching results to reduce load


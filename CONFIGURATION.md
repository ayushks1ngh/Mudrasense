# MudraSense Configuration Guide

## Backend Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Required: Google Generative AI API Key
GOOGLE_API_KEY=your_api_key_here

# Optional: Server port (default: 4000)
PORT=4000

# Optional: Environment mode (development or production)
NODE_ENV=development
```

### Getting Your Google API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create new API key"
3. Copy the generated key
4. Paste into `.env` file

### Production Configuration

For production deployments:

```env
GOOGLE_API_KEY=your_production_api_key
PORT=4000
NODE_ENV=production
```

**Key Differences in Production**:
- Rate limiting is enforced (30 requests/min per IP)
- Security headers are added
- All analysis results are logged with IP addresses
- Cache headers are set for performance

## Frontend Configuration

### Setting API Endpoint

The frontend can connect to different backend instances by setting the API base URL.

**Option 1: Script Tag (Recommended)**

Add this before loading `mudras.js`:

```html
<script>
  // For local development
  window.API_BASE_URL = 'http://localhost:4000';
  
  // For production
  // window.API_BASE_URL = 'https://api.example.com';
</script>
<script src="mudras.js"></script>
```

**Option 2: Environment Variable**

The frontend defaults to:
```javascript
const API_BASE_URL = window.API_BASE_URL || (process.env.API_BASE_URL || 'http://localhost:4000');
```

### Deployment URLs

**Local Development**:
```javascript
window.API_BASE_URL = 'http://localhost:4000';
```

**Staging**:
```javascript
window.API_BASE_URL = 'https://staging-api.example.com';
```

**Production**:
```javascript
window.API_BASE_URL = 'https://api.example.com';
```

## System Configuration

### File Upload Settings

**Backend** (`backend/analyze.js`):

```javascript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
```

To modify these limits, edit `analyze.js` and rebuild.

### Rate Limiting

**Current Configuration**:
- Limit: 30 requests per minute per IP address
- Window: 60,000ms (1 minute)
- Status Code: 429 (Too Many Requests)

To adjust rate limits, modify in `backend/analyze.js`:

```javascript
const RATE_LIMIT_WINDOW = 60000; // milliseconds
const MAX_REQUESTS_PER_WINDOW = 30; // requests
```

### Request Timeout

**Frontend**: 60-second timeout for API requests
**Gemini API**: Inherits default timeout from Google API client

To modify frontend timeout, edit `mudras.js`:

```javascript
const timeoutId = setTimeout(() => controller.abort(), 60000); // milliseconds
```

### Retry Configuration

**Frontend Retry Logic**:
- Max retries: 3 attempts
- Backoff: Exponential (2^retry * 500ms)
- Triggers: Network errors and 5xx responses

To adjust retry behavior, modify in `mudras.js`:

```javascript
const MAX_RETRIES = 3;
// Exponential backoff: Math.pow(2, retryCount) * 500
```

## Data Storage

### Results Directory

Analysis results are stored in `backend/results/` as JSON files:

```
backend/results/
├── 1718894236445-abc123.json
├── 1718894238921-def456.json
└── ...
```

**Format**:
```json
{
  "success": true,
  "feedback": "Analysis feedback text",
  "mudraName": "Pataka",
  "timestamp": "2025-06-03T10:50:36.445Z",
  "clientIp": "192.168.1.1"
}
```

### Temp Upload Directory

Uploaded images are temporarily stored in `backend/uploads/` and automatically deleted after analysis.

## Performance Tuning

### Caching

- Health check: 10 seconds
- Analysis results: 1 hour
- Frontend assets: Browser defaults

### Compression

Currently not enabled. To enable gzip compression, add:

```javascript
import compression from 'compression';
app.use(compression());
```

And install the dependency:
```bash
npm install compression
```

### Database (Future)

For persistence at scale, consider:
- MongoDB for result storage
- Redis for caching
- PostgreSQL for analytics

## Security Configuration

### CORS

Currently allows all origins. For production, restrict CORS:

```javascript
app.use(cors({
  origin: ['https://example.com', 'https://www.example.com'],
  credentials: true
}));
```

### Security Headers

Currently enabled:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

To modify, edit in `backend/analyze.js`:

```javascript
app.use((req, res, next) => {
  res.set('X-Custom-Header', 'value');
  next();
});
```

### HTTPS

In production, always use HTTPS. Configure via:
- Nginx reverse proxy
- Docker/Kubernetes ingress
- Cloud provider (AWS ALB, GCP Load Balancer, etc.)

## Logging Configuration

### Log Levels

Currently logs:
- `✅` - Successful server startup
- `📨` - Incoming requests
- `💾` - Saved results
- `✨` - Completed analysis
- `⚠️` - Warnings
- `🔍` - Query logs
- `🔎` - Result fetches

To add custom logging, modify request handlers in `backend/analyze.js`.

### Log Aggregation (Production)

Consider setting up:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- CloudWatch (AWS)
- Stackdriver (GCP)

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install

COPY backend/ .

EXPOSE 4000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  mudrasense:
    build: .
    ports:
      - "4000:4000"
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - PORT=4000
      - NODE_ENV=production
    volumes:
      - ./results:/app/results
```

## Monitoring

### Health Checks

```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "Server is running",
  "timestamp": "2025-06-03T10:50:36.445Z"
}
```

### Metrics to Monitor

- Request latency (Gemini API)
- Error rate (failed analyses)
- Rate limit hits
- Disk space (results directory)
- API key quota usage

## Troubleshooting

### "GOOGLE_API_KEY not found"
- Check `.env` file exists in `backend/`
- Verify key is not empty or null
- Restart server after adding key

### "Rate limit exceeded"
- Wait 1 minute
- Check for automated requests/scripts
- Adjust `MAX_REQUESTS_PER_WINDOW` if needed

### "Port 4000 already in use"
- Find process: `lsof -i :4000`
- Kill process: `kill -9 <PID>`
- Or change PORT in `.env`

### Performance Issues

1. Check Gemini API response times
2. Monitor disk space in `results/`
3. Check rate limiting logs
4. Verify network connectivity

## Deployment Checklist

- [ ] Set production environment variables
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting or use API gateway
- [ ] Configure backups for `results/` directory
- [ ] Set up monitoring and alerting
- [ ] Test all endpoints
- [ ] Verify security headers
- [ ] Document any custom configurations
- [ ] Set up CI/CD pipeline

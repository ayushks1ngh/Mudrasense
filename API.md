# MudraSense API Documentation

## Base URL

```
http://localhost:4000
```

For production, update to your deployment URL.

## Authentication

Currently, no authentication is required. Rate limiting is applied per IP address.

## Rate Limiting

- **Limit**: 30 requests per minute per IP address
- **Status Code**: 429 (Too Many Requests)
- **Response**: 
```json
{
  "success": false,
  "error": "Too many requests. Please try again later."
}
```

## Endpoints

### 1. Analyze Mudra

Analyzes a mudra image and provides AI-generated feedback.

**Endpoint**: `POST /analyze`

**Content-Type**: `multipart/form-data`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | File | Yes | Image file (JPEG, PNG, WebP). Max 5MB |
| mudraName | String | Yes | Name of the mudra (max 100 chars) |
| description | String | Yes | Expected formation description (max 1000 chars) |

**Request Example**:
```bash
curl -X POST http://localhost:4000/analyze \
  -F "image=@mudra.jpg" \
  -F "mudraName=Pataka" \
  -F "description=All five fingers held straight and close together"
```

**Success Response** (200):
```json
{
  "success": true,
  "feedback": "🎉 Great work! You have learned the Pataka mudra! Your hand position captures the essence of this gesture beautifully. Keep practicing to refine it further!",
  "mudraName": "Pataka",
  "resultId": "1718894236445-abc123xyz"
}
```

**Error Responses**:

- Missing file (400):
```json
{
  "success": false,
  "error": "No image file uploaded"
}
```

- Invalid input (400):
```json
{
  "success": false,
  "error": "Invalid mudra name"
}
```

- File too large (413):
```json
{
  "success": false,
  "error": "File is too large. Maximum size is 5MB."
}
```

- Invalid file type (400):
```json
{
  "success": false,
  "error": "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
}
```

- API error (500):
```json
{
  "success": false,
  "error": "Error analyzing mudra. Please try again.",
  "details": "GOOGLE_API_KEY not found in .env"
}
```

---

### 2. Health Check

Check if the server is running.

**Endpoint**: `GET /health`

**Request Example**:
```bash
curl http://localhost:4000/health
```

**Response** (200):
```json
{
  "status": "Server is running",
  "timestamp": "2025-06-03T10:50:36.445+05:30"
}
```

---

### 3. Get Stored Result

Retrieve a previously saved analysis result by ID.

**Endpoint**: `GET /result/:id`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Result ID from analyze endpoint |

**Request Example**:
```bash
curl http://localhost:4000/result/1718894236445-abc123xyz
```

**Success Response** (200):
```json
{
  "success": true,
  "feedback": "🎉 Great work! You have learned the Pataka mudra!...",
  "mudraName": "Pataka",
  "timestamp": "2025-06-03T10:50:36.445Z"
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": "Result not found"
}
```

---

## Error Handling

All error responses include:
- `success`: boolean (false)
- `error`: human-readable error message
- `details`: additional context (optional)

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Not Found
- `413`: Payload Too Large
- `429`: Too Many Requests
- `500`: Internal Server Error

---

## Request/Response Format

**Character Limits**:
- mudraName: 100 characters max
- description: 1000 characters max

**File Limits**:
- Max file size: 5MB
- Supported formats: JPEG, PNG, WebP

**Timeout**:
- Request timeout: 60 seconds

---

## Examples

### JavaScript/Fetch

```javascript
async function analyzeMudra(file, mudraName, description) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('mudraName', mudraName);
  formData.append('description', description);

  const response = await fetch('http://localhost:4000/analyze', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Error:', data.error);
    return null;
  }

  console.log('Feedback:', data.feedback);
  console.log('Result ID:', data.resultId);
  return data;
}
```

### Python

```python
import requests

def analyze_mudra(image_path, mudra_name, description):
    url = 'http://localhost:4000/analyze'
    
    with open(image_path, 'rb') as f:
        files = {
            'image': f,
            'mudraName': (None, mudra_name),
            'description': (None, description)
        }
        response = requests.post(url, files=files)
    
    if response.status_code != 200:
        print(f"Error: {response.json()['error']}")
        return None
    
    data = response.json()
    print(f"Feedback: {data['feedback']}")
    return data
```

### cURL

```bash
# Analyze a mudra
curl -X POST http://localhost:4000/analyze \
  -F "image=@mudra.jpg" \
  -F "mudraName=Pataka" \
  -F "description=All five fingers held straight and close together"

# Get health status
curl http://localhost:4000/health

# Get stored result
curl http://localhost:4000/result/1718894236445-abc123xyz
```

---

## Best Practices

1. **Error Handling**: Always check the `success` field in responses
2. **File Validation**: Validate files on the client before uploading
3. **Retry Logic**: Implement exponential backoff for failed requests
4. **Rate Limiting**: Handle 429 responses gracefully
5. **Timeouts**: Set appropriate request timeouts (60+ seconds recommended)

---

## Deployment

When deploying to production:

1. Update API base URL in frontend
2. Set `NODE_ENV=production` in backend
3. Use proper API key management
4. Enable HTTPS
5. Implement additional rate limiting (use Redis/Memcached)
6. Set up monitoring and logging

---

## Support

For API issues or questions, please open an issue on GitHub.

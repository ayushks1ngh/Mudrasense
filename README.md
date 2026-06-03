# MudraSense 🪷

An intelligent Bharatanatyam mudra learning platform that uses AI-powered image analysis to help students master classical Indian hand gestures.

## 🌟 Features

- **28 Asamyuta Hastas**: Complete collection of single-hand mudras from Bharatanatyam
- **AI Analysis**: Uses Google Gemini 2.0 Flash for intelligent mudra recognition
- **Interactive Learning**: Beautiful UI for exploring mudra formations and meanings
- **Instant Feedback**: Real-time analysis of uploaded mudra images
- **Educational Focus**: Encouraging feedback tailored for learners

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Vanilla JavaScript, HTML5, CSS3
- Responsive design with mobile support
- Accessible (WCAG 2.1 AA compliant)

**Backend:**
- Node.js + Express.js
- Google Generative AI API (Gemini 2.0 Flash)
- Multer for file uploads
- CORS-enabled for cross-origin requests

## 📋 Prerequisites

- Node.js v18+ and npm
- Google API key with Generative AI access
- Modern web browser

## 🚀 Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/ayushks1ngh/Mudrasense.git
cd Mudrasense
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
GOOGLE_API_KEY=your_google_api_key_here
PORT=4000
```

Get your Google API key:
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create or select a project
3. Generate an API key
4. Enable Generative AI API

### 3. Start Backend

```bash
npm start        # Production
npm run dev      # Development with nodemon
```

Server runs on `http://localhost:4000`

### 4. Frontend Setup

```bash
cd frontend
# No npm dependencies needed - just serve the files
python -m http.server 3000
# or
npx http-server -p 3000
```

Frontend runs on `http://localhost:3000`

## 🔌 API Endpoints

### POST `/analyze`

Analyzes a mudra image and provides feedback.

**Request:**
```
Content-Type: multipart/form-data

Fields:
- image (file): Image file (JPEG, PNG, WebP - max 5MB)
- mudraName (string): Name of mudra being analyzed
- description (string): Expected formation description
```

**Response:**
```json
{
  "success": true,
  "feedback": "🎉 Great work! You have learned the Pataka mudra!...",
  "mudraName": "Pataka",
  "resultId": "1234567890-abc123"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "Server is running",
  "timestamp": "2025-06-03T10:50:36.445+05:30"
}
```

### GET `/result/:id`

Retrieves a previously saved analysis result.

**Response:**
```json
{
  "success": true,
  "feedback": "Analysis feedback text...",
  "mudraName": "Pataka",
  "timestamp": "2025-06-03T10:50:36.445Z"
}
```

## 📱 Environment Configuration

### Frontend Configuration

Set API base URL (default: `http://localhost:4000`):

```html
<script>
  window.API_BASE_URL = 'https://api.example.com';
</script>
```

Or set before loading mudras.js:

```html
<script>
  window.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
</script>
```

### Backend Configuration

Create `.env` in `backend/` directory:

```env
GOOGLE_API_KEY=your_api_key
PORT=4000
NODE_ENV=production
```

## 📚 Mudra Data

All 28 Asamyuta Hastas are defined in `frontend/mudras.js`:

```javascript
{
  id: 1,
  name: "Pataka",
  description: "The flag gesture with all fingers extended...",
  emoji: "🏴",
  handFormation: "All five fingers are held straight and close together...",
  symbolicMeaning: "Pataka symbolizes many natural elements...",
  usageInDance: "Used extensively in Bharatanatyam to depict..."
}
```

## 🔒 Security

### Input Validation

- **File Types**: Only JPEG, PNG, WebP allowed
- **File Size**: Maximum 5MB per upload
- **Text Fields**: Limited to 100 chars (mudraName), 1000 chars (description)
- **Text Sanitization**: Protection against prompt injection

### Best Practices

- Never commit `.env` files with API keys
- Use environment-specific configurations
- Enable HTTPS in production
- Implement rate limiting for production deployment

## 🎨 UI/UX Features

- **Responsive Design**: Mobile, tablet, desktop optimized
- **Accessible**: WCAG 2.1 AA compliant with ARIA labels
- **Keyboard Navigation**: Full keyboard support (Escape to close modal, Enter to activate)
- **Loading States**: Visual feedback during analysis
- **Error Handling**: User-friendly error messages
- **Interactive Feedback**: Modal-based result display

## ⚙️ Performance Considerations

- Image analysis: ~3-5 seconds average
- 60-second request timeout
- Automatic file cleanup after analysis
- Results persisted to JSON for reference

## 📝 Development

### Project Structure

```
Mudrasense/
├── backend/
│   ├── analyze.js          # Main Express server
│   ├── package.json        # Dependencies
│   ├── results/            # Saved analysis results
│   └── uploads/            # Temp image storage
├── frontend/
│   ├── index.html          # Main page
│   ├── mudras.js           # Mudra data & logic
│   ├── style.css           # Styles
│   └── mudras/             # Reference images
├── README.md               # This file
└── .gitignore              # Git ignore rules
```

### Adding New Features

1. Backend changes: Update `backend/analyze.js`
2. Frontend changes: Update `frontend/mudras.js` or `index.html`
3. Test locally before pushing
4. Create descriptive commit messages

## 🐛 Troubleshooting

### "GOOGLE_API_KEY not found"
- Ensure `.env` file exists in `backend/`
- Check API key is valid and not expired

### "File is too large"
- Maximum file size is 5MB
- Compress or resize image before uploading

### "Invalid file type"
- Only JPEG, PNG, WebP images supported
- Convert your image to supported format

### CORS errors
- Ensure backend is running on correct port
- Check `API_BASE_URL` configuration in frontend

## 📄 License

ISC License - See LICENSE file for details

## 🤝 Contributing

Pull requests welcome! For major changes, please open an issue first.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Made with 🪷 for Bharatanatyam learners worldwide**

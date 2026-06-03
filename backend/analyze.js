import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Performance: Set cache headers for health checks
app.use((req, res, next) => {
  if (req.path === '/health') {
    res.set('Cache-Control', 'public, max-age=10');
  } else if (req.path.startsWith('/result/')) {
    // Cache results for 1 hour (they're immutable)
    res.set('Cache-Control', 'public, max-age=3600');
  }
  next();
});

// Simple rate limiting for production
const requestLog = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

const rateLimit = (req, res, next) => {
  const now = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress;
  
  if (!requestLog[clientIp]) {
    requestLog[clientIp] = [];
  }
  
  // Clean old entries
  requestLog[clientIp] = requestLog[clientIp].filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (requestLog[clientIp].length >= MAX_REQUESTS_PER_WINDOW) {
    console.warn(`⚠️ Rate limit exceeded for ${clientIp}`);
    return res.status(429).json({ 
      success: false, 
      error: 'Too many requests. Please try again later.' 
    });
  }
  
  requestLog[clientIp].push(now);
  next();
};

app.use(rateLimit);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Allowed image MIME types for mudra analysis
const ALLOWED_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({ 
  dest: uploadDir,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."));
    }
    cb(null, true);
  }
});

// Directory where we persist analysis results as JSON files
const resultsDir = path.join(process.cwd(), "results");
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    let { mudraName, description } = req.body;

    // Input validation
    if (!mudraName || typeof mudraName !== "string" || mudraName.trim().length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Invalid mudra name" });
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Invalid mudra description" });
    }

    // Sanitize inputs - limit length to prevent prompt injection
    mudraName = mudraName.trim().substring(0, 100);
    description = description.trim().substring(0, 1000);

    const imagePath = req.file.path;

    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY not found in .env");
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Read and convert image to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    // Create the analysis prompt
    const prompt = `You are a kind and encouraging Bharatanatyam dance teacher analyzing a student's mudra attempt.

Student is performing: "${mudraName}" mudra

Correct formation for ${mudraName}:
"${description}"

IMPORTANT INSTRUCTIONS:
1. Be GENEROUS and ENCOURAGING in your evaluation
2. If the mudra is 10% or more accurate: Consider it CORRECT
3. Focus on the overall gesture rather than minor imperfections
4. Remember that small variations are natural and acceptable

RESPONSE FORMAT:

If the mudra is MOSTLY CORRECT (10-100% accurate):
"🎉 Great work! You have learned the ${mudraName} mudra! Your hand position captures the essence of this gesture beautifully. [Mention 1-2 positive specific things they did well]. Keep practicing to refine it further!"

If the mudra NEEDS IMPROVEMENT (below 10%):
"Good attempt at ${mudraName}! You're on the right track. Here's what to focus on:

**What to adjust:**
• [Most important fix - be specific but kind]
• [Second important fix if needed]

**You're doing well:**
• [Something positive they're doing correctly]

Keep practicing - you're making progress!"

Be warm, supportive, and focus on encouragement. Students learn better with positive reinforcement.`;

    // Generate content with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const feedback = response.text() || "No feedback generated.";

    // Persist the result to a JSON file so frontend (or user) can fetch it later
    const resultId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const resultPayload = {
      success: true,
      feedback,
      mudraName,
      timestamp: new Date().toISOString(),
      clientIp: req.ip || req.connection.remoteAddress
    };

    const resultPath = path.join(resultsDir, `${resultId}.json`);
    try {
      fs.writeFileSync(resultPath, JSON.stringify(resultPayload, null, 2), 'utf8');
      console.log('💾 Saved analysis result to', resultPath);
    } catch (writeErr) {
      console.warn('⚠️ Failed to save result file:', writeErr);
    }

    // Clean up uploaded file
    try { fs.unlinkSync(imagePath); } catch (e) { /* ignore */ }

    // Return the resultId so frontend can fetch the stored JSON if desired
    res.status(200).json({ 
      success: true,
      feedback,
      mudraName,
      resultId
    });

    // Log successful analysis
    console.log(`✨ Analysis complete: ${mudraName} (ID: ${resultId})`);

  } catch (error) {
    console.error("Error analyzing mudra:", error);
    
    // Clean up file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      success: false,
      error: "Error analyzing mudra. Please try again.",
      details: error.message 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is running", timestamp: new Date() });
});

// Serve stored analysis result by id
app.get('/result/:id', (req, res) => {
  const id = req.params.id;
  console.log('🔎 GET /result/' + id);
  const filePath = path.join(resultsDir, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Result not found' });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Failed to read result file:', err);
    return res.status(500).json({ success: false, error: 'Failed to read result' });
  }
});

// Multer error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({ 
        success: false, 
        error: 'File is too large. Maximum size is 5MB.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      error: `Upload error: ${err.message}` 
    });
  } else if (err) {
    return res.status(400).json({ 
      success: false, 
      error: err.message || 'An error occurred' 
    });
  }
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✅ MudraSense Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`📸 Analysis endpoint: http://localhost:${port}/analyze`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
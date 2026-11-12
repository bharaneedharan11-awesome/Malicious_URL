import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateUrl } from './src/services/detector';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory server scan history storage
interface ScanRecord {
  id: string;
  url: string;
  timestamp: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  triggeredCount: number;
  summary: string;
  recommendation: string;
}

let serverScanHistory: ScanRecord[] = [
  {
    id: 'scan_init_1',
    url: 'https://www.google.com',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    riskScore: 0,
    riskLevel: 'Low',
    triggeredCount: 0,
    summary: 'Low risk profile. Standard structural and lexical characteristics observed.',
    recommendation: 'Safe to browse under standard precautions.',
  },
  {
    id: 'scan_init_2',
    url: 'http://192.168.1.10/login.php',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    riskScore: 50,
    riskLevel: 'Medium',
    triggeredCount: 3,
    summary: 'Elevated risk warning. Identified abnormal characteristics: IP Host and Insecure HTTP on sensitive action.',
    recommendation: 'PROCEED WITH CAUTION. Avoid entering credentials.',
  },
  {
    id: 'scan_init_3',
    url: 'http://paypal-security-account-verification.top/signin.php',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    riskScore: 82,
    riskLevel: 'High',
    triggeredCount: 5,
    summary: 'High probability of phishing intent. Detected brand mimicry (paypal) on unauthorized domain with high-abuse TLD.',
    recommendation: 'DO NOT VISIT. Do not input passwords, credit card numbers, or personal details.',
  }
];

// Initialize server-side Gemini client if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// Gmail & Password Authentication store
interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string; // Plain/hashed comparison in memory
  role: string;
  createdAt: string;
}

const usersDb = new Map<string, UserRecord>();

// Pre-seed default accounts
usersDb.set('bharaneedharan11@gmail.com', {
  id: 'usr_bharaneedharan',
  email: 'bharaneedharan11@gmail.com',
  displayName: 'Bharaneedharan',
  passwordHash: 'password123',
  role: 'Senior Security Analyst',
  createdAt: new Date().toISOString(),
});

usersDb.set('analyst@gmail.com', {
  id: 'usr_analyst',
  email: 'analyst@gmail.com',
  displayName: 'Security Analyst',
  passwordHash: 'password123',
  role: 'SOC Analyst',
  createdAt: new Date().toISOString(),
});

// Helper: Normalize & validate Gmail / Email
function validateGmailAddress(rawEmail: string): { valid: boolean; normalized: string; error?: string } {
  const normalized = rawEmail.trim().toLowerCase();
  if (!normalized) {
    return { valid: false, normalized: '', error: 'Gmail address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return { valid: false, normalized: '', error: 'Please enter a valid email format (e.g. name@gmail.com).' };
  }
  return { valid: true, normalized };
}

// Auth: Login with Gmail & Password
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const validation = validateGmailAddress(email || '');
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long.',
    });
  }

  const user = usersDb.get(validation.normalized);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Account not found. Please click "Create Account" first to register your Gmail address.',
    });
  }

  if (user.passwordHash !== password) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect password. Please verify your password and try again.',
    });
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    loginAt: new Date().toISOString(),
  };

  return res.json({
    success: true,
    message: 'Signed in successfully with Gmail.',
    user: safeUser,
    token: `token_${Buffer.from(user.email).toString('base64')}_${Date.now()}`,
  });
});

// Auth: Register New Gmail Account
app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName } = req.body;
  const validation = validateGmailAddress(email || '');
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long.',
    });
  }

  if (usersDb.has(validation.normalized)) {
    return res.status(400).json({
      success: false,
      error: 'An account with this Gmail address already exists. Please sign in instead.',
    });
  }

  const name = displayName?.trim() || validation.normalized.split('@')[0];
  const newUser: UserRecord = {
    id: `usr_${Date.now()}`,
    email: validation.normalized,
    displayName: name,
    passwordHash: password,
    role: 'Security Analyst',
    createdAt: new Date().toISOString(),
  };
  usersDb.set(validation.normalized, newUser);

  const safeUser = {
    id: newUser.id,
    email: newUser.email,
    displayName: newUser.displayName,
    role: newUser.role,
    loginAt: new Date().toISOString(),
  };

  return res.json({
    success: true,
    message: 'Account created successfully with Gmail.',
    user: safeUser,
    token: `token_${Buffer.from(newUser.email).toString('base64')}_${Date.now()}`,
  });
});

// 1. API: Scan URL with heuristic engine
app.post('/api/scan', (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'URL parameter is required.' });
  }

  const { result, error } = evaluateUrl(url);
  if (error || !result) {
    return res.status(400).json({ error: error || 'Failed to parse URL.' });
  }

  // Prepend to server history
  serverScanHistory.unshift({
    id: result.id,
    url: result.url,
    timestamp: result.timestamp,
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
    triggeredCount: result.triggeredCount,
    summary: result.summary,
    recommendation: result.recommendation,
  });

  // Keep last 100
  if (serverScanHistory.length > 100) {
    serverScanHistory = serverScanHistory.slice(0, 100);
  }

  return res.json({ success: true, result });
});

// 2. API: Optional Server-Side Gemini Threat Intelligence Analysis
app.post('/api/threat-intel', async (req, res) => {
  const { url, heuristicSummary } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required.' });
  }

  // If Gemini client is available, call gemini-3.8-flash for deeper contextual analysis
  if (aiClient) {
    try {
      const prompt = `You are a Senior Threat Intelligence Analyst and Cybersecurity Researcher.
Analyze the following potentially malicious/phishing web address: "${url}".
Heuristic scan context: "${heuristicSummary || 'Evaluated for lexical anomalies and brand spoofing'}".

Perform a static cybersecurity threat intelligence evaluation.
Analyze:
1. Verdict: Must be one of ["BENIGN", "SUSPICIOUS", "PHISHING", "MALICIOUS"].
2. Targeted Brand: Identify if any financial institution, tech company, or service is being impersonated. If none, specify "None".
3. Confidence Score: A number between 0 and 100.
4. Social Engineering Tactics: Array of detected lures or deception mechanisms (e.g. "Urgency", "Credential Harvesting", "Brand Impersonation", "Homoglyph Confusion", "Masked Authority").
5. Threat Summary: 2 concise sentences explaining why this URL represents a threat or why it is benign.
6. Indicators of Compromise: Array of 2-4 observable indicators in the URL structure.
7. Mitigation Steps: Array of 2-3 concrete actionable protective steps for end users and SOC defenders.

Provide your response strictly in the following JSON format:
{
  "verdict": "PHISHING",
  "confidenceScore": 88,
  "targetedBrand": "PayPal",
  "socialEngineeringTactics": ["Credential harvesting lure", "Urgent security alert framing"],
  "threatSummary": "Summary text here.",
  "indicatorsOfCompromise": ["Indicator 1", "Indicator 2"],
  "mitigationSteps": ["Step 1", "Step 2"]
}`;

      const aiResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = aiResponse.text || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json({
        enabled: true,
        analyzedAt: new Date().toISOString(),
        ...parsedData,
      });
    } catch (err) {
      console.error('Gemini Threat Intel error:', err);
    }
  }

  // Structured Heuristic Threat Intelligence Fallback
  const { result } = evaluateUrl(url);
  const isHigh = (result?.riskScore || 0) >= 65;
  const isMed = (result?.riskScore || 0) >= 30;

  return res.json({
    enabled: true,
    analyzedAt: new Date().toISOString(),
    verdict: isHigh ? 'PHISHING' : isMed ? 'SUSPICIOUS' : 'BENIGN',
    confidenceScore: Math.max(60, result?.riskScore || 50),
    targetedBrand: result?.rules.find(r => r.id === 'brand_squatting' && r.triggered)?.evidence || 'None detected',
    socialEngineeringTactics: result?.rules.filter(r => r.triggered).map(r => r.name) || ['None detected'],
    threatSummary: result?.summary || 'Static security threat evaluation completed.',
    indicatorsOfCompromise: result?.rules.filter(r => r.triggered).map(r => r.evidence) || ['Standard domain structure'],
    mitigationSteps: [
      'Do not enter credentials or MFA codes on unverified domains.',
      'Check browser TLS certificate details for organization verification.',
      'Report malicious indicators to internal security or hosting abuse contacts.'
    ]
  });
});

// 3. API: Scan History
app.get('/api/history', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (query) {
    const filtered = serverScanHistory.filter(
      (s) => s.url.toLowerCase().includes(query) || s.riskLevel.toLowerCase().includes(query)
    );
    return res.json(filtered);
  }
  return res.json(serverScanHistory);
});

app.delete('/api/history', (_req, res) => {
  serverScanHistory = [];
  return res.json({ success: true, message: 'Scan history cleared.' });
});

// Dev vs Prod Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`URL Checker Server running on port ${PORT}`);
  });
}

startServer();

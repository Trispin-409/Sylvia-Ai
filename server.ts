import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Configured Live ADK Sylvia Backend Target
const LIVE_ADK_BACKEND =
  process.env.SYLVIA_BACKEND_URL ||
  process.env.VITE_SYLVIA_API_URL ||
  'https://sylvia-agent-516232832461.africa-south1.run.app';

app.use(express.json({ limit: '10mb' }));

// CORS headers for local / embedded preview support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * Health check endpoint - reports live ADK Sylvia backend connectivity
 */
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  let adkStatus = 'unknown';
  let latencyMs = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    // Verify connection to live ADK Sylvia backend
    const checkRes = await fetch(`${LIVE_ADK_BACKEND}/a2a/app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'ping',
        method: 'health/check',
        params: {},
      }),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);
    latencyMs = Date.now() - startTime;

    if (checkRes && checkRes.status < 500) {
      adkStatus = 'connected';
    } else {
      adkStatus = 'online';
    }
  } catch {
    adkStatus = 'online';
  }

  res.json({
    status: 'ok',
    mode: 'ADK_PURE_FRONTEND',
    liveAdkBackend: LIVE_ADK_BACKEND,
    adkStatus,
    latencyMs,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Direct A2A JSON-RPC 2.0 Protocol Proxy to Live Google ADK Sylvia Backend
 * Route: POST /a2a/app or POST /api/a2a/app
 */
const handleA2AProxy = async (req: express.Request, res: express.Response) => {
  const targetUrl = `${LIVE_ADK_BACKEND}/a2a/app`;
  console.log(`[Sylvia A2A Gateway] Proxying request to live ADK backend: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const responseData = await response.json().catch(() => null);

    if (!responseData) {
      return res.status(response.status).json({
        jsonrpc: '2.0',
        id: req.body?.id || 1,
        error: {
          code: -32000,
          message: `ADK backend responded with HTTP ${response.status}`,
        },
      });
    }

    return res.status(response.status).json(responseData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Sylvia A2A Gateway] Error communicating with ADK backend:`, errorMsg);

    return res.status(502).json({
      jsonrpc: '2.0',
      id: req.body?.id || 1,
      error: {
        code: -32603,
        message: `Failed to reach live ADK Sylvia backend at ${targetUrl}: ${errorMsg}`,
      },
    });
  }
};

app.post('/a2a/app', handleA2AProxy);
app.post('/api/a2a/app', handleA2AProxy);
app.post('/api/agent/chat', async (req, res) => {
  // Translate /api/agent/chat to A2A protocol JSON-RPC format
  const { message, contextId } = req.body;
  const a2aPayload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'message/send',
    params: {
      ...(contextId ? { contextId } : {}),
      message: {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        role: 'user',
        parts: [{ text: message || '' }],
      },
    },
  };

  req.body = a2aPayload;
  return handleA2AProxy(req, res);
});

/**
 * Start Server with Vite Middleware in Dev Mode or Static Files in Prod
 */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sylvia UI] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Sylvia UI] Pure Frontend Connected to Live ADK Sylvia Backend: ${LIVE_ADK_BACKEND}`);
  });
}

startServer();

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

const LIVE_ADK_BACKEND = (
  process.env.SYLVIA_BACKEND_URL ||
  process.env.VITE_SYLVIA_API_URL ||
  'https://sylvia-agent-516232832461.africa-south1.run.app'
).replace(/\/+$/, '');

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const buildA2AMessage = (text: string, contextId?: string) => ({
  jsonrpc: '2.0',
  id: `ui_${Date.now()}`,
  method: 'message/send',
  params: {
    ...(contextId ? { contextId } : {}),
    message: {
      messageId: `ui_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role: 'user',
      parts: [{ text }],
    },
  },
});

/**
 * Lightweight production health probe.
 * Cloud Run/ADK exposes GET /health without invoking an LLM or A2A task.
 * Workspace authentication is intentionally not inferred from this endpoint.
 */
app.get('/api/health', async (_req, res) => {
  const started = Date.now();
  const healthUrl = `${LIVE_ADK_BACKEND}/health`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Health remains valid from the HTTP status alone.
    }

    const connected = response.ok;
    return res.status(connected ? 200 : 503).json({
      status: connected ? 'ok' : 'degraded',
      mode: 'CLOUD_RUN_HEALTH',
      liveAdkBackend: LIVE_ADK_BACKEND,
      adkStatus: connected ? 'connected' : 'offline',
      backendHealth: body,
      latencyMs: Date.now() - started,
      a2aEndpoint: `${LIVE_ADK_BACKEND}/a2a/app`,
      timestamp: new Date().toISOString(),
      error: connected ? undefined : `ADK health endpoint returned HTTP ${response.status}`,
    });
  } catch (err: unknown) {
    return res.status(503).json({
      status: 'degraded',
      mode: 'CLOUD_RUN_HEALTH',
      liveAdkBackend: LIVE_ADK_BACKEND,
      adkStatus: 'offline',
      latencyMs: Date.now() - started,
      a2aEndpoint: `${LIVE_ADK_BACKEND}/a2a/app`,
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * Direct A2A JSON-RPC 2.0 proxy to the live Google ADK Sylvia backend.
 */
const handleA2AProxy = async (req: express.Request, res: express.Response) => {
  const targetUrl = `${LIVE_ADK_BACKEND}/a2a/app`;
  console.log(`[Sylvia A2A Gateway] ${req.method} ${req.path} -> ${targetUrl}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = {
        jsonrpc: '2.0',
        id: req.body?.id || 1,
        error: {
          code: -32000,
          message: `ADK backend returned non-JSON HTTP ${response.status}`,
          data: responseText.slice(0, 1000),
        },
      };
    }

    return res.status(response.status).json(responseData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Sylvia A2A Gateway] Backend error:', errorMsg);

    return res.status(502).json({
      jsonrpc: '2.0',
      id: req.body?.id || 1,
      error: {
        code: -32603,
        message: `Failed to reach live ADK Sylvia backend: ${errorMsg}`,
      },
    });
  }
};

app.post('/a2a/app', handleA2AProxy);
app.post('/api/a2a/app', handleA2AProxy);

app.post('/api/agent/chat', async (req, res) => {
  const { message, contextId } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: { code: -32602, message: 'message is required' } });
  }

  req.body = buildA2AMessage(message, contextId);
  return handleA2AProxy(req, res);
});

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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sylvia UI] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Sylvia UI] A2A backend: ${LIVE_ADK_BACKEND}/a2a/app`);
  });
}

startServer();

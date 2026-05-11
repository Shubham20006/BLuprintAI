const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router(path.resolve(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);

// Health check
server.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Robust prefix stripping for Vercel
server.use((req, res, next) => {
  const prefixes = ['/api/index.cjs', '/api'];
  for (const prefix of prefixes) {
    if (req.url.startsWith(prefix)) {
      req.url = req.url.replace(prefix, '');
      break;
    }
  }
  if (!req.url.startsWith('/')) req.url = '/' + req.url;
  next();
});

server.use(router);

// Ensure we always return JSON, never HTML 404s
server.use((req, res) => {
  res.status(404).json({ error: 'Resource not found', path: req.url });
});

module.exports = server;

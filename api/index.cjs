const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router(path.resolve(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);

// Add a health check
server.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running', timestamp: new Date().toISOString() });
});

// Map /api/* to the base routes
server.use(jsonServer.rewriter({
  '/api/*': '/$1',
  '/api/index.cjs/*': '/$1'
}));

server.use(router);

module.exports = server;

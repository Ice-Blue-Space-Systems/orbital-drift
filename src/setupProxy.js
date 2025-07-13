// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  console.log("🔧 Setting up proxies...");
  
  app.use(
    "/n2yo",
    createProxyMiddleware({
      target: "https://api.n2yo.com",
      changeOrigin: true,
      pathRewrite: {
        "^/n2yo": "", // Remove "/n2yo" from the request path
      },
    })
  );

  // Proxy for local backend API - preserve full path including /api
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000/api',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api from request since target already includes it
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🚀 Proxying: ${req.method} ${req.url} -> http://localhost:5000/api${req.url.replace('/api', '')}`);
      },
      onError: (err, req, res) => {
        console.log("❌ Proxy error:", err.message);
      }
    })
  );
  
  console.log("✅ Proxies configured!");
};
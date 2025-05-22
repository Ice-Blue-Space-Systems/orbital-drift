// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
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
};
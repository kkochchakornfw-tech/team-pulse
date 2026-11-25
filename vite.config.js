import { defineConfig } from "vite";

// In development the same API that runs on Vercel is mounted on the Vite server at /api,
// using a JSON file in .data/ instead of Postgres and showing emails on screen instead of sending them.
export default defineConfig({
  server: { port: 5180, strictPort: true, open: false },
  plugins: [{
    name: "team-pulse-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith("/api/")) return next();
        const { handle } = await server.ssrLoadModule("/server/app.js");
        handle(req, res);
      });
    },
  }],
});

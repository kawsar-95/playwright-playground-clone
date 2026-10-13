import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { apiPlugin } from "./server/api";

/** Serve /embeds/<name>/ and /popups/<name>/ from public/embeds/<name>/index.html instead of the SPA fallback. */
const embedsMiddleware: Connect.NextHandleFunction = (req, _res, next) => {
  if (req.url && /^\/(embeds|popups)\/[^/?]+\/(\?.*)?$/.test(req.url)) {
    req.url = req.url.replace(/\/(\?|$)/, "/index.html$1");
  }
  next();
};

function embedsPlugin(): Plugin {
  return {
    name: "embeds-directory-index",
    configureServer(server) {
      server.middlewares.use(embedsMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(embedsMiddleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin(), embedsPlugin()],
});

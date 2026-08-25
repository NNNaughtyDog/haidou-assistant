import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const server = await createServer({
  root: path.resolve(import.meta.dirname, ".."),
  configFile: path.resolve(import.meta.dirname, "../vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true },
});

try {
  const appPath = path.resolve(import.meta.dirname, "../../app/page.tsx");
  const { default: App } = await server.ssrLoadModule(`/@fs/${appPath}`);
  const markup = renderToString(React.createElement(App));

  if (!markup.includes("海斗助手")) {
    throw new Error("rendered markup is missing the app shell");
  }

  console.log("React render smoke test passed");
} finally {
  await server.close();
}

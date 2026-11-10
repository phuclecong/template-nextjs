import { spawn } from "node:child_process"
import { watch } from "node:fs"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"
import { createRequire } from "node:module"
import { basename, dirname, extname, join, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Serves `openapi.yaml` in a Swagger UI page and opens it in the browser.
 * Read-only: there is no backend, so "Try it out" will not execute.
 *
 * Usage:  pnpm --filter @workspace/api view-openapi [--no-open]
 * Env:    OPENAPI_PORT (default 8010)
 */

const require = createRequire(import.meta.url)
const swaggerUiDir = dirname(require.resolve("swagger-ui-dist/package.json"))
const scriptDir = dirname(fileURLToPath(import.meta.url))
const specFile = join(scriptDir, "..", "openapi.yaml")

const port = Number(process.env.OPENAPI_PORT) || 8010
const shouldOpen = !process.argv.includes("--no-open")

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
}

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Template Dashboard API</title>
    <link rel="stylesheet" href="/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/swagger-ui-bundle.js"></script>
    <script src="/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: "StandaloneLayout",
        })
      }
      new EventSource("/__reload").onmessage = () => location.reload()
    </script>
  </body>
</html>
`

const reloadClients = new Set()

function notifyReload() {
  for (const res of reloadClients) res.write("data: reload\n\n")
}

function openBrowser(url) {
  const [cmd, args] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]]
  spawn(cmd, args, { detached: true, stdio: "ignore" }).unref()
}

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname)

    if (pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(INDEX_HTML)
      return
    }

    if (pathname === "/openapi.yaml") {
      res.writeHead(200, { "Content-Type": "text/yaml; charset=utf-8" })
      res.end(await readFile(specFile))
      return
    }

    if (pathname === "/__reload") {
      res.writeHead(200, {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
      })
      res.write("retry: 1000\n\n")
      reloadClients.add(res)
      req.on("close", () => reloadClients.delete(res))
      return
    }

    // Static Swagger UI assets, confined to the installed dist directory.
    const filePath = resolve(swaggerUiDir, `.${pathname}`)
    if (!filePath.startsWith(swaggerUiDir + sep)) {
      res.writeHead(403)
      res.end("Forbidden")
      return
    }
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream" })
    res.end(await readFile(filePath))
  } catch (err) {
    if (err.code === "ENOENT") {
      res.writeHead(404)
      res.end("Not found")
      return
    }
    res.writeHead(500)
    res.end("Internal server error")
  }
})

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Choose another with OPENAPI_PORT.`)
    process.exit(1)
  }
  throw err
})

server.listen(port, () => {
  const url = `http://localhost:${port}`
  console.log(`Viewing OpenAPI spec: ${specFile}`)
  console.log(`Swagger UI: ${url}`)
  if (shouldOpen) openBrowser(url)
})

// Watch the directory (not the file) so atomic-save editors still trigger reload.
watch(dirname(specFile), (_event, filename) => {
  if (filename === basename(specFile)) notifyReload()
})

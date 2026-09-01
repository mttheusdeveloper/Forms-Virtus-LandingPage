import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import submitBriefingHandler from './api/briefing/submit.js'
import uploadBriefingHandler from './api/briefing/upload.js'

type LocalApiRequest = IncomingMessage & { body?: unknown; query?: Record<string, string> }
type LocalApiResponse = ServerResponse & {
  status: (code: number) => LocalApiResponse
  json: (payload: unknown) => void
}

function apiResponse(response: ServerResponse): LocalApiResponse {
  const localResponse = response as LocalApiResponse
  localResponse.status = (code) => {
    localResponse.statusCode = code
    return localResponse
  }
  localResponse.json = (payload) => {
    localResponse.setHeader('Content-Type', 'application/json; charset=utf-8')
    localResponse.end(JSON.stringify(payload))
  }
  return localResponse
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  let totalBytes = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length
    if (totalBytes > 1024 * 1024) throw new Error('Payload muito grande.')
    chunks.push(buffer)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function localBriefingApi(): Plugin {
  return {
    name: 'local-briefing-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/briefing/submit', async (request, response) => {
        const localRequest = request as LocalApiRequest
        try {
          localRequest.body = await readJsonBody(localRequest)
          await submitBriefingHandler(localRequest, apiResponse(response))
        } catch (error) {
          apiResponse(response).status(400).json({ error: error instanceof Error ? error.message : 'Dados inválidos.' })
        }
      })

      server.middlewares.use('/api/briefing/upload', async (request, response) => {
        const localRequest = request as LocalApiRequest
        const searchParams = new URL(localRequest.url ?? '/', 'http://localhost').searchParams
        localRequest.query = Object.fromEntries(searchParams.entries())
        await uploadBriefingHandler(localRequest, apiResponse(response))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  for (const key of ['BRIEFING_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [localBriefingApi(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // Porta fixa: o OAuth do Google exige que a origem cadastrada no Cloud
    // Console bata exatamente com a porta em uso — sem isso, cada "npm run dev"
    // com a porta padrão ocupada pulava para outra porta e quebrava o login.
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})

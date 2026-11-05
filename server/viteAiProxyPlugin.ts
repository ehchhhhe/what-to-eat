/**
 * Vite 开发 / 预览服务器上的代理中间件。
 *
 * 让本地 `npm run dev`、`npm run preview` 也能走和线上一致的同源代理，
 * 密钥从 .env（不带 VITE_ 前缀，因此不会注入到浏览器）中读取。
 */
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { handleProxyRequest, PROXY_PREFIX } from './aiProxy'

const readBody = (req: IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        req.on('error', reject)
    })

export const aiProxyPlugin = (): Plugin => {
    let serverEnv: Record<string, string> = {}

    const middleware = async (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
        const path = req.url || ''
        if (!path.startsWith(PROXY_PREFIX)) {
            next()
            return
        }

        try {
            const method = req.method || 'GET'
            const body = method === 'POST' ? await readBody(req) : undefined
            const forwardedFor = (req.headers['x-forwarded-for'] as string) || undefined

            const result = await handleProxyRequest(
                {
                    method,
                    path,
                    origin: (req.headers.origin as string) || undefined,
                    host: (req.headers.host as string) || undefined,
                    clientIp: forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket?.remoteAddress || 'local',
                    body
                },
                { ...process.env, ...serverEnv }
            )

            res.writeHead(result.status, result.headers)

            if (result.stream) {
                Readable.fromWeb(result.stream as any).pipe(res)
                return
            }

            res.end(result.body ?? '')
        } catch (error) {
            console.error('[ai-proxy] 本地代理异常:', error)
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
            }
            res.end(JSON.stringify({ error: 'proxy_error', message: '本地代理异常' }))
        }
    }

    return {
        name: 'yffs-ai-proxy',
        configResolved(config) {
            // 第三个参数传空字符串：加载全部变量（含不带 VITE_ 前缀的服务端变量）
            serverEnv = loadEnv(config.mode, config.envDir || process.cwd(), '') as Record<string, string>
        },
        configureServer(server) {
            server.middlewares.use(middleware)
        },
        configurePreviewServer(server) {
            server.middlewares.use(middleware)
        }
    }
}

/**
 * Vercel Serverless Function
 *
 * 路由：/api/ai/*
 * 密钥从 Vercel 项目的环境变量读取，不会进入前端构建产物。
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { handleProxyRequest } from '../../../server/aiProxy'

// 关闭 Vercel 的自动 body 解析，代理需要原样转发请求体（含流式请求）
export const config = {
    api: {
        bodyParser: false
    }
}

const readBody = (req: IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        req.on('error', reject)
    })

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    const method = req.method || 'GET'
    const path = req.url || '/'
    const body = method === 'POST' ? await readBody(req) : undefined
    const forwardedFor = (req.headers['x-forwarded-for'] as string) || undefined

    const result = await handleProxyRequest(
        {
            method,
            path,
            origin: (req.headers.origin as string) || undefined,
            host: (req.headers.host as string) || undefined,
            clientIp: forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers['x-real-ip'] as string) || undefined,
            body
        },
        process.env
    )

    res.writeHead(result.status, result.headers)

    if (result.stream) {
        Readable.fromWeb(result.stream as any).pipe(res)
        return
    }

    res.end(result.body ?? '')
}

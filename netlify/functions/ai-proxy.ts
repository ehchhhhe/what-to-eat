/**
 * Netlify Function（Functions 2.0）
 *
 * 部署到 Netlify 后自动接管 /api/ai/*，密钥来自站点的环境变量，
 * 不会被打进前端产物。本地开发时由 Vite 中间件提供同样能力。
 */
import { handleProxyRequest } from '../../server/aiProxy'

export default async (req: Request): Promise<Response> => {
    const url = new URL(req.url)
    const body = req.method === 'POST' ? await req.text() : undefined
    const forwardedFor = req.headers.get('x-forwarded-for') || undefined

    const result = await handleProxyRequest(
        {
            method: req.method,
            path: url.pathname,
            origin: req.headers.get('origin') || undefined,
            host: req.headers.get('host') || url.host,
            clientIp: req.headers.get('x-nf-client-connection-ip') || forwardedFor || url.hostname,
            body
        },
        process.env
    )

    if (result.stream) {
        return new Response(result.stream, { status: result.status, headers: result.headers })
    }

    return new Response(result.body, { status: result.status, headers: result.headers })
}

export const config = {
    path: '/api/ai/*'
}

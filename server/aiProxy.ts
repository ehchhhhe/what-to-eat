/**
 * 服务端 AI 代理（核心实现）
 *
 * 目的：模型配置（尤其是 API Key）只存在于服务端环境变量中，
 * 浏览器只能拿到同源地址 /api/ai/*，构建产物里不会出现任何密钥。
 *
 * 该文件不依赖任何框架，也不依赖 Node 专有 API（只用全局 fetch），
 * 因此可以同时被 Netlify Functions、Vercel Functions 和 Vite 开发服务器复用。
 */

export type ServerEnv = Record<string, string | undefined>

/** 归一化后的请求 */
export interface ProxyRequestInput {
    method: string
    /** 原始路径，例如 /api/ai/text/chat/completions */
    path: string
    origin?: string
    host?: string
    clientIp?: string
    body?: string
}

export interface ProxyResult {
    status: number
    headers: Record<string, string>
    body: string | null
    stream?: any
}

export const PROXY_PREFIX = '/api/ai'

const DEFAULT_TEXT_BASE_URL = 'https://api.302ai.cn/v1/'
const DEFAULT_TEXT_MODEL = 'doubao-1.5-pro-32k'
const DEFAULT_IMAGE_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/images/generations'
const DEFAULT_IMAGE_MODEL = 'cogview-3-flash'
const DEFAULT_VISION_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/'
const DEFAULT_VISION_MODEL = 'GLM-4.1V-Thinking-Flash'

const joinUrl = (base: string, path: string): string => {
    const b = base.replace(/\/+$/, '')
    const p = path.replace(/^\/+/, '')
    return `${b}/${p}`
}

const jsonResult = (status: number, payload: unknown): ProxyResult => ({
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify(payload)
})

const notConfigured = (name: string): ProxyResult =>
    jsonResult(501, {
        error: 'server_not_configured',
        message: `服务端尚未配置 ${name} 的模型密钥，请在部署平台配置环境变量，或在设置中填写自己的密钥。`
    })

interface UpstreamRoute {
    kind: 'text' | 'image' | 'vision'
    url: string
    apiKey: string
    model: string
    maxBodyBytes: number
    rateLimitPerMinute: number
}

/**
 * 只有白名单里的路径会被转发，避免代理被当成任意 URL 的跳板。
 */
const resolveRoute = (subPath: string, env: ServerEnv): UpstreamRoute | null => {
    const path = subPath.replace(/\/+$/, '')

    if (path === '/text/chat/completions' || path === '/text/chat/completions/') {
        return {
            kind: 'text',
            url: joinUrl(env.TEXT_GENERATION_BASE_URL || DEFAULT_TEXT_BASE_URL, 'chat/completions'),
            apiKey: env.TEXT_GENERATION_API_KEY || '',
            model: env.TEXT_GENERATION_MODEL || DEFAULT_TEXT_MODEL,
            maxBodyBytes: 1 * 1024 * 1024,
            rateLimitPerMinute: 60
        }
    }

    if (path === '/image/generations') {
        return {
            kind: 'image',
            url: env.IMAGE_GENERATION_BASE_URL || DEFAULT_IMAGE_BASE_URL,
            apiKey: env.IMAGE_GENERATION_API_KEY || '',
            model: env.IMAGE_GENERATION_MODEL || DEFAULT_IMAGE_MODEL,
            maxBodyBytes: 1 * 1024 * 1024,
            rateLimitPerMinute: 10
        }
    }

    if (path === '/vision/chat/completions') {
        return {
            kind: 'vision',
            url: joinUrl(env.VISION_BASE_URL || DEFAULT_VISION_BASE_URL, 'chat/completions'),
            // 视觉识别默认复用图片服务的密钥（通常同为智谱），可用 VISION_API_KEY 单独覆盖
            apiKey: env.VISION_API_KEY || env.IMAGE_GENERATION_API_KEY || '',
            model: env.VISION_MODEL || DEFAULT_VISION_MODEL,
            maxBodyBytes: 12 * 1024 * 1024,
            rateLimitPerMinute: 15
        }
    }

    return null
}

// ---------------------------------------------------------------------------
// 简易限流（单实例内存计数，只用于挡住明显的滥用，不追求精确）
// ---------------------------------------------------------------------------

const buckets = new Map<string, { count: number; resetAt: number }>()

const isRateLimited = (key: string, limitPerMinute: number): boolean => {
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + 60_000 })
        return false
    }

    bucket.count += 1
    return bucket.count > limitPerMinute
}

// 定期清理，避免长期运行的内存增长
const cleanupTimer: any = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key)
    }
}, 5 * 60_000)
// 允许进程自然退出，不阻塞服务
cleanupTimer?.unref?.()

const byteLength = (text: string): number => new TextEncoder().encode(text).length

// ---------------------------------------------------------------------------
// 请求体处理
// ---------------------------------------------------------------------------

const sanitizePayload = (raw: string, route: UpstreamRoute): Record<string, any> | null => {
    let payload: Record<string, any>
    try {
        payload = JSON.parse(raw)
    } catch {
        return null
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null

    // 模型名一律以服务端配置为准，客户端无法指定
    payload.model = route.model

    // 只接受有限的温度范围，防止异常参数
    if (typeof payload.temperature === 'number') {
        payload.temperature = Math.min(Math.max(payload.temperature, 0), 2)
    }
    if (typeof payload.max_tokens === 'number') {
        payload.max_tokens = Math.min(Math.max(Math.floor(payload.max_tokens), 1), 8192)
    }

    return payload
}

// ---------------------------------------------------------------------------
// 主处理函数
// ---------------------------------------------------------------------------

export const handleProxyRequest = async (input: ProxyRequestInput, env: ServerEnv): Promise<ProxyResult> => {
    const pathname = (input.path || '').split('?')[0]

    // 兼容被 rewrite 到 /.netlify/functions/ai-proxy 的情况
    let normalized = pathname
    if (normalized.startsWith('/.netlify/functions/')) {
        const idx = normalized.indexOf('/ai-proxy')
        normalized = idx >= 0 ? PROXY_PREFIX + normalized.slice(idx + '/ai-proxy'.length) : normalized
    }

    if (!normalized.startsWith(PROXY_PREFIX)) {
        return jsonResult(404, { error: 'not_found', message: '未知的代理路径' })
    }

    const subPath = normalized.slice(PROXY_PREFIX.length) || '/'

    // 健康检查：前端用来判断服务端是否已经配好密钥
    if (subPath === '/health' || subPath === '/health/') {
        return jsonResult(200, {
            ok: true,
            routes: {
                text: Boolean(env.TEXT_GENERATION_API_KEY),
                image: Boolean(env.IMAGE_GENERATION_API_KEY),
                vision: Boolean(env.VISION_API_KEY || env.IMAGE_GENERATION_API_KEY)
            }
        })
    }

    if (input.method === 'OPTIONS') {
        return { status: 204, headers: { 'Cache-Control': 'no-store' }, body: null }
    }

    if (input.method !== 'POST') {
        return jsonResult(405, { error: 'method_not_allowed', message: '仅支持 POST 请求' })
    }

    // 同源校验：拒绝被其它站点当作免费网关使用
    if (input.origin && input.host) {
        try {
            const originHost = new URL(input.origin).host
            if (originHost !== input.host) {
                return jsonResult(403, { error: 'forbidden_origin', message: '不允许跨站调用' })
            }
        } catch {
            return jsonResult(403, { error: 'forbidden_origin', message: '非法的 Origin' })
        }
    }

    const route = resolveRoute(subPath, env)
    if (!route) {
        return jsonResult(404, { error: 'not_found', message: '未知的代理路径' })
    }

    if (isRateLimited(`${route.kind}:${input.clientIp || 'unknown'}`, route.rateLimitPerMinute)) {
        return jsonResult(429, { error: 'rate_limited', message: '请求太频繁了，请稍后再试' })
    }

    if (!route.apiKey) {
        return notConfigured(route.kind)
    }

    const rawBody = input.body || ''
    if (!rawBody) {
        return jsonResult(400, { error: 'empty_body', message: '请求体为空' })
    }
    if (byteLength(rawBody) > route.maxBodyBytes) {
        return jsonResult(413, { error: 'payload_too_large', message: '请求体过大' })
    }

    const payload = sanitizePayload(rawBody, route)
    if (!payload) {
        return jsonResult(400, { error: 'invalid_json', message: '请求体不是合法的 JSON 对象' })
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timeoutMs = route.kind === 'image' ? 180_000 : 300_000
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null

    try {
        const upstream = await fetch(route.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: payload.stream ? 'text/event-stream' : 'application/json',
                Authorization: `Bearer ${route.apiKey}`
            },
            body: JSON.stringify(payload),
            signal: controller ? controller.signal : undefined
        })

        const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8'

        // 流式响应（SSE）原样透传，保证前端打字机效果
        if (upstream.ok && contentType.includes('text/event-stream') && upstream.body) {
            if (timer) clearTimeout(timer)
            return {
                status: upstream.status,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'no-store',
                    'X-Accel-Buffering': 'no'
                },
                body: null,
                stream: upstream.body
            }
        }

        const text = await upstream.text()
        if (timer) clearTimeout(timer)

        return {
            status: upstream.status,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store'
            },
            body: text
        }
    } catch (error) {
        if (timer) clearTimeout(timer)
        const aborted = error instanceof Error && error.name === 'AbortError'
        console.error('[ai-proxy] 上游请求失败:', error)
        return jsonResult(aborted ? 504 : 502, {
            error: aborted ? 'upstream_timeout' : 'upstream_unreachable',
            message: aborted ? '模型服务响应超时，请稍后重试' : '模型服务暂时不可用，请稍后重试'
        })
    }
}

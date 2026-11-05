import { useSettingsStore, BUILTIN_VISION_URL } from '../stores/settings'

/** 拼接 baseUrl 与路径，兼容用户填写的地址是否带结尾斜杠 */
const joinPath = (baseUrl, path) => {
    const base = (baseUrl || '').replace(/\/+$/, '')
    const suffix = path.replace(/^\/+/, '')
    return `${base}/${suffix}`
}

/** 内置模式不携带任何鉴权头，密钥由服务端代理补齐 */
const buildAuthHeader = apiKey => (apiKey ? { Authorization: `Bearer ${apiKey}` } : {})

// 获取文本生成API配置
export const getTextGenerationConfig = () => {
    const settingsStore = useSettingsStore()
    return settingsStore.getTextGenerationConfig()
}

// 获取图片生成API配置
export const getImageGenerationConfig = () => {
    const settingsStore = useSettingsStore()
    return settingsStore.getImageGenerationConfig()
}

/**
 * 获取图片识别（视觉模型）配置
 *
 * 自定义模式下复用「菜谱生成」那组配置：视觉识别本质上也是一次 chat/completions，
 * 用户既然填了地址和密钥，就没有理由再让他单独配一遍。
 * 内置模式下继续走服务端代理，前端不持有密钥。
 */
export const getVisionConfig = () => {
    const settingsStore = useSettingsStore()

    if (settingsStore.getMode() === 'custom') {
        const textConfig = settingsStore.getTextGenerationConfig()
        return {
            mode: 'custom',
            url: textConfig.baseUrl ? joinPath(textConfig.baseUrl, 'chat/completions') : '',
            apiKey: textConfig.apiKey || '',
            model: textConfig.model || ''
        }
    }

    return {
        mode: 'builtin',
        url: BUILTIN_VISION_URL,
        apiKey: '',
        model: ''
    }
}

// 创建文本生成API请求配置
export const createTextGenerationRequest = (messages, options = {}) => {
    const config = getTextGenerationConfig()

    return {
        url: joinPath(config.baseUrl, 'chat/completions'),
        headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeader(config.apiKey)
        },
        data: {
            ...(config.model ? { model: config.model } : {}),
            messages: messages,
            temperature: config.temperature,
            ...options
        },
        timeout: config.timeout
    }
}

// 创建图片生成API请求配置
export const createImageGenerationRequest = (prompt, options = {}) => {
    const config = getImageGenerationConfig()

    return {
        url: config.baseUrl,
        headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeader(config.apiKey)
        },
        data: {
            ...(config.model ? { model: config.model } : {}),
            prompt: prompt,
            ...options
        }
    }
}

// 验证配置是否完整（内置模式只需服务端已配置）
export const validateTextGenerationConfig = () => {
    const config = getTextGenerationConfig()
    if (config.mode === 'builtin') return true
    return !!(config.baseUrl && config.apiKey && config.model)
}

export const validateImageGenerationConfig = () => {
    const config = getImageGenerationConfig()
    if (config.mode === 'builtin') return true
    return !!(config.baseUrl && config.apiKey && config.model)
}

/** 判断一次失败的请求是否因为服务端未配置密钥 */
export const isServerNotConfigured = error => {
    const data = error?.response?.data
    return error?.response?.status === 501 && data && data.error === 'server_not_configured'
}

/** 服务端未配置模型时广播的事件名，由设置入口监听并弹出配置面板 */
export const NOT_CONFIGURED_EVENT = 'ai-not-configured'

/**
 * 通知界面「服务端没配模型」，让用户能一键去填自己的密钥。
 * 用事件而不是直接改组件状态，是因为调用点分散在 service / view 各处。
 */
export const notifyNotConfigured = (kind = 'text') => {
    if (typeof window === 'undefined') return
    try {
        window.dispatchEvent(new CustomEvent(NOT_CONFIGURED_EVENT, { detail: { kind } }))
    } catch {
        /* 忽略事件派发失败 */
    }
}

/** 统一的「没配置」错误文案 */
export const getNotConfiguredMessage = kind => {
    if (kind === 'image') return '站点未配置图片生成模型，请在设置里填写你自己的密钥'
    if (kind === 'vision') return '站点未配置图片识别模型，请在设置里填写你自己的密钥'
    return '站点未配置模型服务，请在设置里填写你自己的密钥'
}

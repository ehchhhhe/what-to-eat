import { useSettingsStore } from '../stores/settings'

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

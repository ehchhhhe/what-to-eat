import { reactive } from 'vue'

/**
 * 设置中心
 *
 * 重要：前端不再从环境变量读取任何 API Key / 模型名。
 * 默认走站点内置的服务端代理（/api/ai/*），密钥保存在部署平台的环境变量里，
 * 因此打包产物中不会出现任何模型配置。
 *
 * 只有用户主动选择「自定义密钥」时，密钥才会被用户自己填进浏览器 localStorage，
 * 这属于用户本机的数据，与构建产物无关。
 */

/** 服务端代理的固定入口（与 server/aiProxy.ts 保持一致） */
export const BUILTIN_TEXT_BASE_URL = '/api/ai/text'
export const BUILTIN_IMAGE_BASE_URL = '/api/ai/image/generations'
export const BUILTIN_VISION_URL = '/api/ai/vision/chat/completions'

/** 新的存储键；旧键里可能残留着被编译进来的密钥，需要清掉 */
const STORAGE_KEY = 'yifan-fengshen-settings-v2'
const LEGACY_STORAGE_KEYS = ['yifan-fengshen-settings', 'yifan-fengshen-env-snapshot']

// 允许通过公开环境变量（非敏感）微调默认行为
const DEFAULT_TEMPERATURE = parseFloat(import.meta.env.VITE_AI_TEMPERATURE) || 0.7
const DEFAULT_TIMEOUT = parseInt(import.meta.env.VITE_AI_TIMEOUT) || 300000

const purgeLegacyStorage = () => {
    LEGACY_STORAGE_KEYS.forEach(key => {
        try {
            localStorage.removeItem(key)
        } catch {
            /* 忽略隐私模式下的异常 */
        }
    })
}

const getDefaultSettings = () => ({
    // builtin: 使用站点内置代理；custom: 使用用户自己填写的服务商与密钥
    mode: 'builtin',
    textGeneration: {
        baseUrl: BUILTIN_TEXT_BASE_URL,
        apiKey: '',
        model: '',
        temperature: DEFAULT_TEMPERATURE,
        timeout: DEFAULT_TIMEOUT
    },
    imageGeneration: {
        baseUrl: BUILTIN_IMAGE_BASE_URL,
        apiKey: '',
        model: ''
    }
})

let settingsInstance = null

export const useSettingsStore = () => {
    if (!settingsInstance) {
        purgeLegacyStorage()

        const loadSettings = () => {
            const defaults = getDefaultSettings()
            try {
                const saved = localStorage.getItem(STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    const mode = parsed.mode === 'custom' ? 'custom' : 'builtin'
                    return {
                        mode,
                        textGeneration: { ...defaults.textGeneration, ...(parsed.textGeneration || {}) },
                        imageGeneration: { ...defaults.imageGeneration, ...(parsed.imageGeneration || {}) }
                    }
                }
            } catch (error) {
                console.warn('加载设置失败，使用默认设置:', error)
            }
            return defaults
        }

        const settings = reactive(loadSettings())

        const saveToStorage = () => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
            } catch (error) {
                console.error('保存设置失败:', error)
            }
        }

        // 内置模式下对外暴露的配置：地址固定指向代理，不携带任何密钥
        const buildTextConfig = () => {
            if (settings.mode === 'custom') {
                return {
                    mode: 'custom',
                    baseUrl: settings.textGeneration.baseUrl || '',
                    apiKey: settings.textGeneration.apiKey || '',
                    model: settings.textGeneration.model || '',
                    temperature: Number(settings.textGeneration.temperature) || DEFAULT_TEMPERATURE,
                    timeout: Number(settings.textGeneration.timeout) || DEFAULT_TIMEOUT
                }
            }
            return {
                mode: 'builtin',
                baseUrl: BUILTIN_TEXT_BASE_URL,
                apiKey: '',
                model: '',
                temperature: Number(settings.textGeneration.temperature) || DEFAULT_TEMPERATURE,
                timeout: Number(settings.textGeneration.timeout) || DEFAULT_TIMEOUT
            }
        }

        const buildImageConfig = () => {
            if (settings.mode === 'custom') {
                return {
                    mode: 'custom',
                    baseUrl: settings.imageGeneration.baseUrl || '',
                    apiKey: settings.imageGeneration.apiKey || '',
                    model: settings.imageGeneration.model || ''
                }
            }
            return {
                mode: 'builtin',
                baseUrl: BUILTIN_IMAGE_BASE_URL,
                apiKey: '',
                model: ''
            }
        }

        settingsInstance = {
            getSettings: () => settings,

            getMode: () => settings.mode,

            /** 是否使用站点内置的模型服务 */
            isBuiltinMode: () => settings.mode !== 'custom',

            getTextGenerationConfig: () => buildTextConfig(),

            getImageGenerationConfig: () => buildImageConfig(),

            updateSettings: newSettings => {
                if (newSettings.mode) {
                    settings.mode = newSettings.mode === 'custom' ? 'custom' : 'builtin'
                }
                if (newSettings.textGeneration) {
                    Object.assign(settings.textGeneration, newSettings.textGeneration)
                }
                if (newSettings.imageGeneration) {
                    Object.assign(settings.imageGeneration, newSettings.imageGeneration)
                }
                // 回到内置模式时清空本地保存的密钥，避免无意义地留在浏览器里
                if (settings.mode === 'builtin') {
                    settings.textGeneration.apiKey = ''
                    settings.imageGeneration.apiKey = ''
                }
                saveToStorage()
            },

            updateTextGenerationConfig: config => {
                Object.assign(settings.textGeneration, config)
                saveToStorage()
            },

            updateImageGenerationConfig: config => {
                Object.assign(settings.imageGeneration, config)
                saveToStorage()
            },

            /** 重置为默认（内置服务） */
            resetToDefault: () => {
                const defaults = getDefaultSettings()
                settings.mode = defaults.mode
                Object.assign(settings.textGeneration, defaults.textGeneration)
                Object.assign(settings.imageGeneration, defaults.imageGeneration)
                saveToStorage()
            },

            clearSettings: () => {
                try {
                    localStorage.removeItem(STORAGE_KEY)
                } catch (error) {
                    console.error('清除设置失败:', error)
                }
                const defaults = getDefaultSettings()
                settings.mode = defaults.mode
                Object.assign(settings.textGeneration, defaults.textGeneration)
                Object.assign(settings.imageGeneration, defaults.imageGeneration)
            }
        }
    }

    return settingsInstance
}

export type ServiceMode = 'builtin' | 'custom'

export interface TextGenerationConfig {
    mode: ServiceMode
    baseUrl: string
    apiKey: string
    model: string
    temperature: number
    timeout: number
}

export interface ImageGenerationConfig {
    mode: ServiceMode
    baseUrl: string
    apiKey: string
    model: string
}

export interface SettingsState {
    mode: ServiceMode
    textGeneration: {
        baseUrl: string
        apiKey: string
        model: string
        temperature: number
        timeout: number
    }
    imageGeneration: {
        baseUrl: string
        apiKey: string
        model: string
    }
}

export interface SettingsStore {
    getSettings(): SettingsState
    getMode(): ServiceMode
    isBuiltinMode(): boolean
    getTextGenerationConfig(): TextGenerationConfig
    getImageGenerationConfig(): ImageGenerationConfig
    updateSettings(newSettings: Partial<SettingsState>): void
    updateTextGenerationConfig(config: Partial<SettingsState['textGeneration']>): void
    updateImageGenerationConfig(config: Partial<SettingsState['imageGeneration']>): void
    resetToDefault(): void
    clearSettings(): void
}

/** 服务端代理入口（与 server/aiProxy.ts 保持一致） */
export declare const BUILTIN_TEXT_BASE_URL: string
export declare const BUILTIN_IMAGE_BASE_URL: string
export declare const BUILTIN_VISION_URL: string

export declare function useSettingsStore(): SettingsStore

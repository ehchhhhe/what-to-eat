export interface TextGenerationConfig {
    mode: 'builtin' | 'custom'
    baseUrl: string
    apiKey: string
    model: string
    temperature: number
    timeout: number
}

export interface ImageGenerationConfig {
    mode: 'builtin' | 'custom'
    baseUrl: string
    apiKey: string
    model: string
}

export interface ApiRequestConfig {
    url: string
    headers: Record<string, string>
    data: Record<string, any>
    timeout?: number
}

export interface VisionConfig {
    mode: 'builtin' | 'custom'
    /** 完整的 chat/completions 地址，内置模式下指向服务端代理 */
    url: string
    apiKey: string
    model: string
}

export declare function getTextGenerationConfig(): TextGenerationConfig
export declare function getImageGenerationConfig(): ImageGenerationConfig
export declare function getVisionConfig(): VisionConfig
export declare function createTextGenerationRequest(messages: any[], options?: Record<string, any>): ApiRequestConfig
export declare function createImageGenerationRequest(prompt: string, options?: Record<string, any>): ApiRequestConfig
export declare function validateTextGenerationConfig(): boolean
export declare function validateImageGenerationConfig(): boolean
export declare function isServerNotConfigured(error: unknown): boolean
export declare const NOT_CONFIGURED_EVENT: string
export declare function notifyNotConfigured(kind?: 'text' | 'image' | 'vision'): void
export declare function getNotConfiguredMessage(kind?: string): string

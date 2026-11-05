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

export declare function getTextGenerationConfig(): TextGenerationConfig
export declare function getImageGenerationConfig(): ImageGenerationConfig
export declare function createTextGenerationRequest(messages: any[], options?: Record<string, any>): ApiRequestConfig
export declare function createImageGenerationRequest(prompt: string, options?: Record<string, any>): ApiRequestConfig
export declare function validateTextGenerationConfig(): boolean
export declare function validateImageGenerationConfig(): boolean
export declare function isServerNotConfigured(error: unknown): boolean

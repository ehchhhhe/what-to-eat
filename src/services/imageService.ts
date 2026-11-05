import type { Recipe } from '@/types'
import { getImageGenerationConfig, getNotConfiguredMessage, notifyNotConfigured } from '@/utils/apiConfig'

export interface GeneratedImage {
    url: string
    id: string
}

export const generateRecipeImage = async (recipe: Recipe): Promise<GeneratedImage> => {
    // 从设置中获取图片生成配置
    const config = getImageGenerationConfig()

    // 自定义模式下用户可能只填了文本服务，没有填图片服务
    // 此时不能带着空地址发请求（fetch('') 会请求当前页面本身）
    if (!config.baseUrl) {
        throw new Error('尚未配置图片生成服务。菜谱配图与菜谱生成是两个不同的服务，请在设置中填写图片生成的地址、密钥和模型')
    }

    // 构建图片生成的提示词
    const prompt = buildImagePrompt(recipe)

    const sizeToUse = { width: 1152, height: 896 }

    try {
        const response = await fetch(config.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 内置模式下由服务端代理补上鉴权，前端不持有密钥
                ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
            },
            body: JSON.stringify({
                ...(config.model ? { model: config.model } : {}),
                prompt: prompt,
                size: `${sizeToUse.width}x${sizeToUse.height}`,
                n: 1,
                style: 'vivid',
                quality: 'hd'
            })
        })

        if (!response.ok) {
            if (response.status === 501) {
                notifyNotConfigured('image')
                throw new Error(getNotConfiguredMessage('image'))
            }
            throw new Error(`API请求失败: ${response.status}`)
        }

        const data = await response.json()

        if (data.data && data.data.length > 0) {
            return {
                url: data.data[0].url,
                id: `${recipe.id}-${Date.now()}`
            }
        } else {
            throw new Error('API返回数据格式错误')
        }
    } catch (error) {
        console.error('生成图片失败:', error)
        throw error
    }
}

const buildImagePrompt = (recipe: Recipe): string => {
    // 根据菜谱信息构建详细的图片生成提示词
    const ingredients = recipe.ingredients.join('、')
    const cuisineStyle = recipe.cuisine.replace('大师', '').replace('菜', '')

    return `一道精美的${cuisineStyle}菜肴：${recipe.name}，主要食材包括${ingredients}。菜品摆盘精致，色彩丰富，光线柔和，专业美食摄影风格，高清画质，餐厅级别的视觉效果。背景简洁，突出菜品本身的美感。`
}

<template>
    <div class="bg-white rounded-lg p-4 border border-gray-200">
        <h3 class="text-lg font-semibold mb-4">配置测试</h3>

        <div class="space-y-4">
            <!-- 当前配置显示 -->
            <div class="bg-gray-50 rounded-lg p-3">
                <h4 class="font-medium text-gray-800 mb-2">当前文本生成配置</h4>
                <div class="text-sm text-gray-600 space-y-1">
                    <div>模式: {{ textConfig.mode === 'custom' ? '自定义密钥' : '内置服务（密钥在服务端）' }}</div>
                    <div>API地址: {{ textConfig.baseUrl }}</div>
                    <div>模型: {{ textConfig.model || '由服务端决定' }}</div>
                    <div>温度: {{ textConfig.temperature }}</div>
                    <div>超时: {{ textConfig.timeout }}ms</div>
                </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-3">
                <h4 class="font-medium text-gray-800 mb-2">当前图片生成配置</h4>
                <div class="text-sm text-gray-600 space-y-1">
                    <div>模式: {{ imageConfig.mode === 'custom' ? '自定义密钥' : '内置服务（密钥在服务端）' }}</div>
                    <div>API地址: {{ imageConfig.baseUrl }}</div>
                    <div>模型: {{ imageConfig.model || '由服务端决定' }}</div>
                </div>
            </div>

            <!-- 测试按钮 -->
            <div class="flex gap-2">
                <button @click="testTextGeneration" :disabled="isTestingText" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50">
                    {{ isTestingText ? '测试中...' : '测试文本生成' }}
                </button>

                <button @click="refreshConfig" class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">刷新配置</button>
            </div>

            <!-- 测试结果 -->
            <div v-if="testResult" class="mt-4 p-3 rounded-lg" :class="testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
                <div class="font-medium">{{ testResult.success ? '✅ 测试成功' : '❌ 测试失败' }}</div>
                <div class="text-sm mt-1">{{ testResult.message }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { validateTextGenerationConfig, createTextGenerationRequest } from '../utils/apiConfig'
import axios from 'axios'

const settingsStore = useSettingsStore()

const textConfig = ref({})
const imageConfig = ref({})
const isTestingText = ref(false)
const testResult = ref(null)

// 刷新配置
const refreshConfig = () => {
    textConfig.value = settingsStore.getTextGenerationConfig()
    imageConfig.value = settingsStore.getImageGenerationConfig()
}

// 测试文本生成API
const testTextGeneration = async () => {
    if (!validateTextGenerationConfig()) {
        testResult.value = {
            success: false,
            message: '配置不完整，请检查API地址、密钥和模型设置'
        }
        return
    }

    isTestingText.value = true
    testResult.value = null

    try {
        const requestConfig = createTextGenerationRequest([{ role: 'user', content: '你好，请回复"配置测试成功"' }])

        const response = await axios({
            method: 'post',
            url: requestConfig.url,
            headers: requestConfig.headers,
            data: requestConfig.data,
            timeout: Math.min(requestConfig.timeout, 10000) // 测试时使用较短超时
        })

        if (response.data && response.data.choices && response.data.choices[0]) {
            testResult.value = {
                success: true,
                message: `API响应正常: ${response.data.choices[0].message.content}`
            }
        } else {
            testResult.value = {
                success: false,
                message: 'API响应格式异常'
            }
        }
    } catch (error) {
        console.error('测试失败:', error)
        testResult.value = {
            success: false,
            message: `连接失败: ${error.message || '未知错误'}`
        }
    } finally {
        isTestingText.value = false
    }
}

onMounted(() => {
    refreshConfig()
})
</script>

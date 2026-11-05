<template>
    <div>
        <!-- 设置按钮 -->
        <button @click="openSettings" class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="系统设置">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
        </button>

        <!-- 设置弹窗 -->
        <SettingsModal :isVisible="showSettings" :preferredMode="preferredMode" @close="closeSettings" @save="onSettingsSaved" />
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SettingsModal from './SettingsModal.vue'
import { NOT_CONFIGURED_EVENT } from '@/utils/apiConfig'

const showSettings = ref(false)
const preferredMode = ref('')

let lastNotifyAt = 0

const openSettings = () => {
    preferredMode.value = ''
    showSettings.value = true
}

const closeSettings = () => {
    showSettings.value = false
    preferredMode.value = ''
}

const onSettingsSaved = () => {
    // 可以在这里添加保存成功的提示
    console.log('设置已保存')
}

// 服务端没配模型时（501），直接把用户带到配置面板并默认选中「自定义密钥」
const onNotConfigured = () => {
    const now = Date.now()
    // 多个请求可能同时失败，3 秒内只响应一次，避免反复弹窗
    if (now - lastNotifyAt < 3000) return
    lastNotifyAt = now
    preferredMode.value = 'custom'
    showSettings.value = true
}

onMounted(() => {
    window.addEventListener(NOT_CONFIGURED_EVENT, onNotConfigured)
})

onBeforeUnmount(() => {
    window.removeEventListener(NOT_CONFIGURED_EVENT, onNotConfigured)
})
</script>

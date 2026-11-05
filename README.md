# 🍳 一饭封神

> 🚀 **Vibe Coding**  
> 通过 Kiro 编辑器，实现了从需求分析、架构设计到代码实现的全流程开发。
> [English](./README_EN.md) | 中文

基于 AI 的智能菜谱生成平台，支持中华八大菜系 + 国际料理，提供营养分析、酒水推荐、菜谱效果图生成等功能。

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-一饭封神-yellow?style=for-the-badge)](https://eat.lz-t.top/)
[![Vercel](https://img.shields.io/badge/🚀_Vercel-yffs.vercel.app-black?style=for-the-badge&logo=vercel)](https://yffs.vercel.app/)
[![Netlify](https://img.shields.io/badge/🌐_Netlify-whattoeatai.netlify.app-00C7B7?style=for-the-badge&logo=netlify)](https://whattoeatai.netlify.app/)
[![GitHub](https://img.shields.io/badge/GitHub-ehchhhhe/what--to--eat-black?style=for-the-badge&logo=github)](https://github.com/ehchhhhe/what-to-eat)
[![Config System](https://img.shields.io/badge/⚙️_Dynamic_Config-Real--time_AI_Settings-blue?style=for-the-badge)](https://github.com/ehchhhhe/what-to-eat#%EF%B8%8F-动态配置系统)

## 🚀 核心功能

-   **智能菜谱生成** - 基于食材和菜系偏好生成专业菜谱
-   **营养分析** - 详细营养成分分析和健康评分
-   **AI 效果图** - 一键生成精美菜品图片
-   **酒水搭配** - 专业侍酒师推荐
-   **酱汁设计** - 定制化调料配方
-   **收藏管理** - 保存和管理喜爱的菜谱
-   **料理占卜** - 趣味性饮食运势
-   **配置管理** - 动态配置 AI 模型参数，支持多服务商切换

## 🛠️ 技术栈

-   **前端框架：** Vue 3.4 + TypeScript 5.3+
-   **样式方案：** Tailwind CSS 3.4+
-   **构建工具：** Vite 5.0+
-   **AI 服务：** OpenAI 标准
-   **部署平台：** Vercel + Netlify

## 🚀 快速开始

### 环境要求

-   Node.js 18+

### 本地开发

```bash
# 克隆项目
git clone https://github.com/ehchhhhe/what-to-eat.git
cd what-to-eat

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 AI API 密钥

# 启动开发服务器
npm run dev

# 🎯 首次启动后，点击导航栏的 ⚙️ 图标可以动态配置AI模型参数
```

### 构建部署

```bash
# 类型检查 + 构建
npm run build

# Netlify 构建
npm run build:netlify

# 预览构建结果
npm run preview
```

## 🚀 一键部署

### Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ehchhhhe/what-to-eat&env=TEXT_GENERATION_BASE_URL,TEXT_GENERATION_API_KEY,TEXT_GENERATION_MODEL,IMAGE_GENERATION_BASE_URL,IMAGE_GENERATION_API_KEY,IMAGE_GENERATION_MODEL&envDescription=AI%20API%20配置&envLink=https://github.com/ehchhhhe/what-to-eat%23环境变量配置)

### Netlify 部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ehchhhhe/what-to-eat)

> ⚠️ 一键部署**不会**自动带上密钥。部署完成后请到平台的 Environment Variables 里补充
> `TEXT_GENERATION_*` / `IMAGE_GENERATION_*`（**不要加 `VITE_` 前缀**），否则 AI 接口会返回 501。
> 两个平台都需要开启 Serverless Functions（本项目已内置 `netlify/functions/ai-proxy.ts` 与 `api/ai/[...path].ts`）。

> 📖 详细部署指南请参考：[DEPLOYMENT.md](./DEPLOYMENT.md)

### 环境变量配置

#### 你可以切换任何符合 OpenAI 标准的请求地址和模型

> **🌟 模型推荐**: 建议使用高质量 AI 大模型获得更好的菜谱生成效果！不同模型的创意风格和专业程度差异显著。

> **🔐 密钥安全**：模型密钥只从**服务端**环境变量读取，浏览器通过同源的 `/api/ai/*` 代理调用模型。
> 因此打包产物里不会包含任何密钥，`npm run build` 结束后会自动扫描 `dist/` 做一次兜底校验。
> 请**不要**给密钥加 `VITE_` 前缀 —— 带前缀的变量会被编译进前端代码。

```env
# 菜谱生成模型配置（文本生成）
TEXT_GENERATION_BASE_URL=https://********/v1/
TEXT_GENERATION_API_KEY=************
TEXT_GENERATION_MODEL=******

# 图片生成模型配置
IMAGE_GENERATION_BASE_URL=https://open.bigmodel.cn/api/paas/v4/images/generations
IMAGE_GENERATION_API_KEY=******************
IMAGE_GENERATION_MODEL=cogview-3-flash

# 图片食材识别（可选，默认复用上面的图片服务密钥）
VISION_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
VISION_MODEL=GLM-4.1V-Thinking-Flash

# 可公开的前端参数（非敏感，允许带 VITE_ 前缀）
VITE_AI_TEMPERATURE=0.7
VITE_AI_TIMEOUT=300000
```

### ⚙️ 动态配置系统

应用内置了强大的配置管理系统，支持运行时动态修改 AI 模型配置：

#### 🎯 功能特性

-   **实时配置** - 无需重启应用，配置修改立即生效
-   **持久化存储** - 用户配置自动保存到本地
-   **分离管理** - 菜谱生成和图片生成模型独立配置
-   **配置验证** - 内置 API 连接测试功能
-   **一键恢复** - 支持恢复环境变量默认配置

#### 🚀 使用方法

1. 点击导航栏右侧的 ⚙️ 设置按钮
2. 在弹窗中修改 API 地址、密钥、模型等参数
3. 点击"保存设置"立即应用配置
4. 使用"测试配置"验证设置是否正确

#### 🎯 模型效果说明

> **💡 重要提示**: 不同 AI 模型生成的菜谱质量和风格差异很大！
>
> -   **推荐使用高质量大模型** - 如 GPT、Claude、DeepSeek 等
> -   **菜谱专业度** - 优质模型能生成更专业、详细的制作步骤
> -   **创意程度** - 不同模型的创意风格和口味搭配各有特色
> -   **营养分析** - 高端模型提供更准确的营养成分分析
>
> 🔄 **建议**: 尝试切换不同的 AI 模型接口，体验各种风格的菜谱生成效果！

#### 📋 支持的配置项

-   **API 地址** - 支持任何 OpenAI 兼容的 API 服务
-   **API 密钥** - 安全的密码形式输入
-   **模型名称** - 自定义使用的 AI 模型
-   **温度参数** - 控制生成内容的创造性(0-1)
-   **超时设置** - 自定义 API 请求超时时间

## 📁 项目结构

```
src/
├── components/          # 通用组件
│   ├── ConfirmModal.vue      # 确认对话框
│   ├── CookingLoader.vue     # 烹饪加载动画
│   ├── FavoriteButton.vue    # 收藏按钮
│   ├── GlobalNavigation.vue  # 全局导航
│   ├── RecipeCard.vue        # 菜谱卡片
│   ├── NutritionAnalysis.vue # 营养分析
│   ├── SettingsModal.vue     # 设置弹窗
│   ├── SettingsButton.vue    # 设置按钮
│   ├── ConfigTest.vue        # 配置测试
│   └── ...
├── config/              # 配置文件
│   ├── ai.ts                 # AI 模型配置
│   ├── cuisines.ts           # 菜系配置
│   ├── ingredients.ts        # 食材配置
│   └── ...
├── services/            # 服务层
│   ├── aiService.ts          # AI 接口服务
│   ├── favoriteService.ts    # 收藏服务
│   ├── imageService.ts       # 图片服务
│   └── ...
├── stores/              # 状态管理
│   └── settings.js           # 配置状态管理
├── utils/               # 工具函数
│   ├── apiConfig.js          # API配置工具
│   └── ...
├── views/               # 页面组件
│   ├── Home.vue              # 首页
│   ├── Favorites.vue         # 收藏页
│   ├── SauceDesign.vue       # 酱汁设计
│   ├── SettingsDemo.vue      # 配置演示页
│   └── ...
├── types/               # TypeScript 类型定义
└── router/              # 路由配置
```

### AI 服务集成

-   **文本生成**：`src/services/aiService.ts` - 支持动态配置切换
-   **图片生成**：`src/services/imageService.ts` - 多服务商支持
-   **配置管理**：`src/stores/settings.js` - 实时配置管理
-   **API 工具**：`src/utils/apiConfig.js` - 统一配置接口

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ehchhhhe/what-to-eat&type=Date)](https://www.star-history.com/#ehchhhhe/what-to-eat&Date)

## 🙏 致谢

-   [智谱 AI](https://open.bigmodel.cn/) - 图片生成 API
-   [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
-   [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

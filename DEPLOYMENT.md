# 部署指南 / Deployment Guide

## 🚀 支持的部署平台

### 在线演示

-   **地址**: https://eat.gfeather.xyz/

### Vercel 部署

-   **地址**: 待部署（占位）
-   **特点**: 自动部署、边缘网络、无服务器函数支持
-   **配置文件**: `vercel.json`

### Netlify 部署

-   **地址**: 待部署（占位）
-   **特点**: 持续部署、表单处理、重定向规则
-   **配置文件**: `netlify.toml`

## 🔧 环境变量配置

模型密钥**只在服务端使用**：浏览器请求同源的 `/api/ai/*`，由 Serverless Function 补上密钥后转发给模型服务。
所以打包出来的 `dist/` 里不含任何模型配置（构建结束会自动扫描产物，发现密钥直接失败）。

> ⚠️ 千万不要把密钥写成 `VITE_` 前缀 —— 带 `VITE_` 的变量会被 Vite 编译进浏览器代码。
> 只有 `VITE_AI_TEMPERATURE`、`VITE_AI_TIMEOUT` 这类非敏感参数才允许带前缀。

```env
# 文本生成
TEXT_GENERATION_BASE_URL=https://api.lingyiwanwu.com/v1/
TEXT_GENERATION_API_KEY=your_text_api_key_here
TEXT_GENERATION_MODEL=yi-lightning

# 图片生成
IMAGE_GENERATION_BASE_URL=https://open.bigmodel.cn/api/paas/v4/images/generations
IMAGE_GENERATION_API_KEY=your_image_api_key_here
IMAGE_GENERATION_MODEL=cogview-3-flash

# 图片食材识别（默认复用上面的图片服务密钥）
VISION_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
VISION_MODEL=GLM-4.1V-Thinking-Flash
```

本地开发：把 `.env.example` 复制成 `.env` 并填入真实密钥即可（`npm run dev` 由 Vite 中间件代理）。

### 代理端点

| 前端请求 | 转发到 |
| --- | --- |
| `POST /api/ai/text/chat/completions` | `TEXT_GENERATION_BASE_URL` + `chat/completions`（支持 SSE 流式） |
| `POST /api/ai/image/generations` | `IMAGE_GENERATION_BASE_URL` |
| `POST /api/ai/vision/chat/completions` | `VISION_BASE_URL` + `chat/completions` |
| `GET /api/ai/health` | 返回各路由的密钥是否已配置 |

代理只转发白名单路径、强制使用服务端配置的模型名、做同源校验与简单限流，不会被当成任意 URL 的跳板。

> 如果部署在纯静态环境（如 GitHub Pages，没有 Serverless Function），`/api/ai` 会 404，
> 此时可在页面的「模型配置」里切到「自定义密钥」，由用户自己提供密钥。
>
> 也可以完全不配环境变量，全靠用户在设置里自助填写：此时菜谱生成与图片识别都走用户自己的模型服务；
> 菜谱配图用的是**另一个服务**（如智谱 cogview），需要用户在设置的「图片生成模型配置」里单独填，
> 否则点击「生成配图」会提示未配置。

## 📋 部署步骤

### Vercel 部署步骤

1. **Fork 项目**到你的 GitHub 账户
2. **登录 Vercel**并连接 GitHub
3. **导入项目**：选择 fork 的仓库
4. **配置环境变量**：在 Vercel 项目设置中添加上述环境变量
5. **部署**：Vercel 会自动构建和部署

或者使用一键部署：
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ehchhhhe/what-to-eat&env=TEXT_GENERATION_BASE_URL,TEXT_GENERATION_API_KEY,TEXT_GENERATION_MODEL,IMAGE_GENERATION_BASE_URL,IMAGE_GENERATION_API_KEY,IMAGE_GENERATION_MODEL&envDescription=AI%20API%20配置)

### Netlify 部署步骤

1. **Fork 项目**到你的 GitHub 账户
2. **登录 Netlify**并连接 GitHub
3. **新建站点**：选择 fork 的仓库
4. **构建设置**：
    - Build command: `npm run build:netlify`
    - Publish directory: `dist`
    - Node version: `18`
5. **环境变量**：在 Netlify 站点设置中添加环境变量
6. **部署**：Netlify 会自动构建和部署

或者使用一键部署：
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ehchhhhe/what-to-eat)

## 🔍 获取 Netlify Site ID

要获取 Netlify 部署状态徽章，需要找到你的 Site ID：

1. 登录 Netlify 控制台
2. 选择你的站点
3. 进入 **Site settings** > **General**
4. 在 **Site information** 中找到 **Site ID**
5. 将 README 中的 `your-site-id` 替换为实际的 Site ID

## 🛠️ 自定义域名

### Vercel 自定义域名

1. 在 Vercel 项目设置中选择 **Domains**
2. 添加你的域名
3. 按照提示配置 DNS 记录

### Netlify 自定义域名

1. 在 Netlify 站点设置中选择 **Domain management**
2. 添加自定义域名
3. 配置 DNS 记录或使用 Netlify DNS

## 🔄 自动部署

两个平台都支持 Git 集成的自动部署：

-   **推送到主分支**：自动触发生产环境部署
-   **推送到其他分支**：创建预览部署（Vercel）或分支部署（Netlify）
-   **Pull Request**：自动创建预览部署

## 📊 监控和分析

### Vercel Analytics

-   在项目设置中启用 Vercel Analytics
-   查看页面性能和用户访问数据

### Netlify Analytics

-   升级到付费计划以使用 Netlify Analytics
-   查看流量统计和性能指标

## 🚨 故障排除

### 常见问题

1. **构建失败**：检查环境变量是否正确配置；如果提示「构建产物中发现疑似密钥」，说明有密钥被写成了 `VITE_` 前缀
2. **页面 404**：确保 SPA 重定向规则已配置（`/api/ai/*` 必须排在兜底规则之前）
3. **API 调用失败（501 server_not_configured）**：部署平台没有配置对应的 `*_API_KEY`
4. **静态资源加载失败**：检查构建输出目录配置

### 调试步骤

1. 查看构建日志
2. 检查环境变量配置
3. 本地测试构建命令
4. 检查网络和 API 连接

## 📞 支持

如果遇到部署问题，可以：

1. 查看项目 Issues
2. 参考官方文档：
    - [Vercel 文档](https://vercel.com/docs)
    - [Netlify 文档](https://docs.netlify.com/)
3. 提交新的 Issue 描述问题

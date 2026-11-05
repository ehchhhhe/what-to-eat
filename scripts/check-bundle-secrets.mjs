#!/usr/bin/env node
/**
 * 构建产物密钥泄露检查
 *
 * 在 vite build 之后运行：如果 dist/ 里出现了环境变量中的任何密钥，
 * 或者出现了常见的密钥字面量（sk-xxx、Bearer xxx），直接让构建失败。
 *
 * 这样即便以后有人不小心把密钥写回 VITE_ 前缀的环境变量或写死在代码里，
 * 也会在 CI 阶段被拦住，而不是等上线后被人扒出来。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')

const TEXT_EXTENSIONS = ['.js', '.mjs', '.cjs', '.css', '.html', '.json', '.map', '.svg', '.txt', '.webmanifest']

/** 这些名字视为敏感变量（VITE_ 前缀的旧变量也一并检查） */
const SECRET_KEY_PATTERN = /(API_KEY|_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)/i

const parseEnvFile = filePath => {
    const result = {}
    if (!existsSync(filePath)) return result
    const content = readFileSync(filePath, 'utf8')
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const eq = line.indexOf('=')
        if (eq <= 0) continue
        const key = line.slice(0, eq).trim()
        let value = line.slice(eq + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
        }
        result[key] = value
    }
    return result
}

/** 汇总所有可能的密钥来源：进程环境 + 各类 .env 文件 */
const collectSecrets = () => {
    const sources = {}

    const envFiles = ['.env', '.env.local', '.env.production', '.env.production.local', '.env.development']
    for (const name of envFiles) {
        Object.assign(sources, parseEnvFile(join(root, name)))
    }

    for (const [key, value] of Object.entries(process.env)) {
        if (typeof value === 'string') sources[key] = value
    }

    const secrets = new Map()
    for (const [key, value] of Object.entries(sources)) {
        if (!SECRET_KEY_PATTERN.test(key)) continue
        if (typeof value !== 'string' || value.length < 8) continue
        // 占位符跳过
        if (/^(x+|\*+|your_.*|example.*|placeholder.*|changeme.*)$/i.test(value)) continue
        secrets.set(value, key)
    }
    return secrets
}

const walk = dir => {
    const files = []
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        const stat = statSync(full)
        if (stat.isDirectory()) files.push(...walk(full))
        else if (TEXT_EXTENSIONS.includes(full.slice(full.lastIndexOf('.')).toLowerCase())) files.push(full)
    }
    return files
}

const main = () => {
    if (!existsSync(distDir)) {
        console.error('✗ 找不到 dist 目录，请先执行构建')
        process.exit(1)
    }

    const secrets = collectSecrets()
    const files = walk(distDir)

    const findings = []
    const inlinePatterns = [
        { name: 'sk- 开头的密钥', regex: /sk-[A-Za-z0-9_-]{20,}/ },
        { name: 'Bearer 令牌', regex: /Bearer\s+[A-Za-z0-9._-]{20,}/ }
    ]

    for (const file of files) {
        const content = readFileSync(file, 'utf8')
        for (const [value, key] of secrets) {
            if (content.includes(value)) {
                findings.push(`${file.replace(root + '\\', '').replace(root + '/', '')} 含有环境变量 ${key} 的值`)
                break
            }
        }
        for (const { name, regex } of inlinePatterns) {
            const match = content.match(regex)
            if (match) {
                findings.push(`${file.replace(root + '\\', '').replace(root + '/', '')} 疑似包含${name}：${match[0].slice(0, 12)}…`)
            }
        }
    }

    if (findings.length > 0) {
        console.error('\n✗ 构建产物中发现疑似密钥，已中止构建：\n')
        findings.forEach(item => console.error(`   - ${item}`))
        console.error('\n请确认：模型密钥只应存在于服务端环境变量（不带 VITE_ 前缀），前端一律走 /api/ai 代理。\n')
        process.exit(1)
    }

    const legacyViteKeys = Object.keys(process.env).filter(k => /^VITE_.*(API_KEY|SECRET|TOKEN)/i.test(k))
    if (legacyViteKeys.length > 0) {
        console.warn(`⚠ 检测到仍在使用 VITE_ 前缀的敏感变量：${legacyViteKeys.join(', ')}`)
        console.warn('  VITE_ 前缀的变量会被注入浏览器，请改名为不带前缀的服务端变量。\n')
    }

    console.log(`✓ 密钥检查通过：扫描 ${files.length} 个产物文件，未发现任何模型密钥`)
}

main()

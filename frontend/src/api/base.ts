// AIMETA P=API基础配置_统一基址和前缀|R=前后端调用基址统一|NR=不含业务接口|E=api:base|X=internal|A=API_BASE_URL|D=ts|S=env|RD=./README.ai
const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || '').trim()

// 默认同源请求（开发环境由 Vite 代理 /api 到后端），
// 需要直连后端时可通过 VITE_API_BASE_URL 覆盖。
export const API_BASE_URL = configuredApiBase
export const API_PREFIX = '/api'

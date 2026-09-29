# v0-ai-5e

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_UJkCC6SxY4yVl5uYCgkTyLcVJ70n)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Cloudflare Pages 部署说明 (Cloudflare Deployment Guide)

本项目使用 `@cloudflare/next-on-pages` 构建并部署在 Cloudflare Pages 上。

### Cloudflare Pages 控制台配置：

1. **Framework preset**: `None` / `Next.js (Static)`
2. **Build command (构建命令)**: `pnpm run pages:build` (或 `npx @cloudflare/next-on-pages`)
3. **Build output directory (构建输出目录)**: `.vercel/output/static`
4. **Node.js 版本**: `>= 20.0.0`
5. **Compatibility flags (兼容性标志)**: `nodejs_compat`

### 环境变量设置 (Environment Variables):

在 Cloudflare Pages 设置中配置以下环境变量（如使用对应模型）：
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token (需要 Workers AI 权限)
- `OPENAI_API_KEY`: (可选) OpenAI API Key
- `REPLICATE_API_TOKEN`: (可选) Replicate API Token

### 本地构建与预览：

```bash
# 构建 Cloudflare Pages 产物
pnpm run pages:build

# 本地预览
pnpm run preview
```

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

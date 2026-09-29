# 白狐 AI - 部署指南 (Deployment Guide)

白狐 (WhiteFox AI) 支持多种生产环境与平台的高效部署，包括 **Cloudflare Pages 代码上传部署与 Git 拉取部署**、**Vercel & 类似平台**、**Docker / Docker Compose** 以及 **Wasmer Edge**，支持关联 Cloudflare D1 数据库进行全量用户数据与收藏同步。

---

## 环境变量配置

| 变量名 | 说明 | 是否必填 | 示例/默认值 |
| :--- | :--- | :--- | :--- |
| `ADMIN_PASSWORD` | 管理员密码 | 推荐 | `admin123456` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | 选填（若用CF AI） | `abc123def456...` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | 选填（若用CF AI） | `vX9...` |
| `OPENAI_API_KEY` | OpenAI API Key | 选填 | `sk-...` |

---

## Cloudflare Pages 部署

### 代码上传部署 (Wrangler Direct Upload)
```bash
# 构建并上传至 Cloudflare Pages
pnpm run pages:build
npx wrangler pages deploy .vercel/output/static --project-name=whitefox-ai
```

### Git 拉取部署 (Pages Git Integration)
1. 在 Cloudflare Dashboard 关联 GitHub 仓库。
2. Build Command 设为 `pnpm run build` 或 `npx @cloudflare/next-on-pages`。
3. Build Output Directory 设为 `.vercel/output/static`。
4. 添加环境变量 `ADMIN_PASSWORD`、`CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN`。

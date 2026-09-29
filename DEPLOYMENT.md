# 白狐 AI - 部署指南 (Deployment Guide)

白狐 (WhiteFox AI) 支持多种生产环境与平台的高效部署，包括 **Cloudflare Pages 代码上传部署与 Git 拉取部署**、**Vercel & 类似平台**、**Docker / Docker Compose** 以及 **Wasmer Edge**，支持关联 Cloudflare D1 数据库进行全量用户数据与收藏同步。

---

## 目录
1. [环境变量配置 (Environment Variables)](#环境变量配置)
2. [Cloudflare Pages 部署 (代码上传部署 & Git 拉取部署)](#cloudflare-pages-部署)
3. [Cloudflare D1 数据库绑定 (D1 Sync)](#cloudflare-d1-数据库绑定)
4. [Vercel & 类似平台部署](#vercel--类似平台部署)
5. [Docker / Docker Compose 部署](#docker--docker-compose-部署)
6. [Wasmer 部署](#wasmer-部署)
7. [静态资源与文件获取路径说明](#静态资源与文件获取路径说明)

---

## 环境变量配置

在各部署平台中，可在环境变量设置中配置以下参数：

| 变量名 | 说明 | 是否必填 | 示例/默认值 |
| :--- | :--- | :--- | :--- |
| `ADMIN_PASSWORD` | 管理员密码（界面会显式识别管理员身份） | **推荐** | `admin123456` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID（用于免费/付费 Workers AI 图像生成） | 选填（若用CF AI） | `abc123def456...` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（包含 Workers AI 权限） | 选填（若用CF AI） | `vX9...` |
| `OPENAI_API_KEY` | OpenAI API Key（用于 DALL-E 3 生成） | 选填 | `sk-...` |
| `REPLICATE_API_TOKEN` | Replicate API Token | 选填 | `r8_...` |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | 前端公开显示的管理员密码提示（可选） | 选填 | `admin123456` |

---

## Cloudflare Pages 部署

支持 **代码上传部署 (Wrangler Direct Upload)** 与 **Git 自动拉取部署 (Pages Git Integration)**。

### 方式一：代码上传部署 (Wrangler Direct Upload) - 推荐

无需连接 GitHub/Git 仓库，直接在本地编译并一键上传部署到 Cloudflare Pages：

1. **安装 Wrangler CLI**
   ```bash
   pnpm add -D wrangler @cloudflare/next-on-pages
   ```

2. **登录 Cloudflare**
   ```bash
   npx wrangler login
   ```

3. **构建 Next.js Pages 静态产物**
   ```bash
   npx @cloudflare/next-on-pages
   ```

4. **一键上传部署到 Cloudflare Pages**
   ```bash
   npx wrangler pages deploy .vercel/output/static --project-name=whitefox-ai
   ```

### 方式二：Git 拉取部署 (Pages Git Integration)

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 导航至 `Workers & Pages` -> `Create application` -> `Pages` -> `Connect to Git`。
2. 选择本项目的 GitHub 仓库。
3. **构建设置**：
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`
   - **Node.js Version**: `20.x` (在 Environment variables 中添加 `NODE_VERSION = 20`)
4. 在 Environment variables 中填入 `ADMIN_PASSWORD`、`CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN`。
5. 点击 `Save and Deploy`。

---

## Cloudflare D1 数据库绑定

关联 Cloudflare D1 数据库可开启全局云端用户数据同步、收藏夹同步、笔记与历史同步。未绑定 D1 时，系统自动回退至极速本地存储 (LocalStorage) 模式，完全免去数据库依赖。

### 1. 创建 D1 数据库
```bash
npx wrangler d1 create whitefox_db
```
执行后终端将输出 `database_id`。

### 2. 初始化数据库结构
使用仓库自带的 `schema.sql` 初始化：
```bash
npx wrangler d1 execute whitefox_db --file=./schema.sql
```

### 3. 在 Cloudflare Pages 中绑定 D1
- 在 Cloudflare Pages Dashboard -> `Settings` -> `Functions` -> `D1 database bindings` 中添加：
  - **Variable name**: `DB`
  - **D1 database**: 选择 `whitefox_db`

---

## Vercel & 类似平台部署

本项目天然适配 Vercel、Zeabur、Netlify 等平台：

1. **一键导入部署**
   - 登录 [Vercel](https://vercel.com)，点击 `Add New` -> `Project` 并选择该仓库。
2. **配置环境变量**
   - 在 `Environment Variables` 中添加 `ADMIN_PASSWORD`、`CLOUDFLARE_ACCOUNT_ID` 等变量。
3. **部署命令**
   - Build Command: `pnpm build`
   - Output Directory: `.next`

---

## Docker / Docker Compose 部署

适用于独立服务器、VPS、NAS 或 Kubernetes 部署。

### 1. 使用 Docker Compose 一键启动
```bash
# 修改 docker-compose.yml 中的环境变量后执行：
docker-compose up -d --build
```

### 2. 使用 Docker 单独构建运行
```bash
docker build -t whitefox-ai .
docker run -d -p 3000:3000 -e ADMIN_PASSWORD="your_admin_password" --name whitefox-ai whitefox-ai
```

---

## Wasmer 部署

适合 Edge / Wasmer 容器平台：

```bash
# 安装 Wasmer CLI 并在根目录运行：
wasmer deploy
```
项目配置文件 `Wasmer.toml` 已就绪。

---

## 静态资源与文件获取路径说明

- **前端应用主入口**：`/`
- **图像生成 API**：`/api/generate`
- **身份认证 API**：`/api/auth`
- **数据同步 API**：`/api/sync`
- **静态资源获取路径**：
  - 应用图标与静态图片统一存放于 `public/` 目录下（如 `/icon.svg`, `/icon-light-32x32.png`, `/icon-dark-32x32.png`）。
  - 在打包部署后，静态资源相对于根域名直接访问（如 `https://your-domain.com/icon.svg`）。
  - 在 Cloudflare Pages / Vercel 部署中，`public/` 目录下的所有文件会被自动路由为根路径静态资源。

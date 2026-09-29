# 🦊 白狐 (WhiteFox AI) - 详细部署指南

本指南详细说明白狐 (WhiteFox AI) 在各种主流生产环境下的部署方式，包括 **Cloudflare Pages 代码上传部署与 Git 自动拉取部署**、**Cloudflare D1 数据库绑定与数据同步**、**Vercel**、**Docker / Docker Compose** 以及 **Wasmer** 部署。

---

## 目录
- [一、 关键环境变量与配置说明](#一-关键环境变量与配置说明)
- [二、 Cloudflare Pages 部署 (代码上传部署与 Git 拉取部署)](#二-cloudflare-pages-部署)
- [三、 Cloudflare D1 数据库绑定 (实现云端同步)](#三-cloudflare-d1-数据库绑定)
- [四、 Vercel & 类似平台部署](#四-vercel--类似平台部署)
- [五、 Docker / Docker Compose 容器化部署](#五-docker--docker-compose-容器化部署)
- [六、 Wasmer 部署](#六-wasmer-部署)
- [七、 静态资源与文件获取路径说明](#七-静态资源与文件获取路径说明)

---

## 一、 关键环境变量与配置说明

部署前可在目标平台的环境变量设置面板配置以下变量：

| 环境变量名 | 说明 | 是否必填 | 示例/默认值 |
| :--- | :--- | :--- | :--- |
| `ADMIN_PASSWORD` | 管理员密码（在登录界面显式校验并标记管理员账号） | **推荐** | `admin123456` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID（用于 Workers AI 图像生成） | 选填 | `abc123def456...` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌（需具备 Workers AI 读写权限） | 选填 | `vX9_aB8...` |
| `OPENAI_API_KEY` | OpenAI API 密钥（用于 DALL-E 3 图像生成） | 选填 | `sk-...` |
| `REPLICATE_API_TOKEN` | Replicate API 令牌 | 选填 | `r8_...` |

---

## 二、 Cloudflare Pages 部署

支持 **代码直接上传部署 (Wrangler Direct Upload)** 与 **Git 仓库自动拉取部署 (Pages Integration)**。

### 方式 1：代码上传部署 (Wrangler Direct Upload) - 推荐

无需在 Cloudflare 连接 GitHub 仓库，可在本地直接编译产物并通过 Wrangler CLI 一键上传：

1. **安装并登录 Wrangler**
   ```bash
   pnpm add -D wrangler @cloudflare/next-on-pages
   npx wrangler login
   ```

2. **执行 Cloudflare Pages 专用构建指令**
   ```bash
   pnpm run pages:build
   ```
   *说明：此指令会运行 `npx @cloudflare/next-on-pages`，并在项目根目录生成 `.vercel/output/static` 部署产物。*

3. **一键上传部署至 Cloudflare Pages**
   ```bash
   npx wrangler pages deploy .vercel/output/static --project-name=whitefox-ai
   ```

### 方式 2：Git 拉取部署 (Pages Git Integration)

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 `Workers & Pages` -> `Create application` -> `Pages` -> `Connect to Git`。
2. 选择关联的 GitHub 仓库。
3. **构建配置 (Build Settings)**：
   - **Framework preset**: `Next.js`
   - **Build command (构建指令)**: `pnpm run pages:build` 或 `npx @cloudflare/next-on-pages`
   - **Build output directory (输出目录)**: `.vercel/output/static`
   - **Node.js 版本**: 在环境变量中添加 `NODE_VERSION = 20`
4. 在 Environment variables 中填入 `ADMIN_PASSWORD`、`CLOUDFLARE_ACCOUNT_ID` 等变量。
5. 点击 `Save and Deploy` 保存并开始构建。

---

## 三、 Cloudflare D1 数据库绑定

关联 D1 数据库可开启用户账号云端存储、收藏夹与笔记多端同步。未绑定 D1 时，系统自动无缝切换为极速本地存储 (LocalStorage) 模式，无需依赖数据库。

### 1. 创建 D1 数据库
```bash
npx wrangler d1 create whitefox_db
```

### 2. 执行数据库结构初始化 (SQL Schema)
运行仓库中自带的 `schema.sql` 初始化数据库表结构：
```bash
npx wrangler d1 execute whitefox_db --file=./schema.sql
```

### 3. 在 Cloudflare Pages 设置中绑定 D1 数据库
- 在 Cloudflare Pages Dashboard 控制台，进入 `Settings` -> `Functions` -> `D1 database bindings`。
- 添加绑定：
  - **Variable name (变量名)**: `DB`
  - **D1 database**: 选择刚才创建的 `whitefox_db`

---

## 四、 Vercel & 类似平台部署

1. 在 Vercel 控制台导入 GitHub 仓库。
2. **构建参数**：
   - Build Command: `pnpm build`
   - Output Directory: `.next`
3. 在 `Environment Variables` 中配置 `ADMIN_PASSWORD` 与 AI 密钥即可部署完成。

---

## 五、 Docker / Docker Compose 容器化部署

适用于独立服务器、VPS、NAS 等环境。

### 1. 使用 Docker Compose 一键构建启动
```bash
# 修改 docker-compose.yml 环境变量后执行：
docker-compose up -d --build
```

### 2. 单独 Docker 容器构建
```bash
docker build -t whitefox-ai .
docker run -d -p 3000:3000 -e ADMIN_PASSWORD="your_admin_password" --name whitefox-ai whitefox-ai
```

---

## 六、 Wasmer 部署

适合 Edge / Wasmer 容器平台：

```bash
wasmer deploy
```
*项目根目录中的 `Wasmer.toml` 已配置就绪。*

---

## 七、 静态资源与文件获取路径说明

- **应用主页路径**：`/`
- **AI 图像生成 API**：`/api/generate`
- **用户登录与注册 API**：`/api/auth`
- **数据与收藏同步 API**：`/api/sync`
- **静态资源获取说明**：
  - 图标与静态图片统一放置于 `public/` 目录下（如 `/icon.svg`、`/icon-light-32x32.png`、`/icon-dark-32x32.png`）。
  - 在部署完成后，可直接通过根域名加文件名访问（例如 `https://your-domain.com/icon.svg`）。

# 🦊 白狐 (WhiteFox AI) - 详细部署指南 (的全平台部署手册)

本指南包含白狐 (WhiteFox AI) 在各种生产环境与主流平台下的**逐步骤详细部署流程**、**关键环境变量**、**构建指令**与**文件获取路径**。

---

## 目录
- [一、 关键环境变量说明](#一-关键环境变量说明)
- [二、 构建指令速查表](#二-构建指令速查表)
- [三、 Cloudflare Pages 代码拉取部署 (Git Integration)](#三-cloudflare-pages-代码拉取部署-git-integration)
- [四、 Cloudflare Pages 代码直接上传部署 (Wrangler Upload)](#四-cloudflare-pages-代码直接上传部署-wrangler-upload)
- [五、 Cloudflare D1 数据库绑定与 SQL 数据初始化](#五-cloudflare-d1-数据库绑定与-sql-数据初始化)
- [六、 Vercel 一键部署](#六-vercel-一键部署)
- [七、 Netlify 部署](#七-netlify-部署)
- [八、 Zeabur / Render / Railway 部署](#八-zeabur--render--railway-部署)
- [九、 Docker / Docker Compose 容器化部署](#九-docker--docker-compose-容器化部署)
- [十、 Wasmer Edge 部署](#十-wasmer-edge-部署)
- [十一、 静态资源与文件获取路径说明](#十一-静态资源与文件获取路径说明)

---

## 一、 关键环境变量说明

在各部署平台的环境变量配置（Environment Variables）选项中设置以下参数：

| 环境变量名 | 说明 | 是否必填 | 示例/默认值 |
| :--- | :--- | :--- | :--- |
| `ADMIN_PASSWORD` | 管理员密码（在登录界面显式校验并赋予管理员特权） | **推荐** | `admin123456` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID（使用 Workers AI 免费/付费出图） | 选填 | `abc123def456...` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（需包含 Workers AI 读写权限） | 选填 | `vX9_aB8...` |
| `OPENAI_API_KEY` | OpenAI API Key（用于 DALL-E 3 图像生成） | 选填 | `sk-...` |
| `REPLICATE_API_TOKEN` | Replicate API Token | 选填 | `r8_...` |
| `NODE_VERSION` | Node.js 版本（部分平台云构建需要） | 推荐 | `20` |

---

## 二、 构建指令速查表

| 操作类型 | 构建指令 | 说明 |
| :--- | :--- | :--- |
| **标准生产构建** | `pnpm build` 或 `npm run build` | 编译标准 Next.js 应用 |
| **Cloudflare Pages 构建** | `pnpm run pages:build` 或 `npx @cloudflare/next-on-pages` | 使用 `@cloudflare/next-on-pages` 打包边缘环境产物 |
| **Cloudflare 上传** | `npx wrangler pages deploy .vercel/output/static --project-name=whitefox-ai` | 将边缘产物部署至 Cloudflare Pages |
| **D1 数据库结构初始化** | `npx wrangler d1 execute whitefox_db --file=./schema.sql` | 运行 SQL 语句创建 D1 表结构 |
| **Docker Compose 构建** | `docker-compose up -d --build` | 启动本地或服务器 Docker 镜像 |

---

## 三、 Cloudflare Pages 代码拉取部署 (Git Integration)

适合将 GitHub 仓库绑定至 Cloudflare 控制台，每次 `git push` 时自动触发部署：

1. **登录 Cloudflare Dashboard**：
   访问 [Cloudflare 控制台](https://dash.cloudflare.com/)，在左侧导航栏点击 `Workers & Pages`。
2. **创建 Pages 应用**：
   点击 `Create application` -> 选择 `Pages` 选项卡 -> 点击 `Connect to Git`。
3. **关联 GitHub 仓库**：
   选择本项目仓库（如 `whitefox-ai`），授权后点击 `Begin setup`。
4. **配置构建参数 (Build Settings)**：
   - **Framework preset (框架预设)**: `Next.js`
   - **Build command (构建指令)**: `pnpm run pages:build` （或 `npx @cloudflare/next-on-pages`）
   - **Build output directory (构建输出目录)**: `.vercel/output/static`
   - **Root directory (根目录)**: `/`
5. **添加环境变量 (Environment Variables)**：
   - 在 `Environment variables (advanced)` 中添加：
     - `NODE_VERSION` = `20`
     - `ADMIN_PASSWORD` = `您的管理员密码`
     - `CLOUDFLARE_ACCOUNT_ID` = `您的 CF Account ID` (可选)
     - `CLOUDFLARE_API_TOKEN` = `您的 CF API Token` (可选)
6. **保存并部署**：
   点击 `Save and Deploy`，Cloudflare Pages 将自动为您拉取代码、完成构建并分配专属域名。

---

## 四、 Cloudflare Pages 代码直接上传部署 (Wrangler Upload)

无需连接 GitHub，在本地或 CI 节点打包后直接上传部署：

1. **安装依赖并登录 Wrangler**
   ```bash
   pnpm add -D wrangler @cloudflare/next-on-pages
   npx wrangler login
   ```
2. **执行 Cloudflare 专用打包**
   ```bash
   pnpm run pages:build
   ```
   *打包完成后，项目根目录会生成 `.vercel/output/static` 文件夹。*
3. **一键上传部署**
   ```bash
   npx wrangler pages deploy .vercel/output/static --project-name=whitefox-ai
   ```
4. **设置环境变量**
   在终端运行：
   ```bash
   npx wrangler pages secret put ADMIN_PASSWORD
   ```
   或直接在 Cloudflare Pages 项目后台 -> `Settings` -> `Environment variables` 中进行添加。

---

## 五、 Cloudflare D1 数据库绑定与 SQL 数据初始化

关联 Cloudflare D1 可以实现用户数据、收藏夹与笔记的云端多端同步。未绑定 D1 时，系统自动无缝使用极速本地存储（LocalStorage）。

### 步骤 1：创建 D1 数据库
```bash
npx wrangler d1 create whitefox_db
```
*控制台将返回 `database_id`。*

### 步骤 2：初始化 SQL 表结构
使用仓库中的 `schema.sql` 建立用户、收藏与笔记表：
```bash
npx wrangler d1 execute whitefox_db --file=./schema.sql
```

### 步骤 3：在 Pages 控制台中绑定数据库
1. 打开 Cloudflare Pages Dashboard 控制台 -> 选择 `whitefox-ai` 项目。
2. 进入 `Settings` -> `Functions` -> 下滑找到 `D1 database bindings`。
3. 点击 `Add binding`：
   - **Variable name (变量名)**: `DB` （务必大写 DB）
   - **D1 database**: 选择 `whitefox_db`
4. 点击 `Save` 保存并重新部署项目即可生效。

---

## 六、 Vercel 一键部署

1. 访问 [Vercel 官网](https://vercel.com/) 登录控制台。
2. 点击 `Add New...` -> 选择 `Project` -> 导入本项目的 GitHub 仓库。
3. **构建配置 (Build Settings)**：
   - **Framework Preset**: `Next.js`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
4. **环境变量**：
   在 `Environment Variables` 中添加 `ADMIN_PASSWORD`、`CLOUDFLARE_ACCOUNT_ID` 等变量。
5. 点击 `Deploy` 即可在几十秒内完成构建部署。

---

## 七、 Netlify 部署

1. 登录 [Netlify 控制台](https://app.netlify.com/) -> 点击 `Add new site` -> `Import an existing project`。
2. 选择 GitHub 授权并选择本仓库。
3. **构建设置**：
   - **Build command**: `pnpm build`
   - **Publish directory**: `.next`
4. 在 `Site configuration` -> `Environment variables` 中配置环境变量（如 `ADMIN_PASSWORD`）。
5. 点击 `Deploy site` 完成部署。

---

## 八、 Zeabur / Render / Railway 部署

### 在 Zeabur 部署：
1. 打开 [Zeabur Dashboard](https://zeabur.com/)，新建服务选择 `Git Repository`。
2. Zeabur 会自动识别 Next.js 框架并使用 `pnpm build` 构建。
3. 在 `Variables` 选项卡中添加 `ADMIN_PASSWORD` 变量后自动发布。

### 在 Render / Railway 部署：
1. 导入 GitHub 仓库并创建 Web Service。
2. **Build Command**: `pnpm install && pnpm build`
3. **Start Command**: `pnpm start`
4. 在 Environment 模块中配置相关变量。

---

## 九、 Docker / Docker Compose 容器化部署

适合独立 VPS 服务器、NAS 或 Kubernetes 集群部署：

### 方式 1：使用 Docker Compose 一键构建启动 (推荐)
1. 检查或修改项目根目录的 `docker-compose.yml` 中的环境变量。
2. 运行构建并后台启动：
   ```bash
   docker-compose up -d --build
   ```
3. 访问 `http://服务器IP:3000` 即可使用。

### 方式 2：使用 Dockerfile 单独构建
```bash
# 构建镜像
docker build -t whitefox-ai .

# 启动容器
docker run -d -p 3000:3000 -e ADMIN_PASSWORD="your_admin_password" --name whitefox-ai whitefox-ai
```

---

## 十、 Wasmer Edge 部署

适合使用 Wasmer 边缘容器部署：

```bash
# 确保已安装 Wasmer CLI 并完成登录：
wasmer deploy
```
*项目根目录中已配置标准的 `Wasmer.toml`。*

---

## 十一、 静态资源与文件获取路径说明

- **Web 应用主页**：`/`
- **图像生成 API 端点**：`/api/generate`
- **身份认证与登录 API**：`/api/auth`
- **数据与收藏同步 API**：`/api/sync`
- **静态资源文件**：
  - 应用 Logo 与 Icon 文件存放于 `public/` 目录中（例如 `/icon.svg`、`/icon-light-32x32.png`、`/icon-dark-32x32.png`）。
  - 部署完成后在浏览器中可直接访问静态资源路径，例如 `https://您的域名/icon.svg`。

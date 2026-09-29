# 🦊 白狐 (WhiteFox AI) - AI 图像生成与创作平台

![白狐 AI](public/icon.svg)

**白狐 (WhiteFox AI)** 是一款基于 Next.js 打造的高颜值、功能丰富且高度适配移动端的 AI 图像生成与提示词管理平台。内置高质量图像生成、文生图、图生图、参考图生成、1~4张批量出图、魔法咒语库、提示词笔记本及云端/本地免库同步功能。

---

## ✨ 核心特色与功能

1. 📱 **手机极佳适配界面**
   - 响应式头部导航、手机端专属底部快捷导航栏、抽屉式设置菜单与触控友好交互。
2. 🌓 **一键深色/浅色夜间模式**
   - 支持跟随系统设置与一键点击自由切换深色 (Dark) 和浅色 (Light) 主题。
3. 🎨 **免费优质出图与一键四图生成**
   - 支持 1~4 张批量快速出图。
   - 内置“高清画质增强”魔棒，自动融入画质控制与高细节词汇。
4. 🔐 **登录与免库注册系统**
   - **免数据库模式**：开箱即用，无需配置任何数据库，账号及生成数据完全保存在浏览器本地（LocalStorage）。
   - **D1 数据库绑定**：支持关联 Cloudflare D1 数据库，实现多设备账号数据与收藏同步。
   - **管理员身份**：通过部署环境变量 `ADMIN_PASSWORD` 灵活设置管理员密钥，系统自动显式识别管理员身份。
5. 🪄 **魔法咒语与提示词笔记本**
   - 预置写实人像、动漫角色、奇幻风景、科幻场景等多品类高质量咒语，支持收藏与自定义管理。

---

## 🛠️ 关键构建指令与运行命令

| 操作 / 环境 | 命令 | 说明 |
| :--- | :--- | :--- |
| **安装项目依赖** | `pnpm install` | 安装所需依赖包 |
| **本地开发运行** | `pnpm dev` | 启动开发服务器，访问 `http://localhost:3000` |
| **标准项目构建** | `pnpm build` | 编译构建生产环境 Next.js 静态与服务端产物 |
| **启动本地构建** | `pnpm start` | 运行生产环境服务 |
| **Cloudflare Pages 专用构建** | `pnpm run pages:build` | 使用 `@cloudflare/next-on-pages` 构建适配 CF Pages 的产物 |
| **Cloudflare 直接代码上传部署** | `npx wrangler pages deploy .vercel/output/static --project-name=whitefox-ai` | 将编译产物一键上传部署至 Cloudflare |
| **D1 数据库表结构初始化** | `npx wrangler d1 execute whitefox_db --file=./schema.sql` | 在 Cloudflare 执行 SQL 初始化结构 |
| **Docker 容器构建与启动** | `docker-compose up -d --build` | 使用 Docker Compose 一键一键容器化部署 |

---

## 🔑 关键部署环境变量

在各部署平台的环境变量设置（Environment Variables）中添加：

| 环境变量名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `ADMIN_PASSWORD` | **关键** | 管理员登录密钥，系统显式校验并标记管理员身份 | `admin123456` |
| `CLOUDFLARE_ACCOUNT_ID` | 选填 | Cloudflare Account ID (使用 Workers AI 图像生成时配置) | `9a8b7c6d5e...` |
| `CLOUDFLARE_API_TOKEN` | 选填 | Cloudflare API Token | `vX9_aB8...` |
| `OPENAI_API_KEY` | 选填 | OpenAI API Key (使用 DALL-E 3 生成时配置) | `sk-...` |
| `REPLICATE_API_TOKEN` | 选填 | Replicate API Token | `r8_...` |

---

## 🚀 部署方式概览

详细配置指引请参阅 **[部署指南 (DEPLOYMENT.md)](./DEPLOYMENT.md)**，包含以下部署支持：

1. **Cloudflare Pages 代码上传部署 (Wrangler Upload)**：通过命令行一键打包上传至 Cloudflare Pages。
2. **Cloudflare Pages Git 拉取部署 (Pages Integration)**：关联 GitHub 仓库，提交代码即自动构建部署。
3. **Cloudflare D1 数据库绑定**：实现云端用户登录、收藏夹与历史记录同步。
4. **Vercel / Netlify / Zeabur 部署**：原生兼容 Next.js 一键部署。
5. **Docker / Docker Compose 部署**：内置多阶段 Dockerfile 容器化构建。
6. **Wasmer Edge 部署**：内置 Wasmer.toml 配置文件。

---

## 📂 静态资源与文件获取路径

- **首页应用**：`/`
- **图像生成接口**：`/api/generate`
- **身份认证接口**：`/api/auth`
- **数据同步接口**：`/api/sync`
- **图标与静态文件**：
  - 应用 Logo 与图标文件位于 `public/` 目录下（例如 `/icon.svg`、`/icon-light-32x32.png`、`/icon-dark-32x32.png`）。
  - 部署后在浏览器中可直接通过相对路径访问（如 `https://your-domain.com/icon.svg`）。

---

## 📄 授权协议

本项目采用 [MIT License](./LICENSE) 开源协议。

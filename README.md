# 白狐 (WhiteFox AI) - AI 图像生成与创作平台

![WhiteFox AI](public/icon.svg)

白狐 (WhiteFox AI) 是一款功能强大、界面精美的多语言 AI 图像生成与提示词管理平台。支持文本生成图像、图像转换、参考图生成、批量多图生成、魔法咒语、提示词笔记本及云端/本地无库同步。

---

## 🌟 核心特色

- 📱 **极佳手机移动端适配**：响应式导航栏、手机底部快捷导航、抽屉式抽屉设置与触控友好交互。
- 🌓 **一键夜间/日间模式切换**：支持跟随系统及一键深色/浅色主题自由切换。
- 🖼️ **高清优质出图与一键四图生成**：内置高质量 Cloudflare AI / DALL-E 3 提示词增强，支持 1~4 张批量快速出图。
- 🔐 **轻量登录与注册**：
  - **无需数据库模式**：开箱即用，免配置数据库，数据存储于浏览器极速体验。
  - **D1 数据库绑定**：可绑定 Cloudflare D1 数据库，实现多设备账号同步与收藏夹同步。
  - **管理员识别**：通过部署环境变量 `ADMIN_PASSWORD` 灵活配置管理员密码。
- 🪄 **魔法咒语与提示词笔记本**：预置丰富风格咒语，支持自定义分类、收藏与一键套用。
- 🚀 **全平台部署支持**：支持 Cloudflare Pages 代码上传部署与 Git 拉取部署、Vercel、Docker、Wasmer 等。

---

## 🚀 快速开始 (Getting Started)

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm dev

# 打开浏览器访问 http://localhost:3000
```

### 构建与打包

```bash
pnpm build
pnpm start
```

---

## 🛠️ 部署指南 (Deployment Guide)

本项目支持多种无缝部署方式：
- **Cloudflare Pages** (代码直接上传部署 `npx wrangler pages deploy` / Git 自动化部署)
- **Cloudflare D1** 数据库关联与同步
- **Vercel / Netlify / Zeabur**
- **Docker & Docker Compose**
- **Wasmer**

完整部署命令、关键环境变量配置与文件路径说明请参阅 **[部署指南 (DEPLOYMENT.md)](./DEPLOYMENT.md)**。

---

## 🔑 核心环境变量

| 变量名 | 说明 |
| :--- | :--- |
| `ADMIN_PASSWORD` | 管理员密码（登录时识别管理员身份） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `OPENAI_API_KEY` | OpenAI API Key (可选) |

---

## 📄 开源协议

[MIT License](./LICENSE)

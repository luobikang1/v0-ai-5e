import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "whitefox_salt_2025")
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, isAdmin } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "密码不能为空" }, { status: 400 })
    }

    // Check admin login via server-only env variable
    const adminEnvPassword = process.env.ADMIN_PASSWORD

    if (isAdmin) {
      if (!adminEnvPassword) {
        return NextResponse.json({ error: "未设置 ADMIN_PASSWORD 部署环境变量，无法进入管理员模式" }, { status: 403 })
      }
      if (password === adminEnvPassword) {
        return NextResponse.json({
          success: true,
          user: {
            id: "admin_user",
            username: username || "Administrator",
            isAdmin: true,
          },
          token: "admin_token_" + Date.now(),
        })
      } else {
        return NextResponse.json({ error: "管理员密码不正确" }, { status: 401 })
      }
    }

    if (!username) {
      return NextResponse.json({ error: "用户名不能为空" }, { status: 400 })
    }

    // Try D1 DB if bound
    // @ts-ignore
    const db = process.env.DB || (globalThis as any).DB || request.env?.DB

    if (db) {
      try {
        const passwordHash = await hashPassword(password)
        const stmt = db.prepare("SELECT * FROM users WHERE username = ?")
        const user = await stmt.bind(username).first()

        if (!user || user.password_hash !== passwordHash) {
          return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 })
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin === 1,
          },
          token: `token_${user.id}_${Date.now()}`,
        })
      } catch (dbError) {
        console.error("D1 database query failed, falling back to local auth mode:", dbError)
      }
    }

    // Fallback: Local offline mode (without database requirement)
    const userId = "local_" + btoa(username).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username,
        isAdmin: false,
      },
      token: `local_token_${userId}_${Date.now()}`,
    })
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "登录失败" },
      { status: 500 }
    )
  }
}

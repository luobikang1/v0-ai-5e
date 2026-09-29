import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface AuthRequest {
  action: "login" | "register" | "verifyAdmin"
  username?: string
  password?: string
  adminPassword?: string
}

function getD1Binding(): any {
  try {
    // In @cloudflare/next-on-pages, bindings can be accessed on process.env
    return (process.env as any).DB || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AuthRequest = await request.json()
    const { action, username, password, adminPassword } = body
    const envAdminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123456"

    const db = getD1Binding()

    // Action: Verify Admin Password
    if (action === "verifyAdmin") {
      if (adminPassword && adminPassword === envAdminPassword) {
        return NextResponse.json({
          success: true,
          user: {
            id: "admin-root",
            username: "Admin (管理员)",
            isAdmin: true,
            storageMode: db ? "d1" : "local",
          },
        })
      } else {
        return NextResponse.json({ success: false, error: "管理员密码错误" }, { status: 401 })
      }
    }

    // Action: Login
    if (action === "login") {
      if (!username || !password) {
        return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 })
      }

      // Check if admin password was entered as password
      if (password === envAdminPassword) {
        return NextResponse.json({
          success: true,
          user: {
            id: `admin-${username}`,
            username: `${username} (管理员)`,
            isAdmin: true,
            storageMode: db ? "d1" : "local",
          },
        })
      }

      // If D1 is bound, check database
      if (db) {
        try {
          const userStmt = db.prepare("SELECT * FROM users WHERE username = ?")
          const user = await userStmt.bind(username).first()

          if (!user || user.password_hash !== password) {
            return NextResponse.json({ error: "用户名或密码不正确" }, { status: 401 })
          }

          return NextResponse.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              isAdmin: Boolean(user.is_admin),
              storageMode: "d1",
            },
          })
        } catch (dbError) {
          console.error("D1 Query Error:", dbError)
          // Fallback to local mode
        }
      }

      // Without DB / Local storage fallback mode
      return NextResponse.json({
        success: true,
        user: {
          id: `local-user-${Date.now()}`,
          username: username,
          isAdmin: false,
          storageMode: "local",
        },
      })
    }

    // Action: Register
    if (action === "register") {
      if (!username || !password) {
        return NextResponse.json({ error: "注册时用户名和密码不能为空" }, { status: 400 })
      }

      const userId = `user-${Date.now()}`
      const isAdmin = password === envAdminPassword

      if (db) {
        try {
          // Check existing user
          const existing = await db.prepare("SELECT id FROM users WHERE username = ?").bind(username).first()
          if (existing) {
            return NextResponse.json({ error: "该用户名已被注册" }, { status: 400 })
          }

          await db
            .prepare("INSERT INTO users (id, username, password_hash, is_admin) VALUES (?, ?, ?, ?)")
            .bind(userId, username, password, isAdmin ? 1 : 0)
            .run()

          return NextResponse.json({
            success: true,
            user: {
              id: userId,
              username: username,
              isAdmin: isAdmin,
              storageMode: "d1",
            },
          })
        } catch (dbError) {
          console.error("D1 Register Error:", dbError)
        }
      }

      // Register without DB (Local Storage mode)
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          username: username,
          isAdmin: isAdmin,
          storageMode: "local",
        },
      })
    }

    return NextResponse.json({ error: "无效的请求操作" }, { status: 400 })
  } catch (error) {
    console.error("Auth route error:", error)
    return NextResponse.json({ error: "服务器认证出错" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface SyncRequest {
  userId: string
  favorites?: any[]
  notes?: any[]
  albums?: any[]
}

function getD1Binding(): any {
  try {
    return (process.env as any).DB || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const db = getD1Binding()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!db) {
    return NextResponse.json({
      isCloudSynced: false,
      mode: "local",
      message: "Cloudflare D1 未绑定，使用浏览器本地存储",
    })
  }

  if (!userId) {
    return NextResponse.json({ error: "未提供用户 ID" }, { status: 400 })
  }

  try {
    const favsRes = await db.prepare("SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all()
    const notesRes = await db.prepare("SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC").bind(userId).all()
    const albumsRes = await db.prepare("SELECT * FROM albums WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all()

    return NextResponse.json({
      isCloudSynced: true,
      mode: "d1",
      favorites: favsRes.results || [],
      notes: notesRes.results || [],
      albums: albumsRes.results || [],
    })
  } catch (error) {
    console.error("D1 Fetch Error:", error)
    return NextResponse.json({
      isCloudSynced: false,
      mode: "local",
      error: "D1 数据库读取失败，降级为本地存储",
    })
  }
}

export async function POST(request: NextRequest) {
  const db = getD1Binding()

  if (!db) {
    return NextResponse.json({
      isCloudSynced: false,
      mode: "local",
      message: "Cloudflare D1 未绑定，保持本地同步",
    })
  }

  try {
    const body: SyncRequest = await request.json()
    const { userId, favorites, notes } = body

    if (!userId) {
      return NextResponse.json({ error: "同步失败：缺少用户 ID" }, { status: 400 })
    }

    if (favorites && Array.isArray(favorites)) {
      for (const item of favorites) {
        await db
          .prepare(
            `INSERT INTO favorites (id, user_id, item_type, title, prompt, negative_prompt, image_url, model)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
             prompt=excluded.prompt, image_url=excluded.image_url`
          )
          .bind(
            item.id || `fav-${Date.now()}`,
            userId,
            item.itemType || "image",
            item.title || "",
            item.prompt || "",
            item.negativePrompt || "",
            item.imageUrl || "",
            item.model || ""
          )
          .run()
      }
    }

    if (notes && Array.isArray(notes)) {
      for (const note of notes) {
        await db
          .prepare(
            `INSERT INTO notes (id, user_id, title, prompt, negative_prompt)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
             title=excluded.title, prompt=excluded.prompt, negative_prompt=excluded.negative_prompt`
          )
          .bind(note.id || `note-${Date.now()}`, userId, note.title || "", note.prompt || "", note.negativePrompt || "")
          .run()
      }
    }

    return NextResponse.json({
      isCloudSynced: true,
      mode: "d1",
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("D1 Sync Post Error:", error)
    return NextResponse.json({
      isCloudSynced: false,
      mode: "local",
      error: "D1 同步处理异常",
    })
  }
}

import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 })
    }

    // @ts-ignore
    const db = process.env.DB || (globalThis as any).DB || request.env?.DB

    if (db) {
      try {
        const syncRow = await db.prepare("SELECT * FROM user_sync WHERE user_id = ?").bind(userId).first()
        const favoritesRows = await db.prepare("SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all()

        return NextResponse.json({
          success: true,
          data: syncRow ? {
            history: syncRow.history_data ? JSON.parse(syncRow.history_data as string) : [],
            notes: syncRow.notes_data ? JSON.parse(syncRow.notes_data as string) : [],
            albums: syncRow.albums_data ? JSON.parse(syncRow.albums_data as string) : [],
            spells: syncRow.spells_data ? JSON.parse(syncRow.spells_data as string) : [],
            models: syncRow.models_data ? JSON.parse(syncRow.models_data as string) : [],
          } : null,
          favorites: favoritesRows?.results || [],
        })
      } catch (err) {
        console.error("D1 fetch sync error:", err)
      }
    }

    return NextResponse.json({ success: true, data: null, favorites: [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "获取同步数据失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, favorites, history, notes, albums, spells, models } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 })
    }

    // @ts-ignore
    const db = process.env.DB || (globalThis as any).DB || request.env?.DB

    if (db) {
      try {
        // Upsert user sync data
        await db.prepare(`
          INSERT INTO user_sync (user_id, history_data, notes_data, albums_data, spells_data, models_data, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET
            history_data = excluded.history_data,
            notes_data = excluded.notes_data,
            albums_data = excluded.albums_data,
            spells_data = excluded.spells_data,
            models_data = excluded.models_data,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          userId,
          history ? JSON.stringify(history) : null,
          notes ? JSON.stringify(notes) : null,
          albums ? JSON.stringify(albums) : null,
          spells ? JSON.stringify(spells) : null,
          models ? JSON.stringify(models) : null
        ).run()

        // Sync favorites if provided
        if (Array.isArray(favorites)) {
          await db.prepare("DELETE FROM favorites WHERE user_id = ?").bind(userId).run()
          for (const fav of favorites) {
            await db.prepare(`
              INSERT INTO favorites (id, user_id, image_data, prompt, negative_prompt, model, width, height, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              fav.id || Date.now().toString(),
              userId,
              fav.imageData || fav.url || "",
              fav.prompt || "",
              fav.negativePrompt || "",
              fav.model || "",
              fav.width || 1024,
              fav.height || 1024,
              fav.createdAt || new Date().toISOString()
            ).run()
          }
        }

        return NextResponse.json({ success: true, syncedWithD1: true })
      } catch (dbErr) {
        console.error("D1 sync save error:", dbErr)
      }
    }

    return NextResponse.json({ success: true, syncedWithD1: false, message: "本地模式同步完成" })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "同步失败" }, { status: 500 })
  }
}

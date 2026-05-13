import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, steps, mode, sourceImage, strength } = await request.json()

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "缺少 Cloudflare 配置。请设置 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN 环境变量。" },
        { status: 500 }
      )
    }

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`

    let body: Record<string, unknown> = {
      prompt,
      num_steps: steps,
    }

    // For image-to-image, we need to include the source image
    if (mode === "image-to-image" && sourceImage) {
      // Extract base64 data from data URL
      const base64Data = sourceImage.split(",")[1]
      body = {
        prompt,
        image: Array.from(Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))),
        strength: strength || 0.75,
        num_steps: steps,
      }
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Cloudflare AI Error:", errorText)
      return NextResponse.json(
        { error: `Cloudflare AI 请求失败: ${response.status}` },
        { status: response.status }
      )
    }

    // The response is the image data directly
    const imageData = await response.arrayBuffer()

    return new NextResponse(imageData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json(
      { error: "图像生成失败，请稍后重试" },
      { status: 500 }
    )
  }
}

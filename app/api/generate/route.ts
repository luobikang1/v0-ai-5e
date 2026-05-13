import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, steps, mode, sourceImage, strength, provider, endpoint } = await request.json()

    // Handle custom external model endpoints
    if (provider === "custom" && endpoint) {
      return handleCustomEndpoint({ prompt, model, steps, mode, sourceImage, strength, endpoint })
    }

    // Handle Cloudflare AI
    return handleCloudflareAI({ prompt, model, steps, mode, sourceImage, strength })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json(
      { error: "图像生成失败，请稍后重试" },
      { status: 500 }
    )
  }
}

async function handleCloudflareAI({
  prompt,
  model,
  steps,
  mode,
  sourceImage,
  strength,
}: {
  prompt: string
  model: string
  steps: number
  mode: string
  sourceImage?: string
  strength?: number
}) {
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
}

async function handleCustomEndpoint({
  prompt,
  model,
  steps,
  mode,
  sourceImage,
  strength,
  endpoint,
}: {
  prompt: string
  model: string
  steps: number
  mode: string
  sourceImage?: string
  strength?: number
  endpoint: string
}) {
  // Generic custom endpoint handler
  // Supports common API formats (OpenAI-style, Replicate-style, etc.)
  const body: Record<string, unknown> = {
    prompt,
    model,
    num_inference_steps: steps,
    steps,
  }

  if (mode === "image-to-image" && sourceImage) {
    body.init_image = sourceImage
    body.image = sourceImage
    body.strength = strength || 0.75
  }

  const customApiKey = process.env.CUSTOM_AI_API_KEY

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (customApiKey) {
    headers["Authorization"] = `Bearer ${customApiKey}`
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Custom API Error:", errorText)
    return NextResponse.json(
      { error: `自定义 API 请求失败: ${response.status}` },
      { status: response.status }
    )
  }

  const contentType = response.headers.get("content-type")

  // Handle different response formats
  if (contentType?.includes("image/")) {
    // Direct image response
    const imageData = await response.arrayBuffer()
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    })
  }

  // JSON response with base64 image or URL
  const jsonResponse = await response.json()
  
  // Try common response formats
  const imageUrl = jsonResponse.output?.[0] || 
                   jsonResponse.data?.[0]?.url || 
                   jsonResponse.image || 
                   jsonResponse.images?.[0]?.url ||
                   jsonResponse.result?.image

  const base64Image = jsonResponse.data?.[0]?.b64_json ||
                      jsonResponse.image_base64 ||
                      jsonResponse.result?.image_base64

  if (base64Image) {
    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0))
    return new NextResponse(binaryData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    })
  }

  if (imageUrl) {
    // Fetch the image from URL
    const imageResponse = await fetch(imageUrl)
    const imageData = await imageResponse.arrayBuffer()
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": imageResponse.headers.get("content-type") || "image/png",
        "Cache-Control": "no-cache",
      },
    })
  }

  return NextResponse.json(
    { error: "无法解析自定义 API 响应格式" },
    { status: 500 }
  )
}

import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface ModelConfig {
  id: string
  name: string
  endpoint: string
  apiKeyEnvVar: string
  type: "cloudflare" | "openai" | "replicate" | "custom"
}

interface GenerateRequest {
  prompt: string
  negativePrompt?: string
  model: string
  modelConfig?: ModelConfig
  steps: number
  mode: string
  sourceImage?: string
  referenceImage?: string
  strength?: number
  referenceStrength?: number
  sampler?: string
  width?: number
  height?: number
  backgroundColor?: string
  batchCount?: number // 1 - 4
}

async function generateSingleCloudflare(
  request: GenerateRequest,
  accountId: string,
  apiToken: string
): Promise<ArrayBuffer> {
  const modelId = request.modelConfig?.endpoint || request.model
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`

  let body: Record<string, unknown> = {
    prompt: request.prompt,
    num_steps: Math.min(request.steps || 20, 50),
  }

  if (request.negativePrompt) {
    body.negative_prompt = request.negativePrompt
  }

  if (request.width && request.height) {
    body.width = request.width
    body.height = request.height
  }

  if (request.sampler) {
    body.scheduler = request.sampler
  }

  if (request.mode === "image-to-image" && request.sourceImage) {
    const base64Data = request.sourceImage.split(",")[1]
    body = {
      ...body,
      image: Array.from(Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))),
      strength: request.strength || 0.75,
    }
  }

  if (request.mode === "reference-image" && request.referenceImage) {
    const base64Data = request.referenceImage.split(",")[1]
    body = {
      ...body,
      image: Array.from(Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))),
      strength: request.referenceStrength || 0.5,
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
    throw new Error(`Cloudflare AI 请求失败 (${response.status}): ${errorText.slice(0, 100)}`)
  }

  return response.arrayBuffer()
}

async function generateWithOpenAI(
  request: GenerateRequest,
  apiKey: string,
  n: number
): Promise<string[]> {
  const endpoint = request.modelConfig?.endpoint || "https://api.openai.com/v1/images/generations"
  
  const body: Record<string, unknown> = {
    prompt: request.negativePrompt 
      ? `${request.prompt}. Avoid: ${request.negativePrompt}`
      : request.prompt,
    n: Math.min(Math.max(n, 1), 4),
    size: request.width && request.height 
      ? `${request.width}x${request.height}` 
      : "1024x1024",
    response_format: "b64_json",
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("OpenAI Error:", errorText)
    throw new Error(`OpenAI API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  const b64List = data.data?.map((item: { b64_json: string }) => `data:image/png;base64,${item.b64_json}`) || []
  return b64List
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return `data:image/png;base64,${btoa(binary)}`
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { modelConfig } = body
    const batchCount = Math.min(Math.max(body.batchCount || 1, 1), 4)

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    const modelType = modelConfig?.type || "cloudflare"
    const images: string[] = []

    if (modelType === "cloudflare") {
      if (!accountId || !apiToken) {
        return NextResponse.json(
          { error: "缺少 Cloudflare 配置。请设置 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN 环境变量。" },
          { status: 500 }
        )
      }

      // Generate batch images concurrently
      const promises = Array.from({ length: batchCount }).map(() =>
        generateSingleCloudflare(body, accountId, apiToken)
      )
      const buffers = await Promise.all(promises)
      for (const buf of buffers) {
        images.push(arrayBufferToBase64(buf))
      }
    } else if (modelType === "openai") {
      const apiKey = process.env[modelConfig?.apiKeyEnvVar || "CUSTOM_AI_API_KEY"] || process.env.OPENAI_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: "缺少 OpenAI API Key。请设置相应的环境变量。" },
          { status: 500 }
        )
      }
      const b64s = await generateWithOpenAI(body, apiKey, batchCount)
      images.push(...b64s)
    } else {
      // Fallback custom or replicate
      if (!accountId || !apiToken) {
        return NextResponse.json(
          { error: "配置不足，无法生成图像。" },
          { status: 500 }
        )
      }
      const buf = await generateSingleCloudflare(body, accountId, apiToken)
      images.push(arrayBufferToBase64(buf))
    }

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "图像生成失败，请稍后重试" },
      { status: 500 }
    )
  }
}

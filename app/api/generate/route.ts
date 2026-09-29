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
}

async function generateWithCloudflare(
  request: GenerateRequest,
  accountId: string,
  apiToken: string,
  aiBinding?: any
): Promise<ArrayBuffer> {
  const modelId = request.modelConfig?.endpoint || request.model

  let body: Record<string, unknown> = {
    prompt: request.prompt,
    num_steps: request.steps || 20,
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

  // For image-to-image
  if (request.mode === "image-to-image" && request.sourceImage) {
    const base64Data = request.sourceImage.replace(/^data:image\/\w+;base64,/, "")
    body.image = Array.from(Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)))
    body.strength = request.strength || 0.75
  }

  // For reference image mode
  if (request.mode === "reference-image" && request.referenceImage) {
    const base64Data = request.referenceImage.replace(/^data:image\/\w+;base64,/, "")
    body.image = Array.from(Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)))
    body.strength = request.referenceStrength || 0.5
  }

  // Try Workers AI Native Binding first if attached
  if (aiBinding && typeof aiBinding.run === "function") {
    try {
      const bindingRes = await aiBinding.run(modelId, body)
      if (bindingRes instanceof ArrayBuffer) return bindingRes
      if (bindingRes instanceof ReadableStream) return await new Response(bindingRes).arrayBuffer()
      if (typeof bindingRes === "object" && bindingRes !== null) {
        const b64 = bindingRes.image || bindingRes.result?.image
        if (b64) {
          const binaryString = atob(b64.replace(/^data:image\/\w+;base64,/, ""))
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          return bytes.buffer
        }
      }
    } catch (bindErr) {
      console.warn("Workers AI Binding execute warning, fallback to REST API:", bindErr)
    }
  }

  if (!accountId || !apiToken) {
    throw new Error("缺少 Cloudflare 配置。请设置 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN 环境变量。")
  }

  const cleanAccountId = accountId.trim()
  const cleanApiToken = apiToken.trim()
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${cleanAccountId}/ai/run/${modelId}`

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cleanApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Cloudflare AI Error:", errorText)
    let parsedMsg = ""
    try {
      const errJson = JSON.parse(errorText)
      if (errJson.errors && errJson.errors.length > 0) {
        parsedMsg = errJson.errors.map((e: any) => e.message || e.code).join("; ")
      }
    } catch {
      parsedMsg = errorText
    }
    throw new Error(`Cloudflare AI 请求失败 (${response.status}): ${parsedMsg || errorText.slice(0, 200)}`)
  }

  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    const json = await response.json()
    if (json.success === false) {
      const msg = json.errors?.map((e: any) => e.message).join("; ") || "Cloudflare AI 生成失败"
      throw new Error(msg)
    }

    const b64Image = json.result?.image || json.image || (typeof json.result === "string" ? json.result : null)
    if (b64Image) {
      const cleanB64 = b64Image.replace(/^data:image\/\w+;base64,/, "")
      const binaryString = atob(cleanB64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes.buffer
    }
    throw new Error("Cloudflare AI 响应未能解析为图像数据")
  }

  return response.arrayBuffer()
}

async function generateWithOpenAI(
  request: GenerateRequest,
  apiKey: string
): Promise<ArrayBuffer> {
  const endpoint = request.modelConfig?.endpoint || "https://api.openai.com/v1/images/generations"
  
  const body: Record<string, unknown> = {
    prompt: request.negativePrompt 
      ? `${request.prompt}. Avoid: ${request.negativePrompt}`
      : request.prompt,
    n: 1,
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
  const base64Image = data.data?.[0]?.b64_json

  if (!base64Image) {
    throw new Error("未能获取生成的图像")
  }

  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64Image)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

async function generateWithReplicate(
  request: GenerateRequest,
  apiKey: string
): Promise<ArrayBuffer> {
  const endpoint = request.modelConfig?.endpoint || "https://api.replicate.com/v1/predictions"

  const body = {
    input: {
      prompt: request.prompt,
      negative_prompt: request.negativePrompt || "",
      num_inference_steps: request.steps,
      width: request.width || 1024,
      height: request.height || 1024,
      scheduler: request.sampler || "euler_a",
    },
  }

  // Start prediction
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Replicate Error:", errorText)
    throw new Error(`Replicate API 请求失败: ${response.status}`)
  }

  const prediction = await response.json()

  // Poll for completion
  let result = prediction
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const pollResponse = await fetch(result.urls.get, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    })
    result = await pollResponse.json()
  }

  if (result.status === "failed") {
    throw new Error("Replicate 生成失败")
  }

  // Fetch the image
  const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
  const imageResponse = await fetch(imageUrl)
  return imageResponse.arrayBuffer()
}

async function generateWithCustomAPI(
  request: GenerateRequest,
  apiKey: string
): Promise<ArrayBuffer> {
  const endpoint = request.modelConfig?.endpoint

  if (!endpoint) {
    throw new Error("未配置自定义 API 端点")
  }

  const body = {
    prompt: request.prompt,
    negative_prompt: request.negativePrompt,
    steps: request.steps,
    mode: request.mode,
    source_image: request.sourceImage,
    strength: request.strength,
    sampler: request.sampler,
    width: request.width,
    height: request.height,
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Custom API Error:", errorText)
    throw new Error(`自定义 API 请求失败: ${response.status}`)
  }

  // Check content type
  const contentType = response.headers.get("content-type")

  if (contentType?.includes("application/json")) {
    // Try to extract image from JSON response
    const data = await response.json()
    const base64Image = data.image || data.data?.[0]?.b64_json || data.output

    if (typeof base64Image === "string") {
      // Handle base64 or URL
      if (base64Image.startsWith("http")) {
        const imageResponse = await fetch(base64Image)
        return imageResponse.arrayBuffer()
      } else {
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "")
        const binaryString = atob(cleanBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes.buffer
      }
    }
    throw new Error("无法解析 API 响应")
  }

  // Assume binary image data
  return response.arrayBuffer()
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { modelConfig } = body

    const reqEnv = (request as any).env || {}

    const accountId = (
      process.env.CLOUDFLARE_ACCOUNT_ID ||
      process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID ||
      (globalThis as any).CLOUDFLARE_ACCOUNT_ID ||
      reqEnv.CLOUDFLARE_ACCOUNT_ID ||
      ""
    ).trim()

    const apiToken = (
      process.env.CLOUDFLARE_API_TOKEN ||
      process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN ||
      (globalThis as any).CLOUDFLARE_API_TOKEN ||
      reqEnv.CLOUDFLARE_API_TOKEN ||
      ""
    ).trim()

    const aiBinding = reqEnv.AI || (process.env as any).AI || (globalThis as any).AI

    let imageData: ArrayBuffer

    // Determine which API to use based on model config
    const modelType = modelConfig?.type || "cloudflare"

    switch (modelType) {
      case "cloudflare": {
        imageData = await generateWithCloudflare(body, accountId, apiToken, aiBinding)
        break
      }

      case "openai": {
        const apiKey = process.env[modelConfig?.apiKeyEnvVar || "CUSTOM_AI_API_KEY"] || process.env.OPENAI_API_KEY
        if (!apiKey) {
          return NextResponse.json(
            { error: "缺少 OpenAI API Key。请设置相应的环境变量。" },
            { status: 500 }
          )
        }
        imageData = await generateWithOpenAI(body, apiKey)
        break
      }

      case "replicate": {
        const apiKey = process.env[modelConfig?.apiKeyEnvVar || "CUSTOM_AI_API_KEY"] || process.env.REPLICATE_API_TOKEN
        if (!apiKey) {
          return NextResponse.json(
            { error: "缺少 Replicate API Token。请设置相应的环境变量。" },
            { status: 500 }
          )
        }
        imageData = await generateWithReplicate(body, apiKey)
        break
      }

      case "custom": {
        const apiKey = process.env[modelConfig?.apiKeyEnvVar || "CUSTOM_AI_API_KEY"] || ""
        imageData = await generateWithCustomAPI(body, apiKey)
        break
      }

      default:
        return NextResponse.json(
          { error: "不支持的模型类型" },
          { status: 400 }
        )
    }

    return new NextResponse(imageData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "图像生成失败，请稍后重试" },
      { status: 500 }
    )
  }
}

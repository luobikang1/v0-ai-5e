"use client"

import { useState } from "react"
import { ImageIcon, Wand2, Upload, Sparkles, Download, Trash2, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  timestamp: Date
}

const MODELS = [
  { id: "@cf/stabilityai/stable-diffusion-xl-base-1.0", name: "Stable Diffusion XL", description: "高质量图像生成" },
  { id: "@cf/lykon/dreamshaper-8-lcm", name: "DreamShaper 8 LCM", description: "快速创意生成" },
  { id: "@cf/bytedance/stable-diffusion-xl-lightning", name: "SDXL Lightning", description: "极速生成" },
]

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const [steps, setSteps] = useState([20])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [activeTab, setActiveTab] = useState("text-to-image")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [strength, setStrength] = useState([0.75])
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          steps: steps[0],
          mode: activeTab,
          sourceImage: uploadedImage,
          strength: strength[0],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "生成失败")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url,
        prompt,
        timestamp: new Date(),
      }

      setGeneratedImages((prev) => [newImage, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成图像时发生错误")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = `ai-image-${prompt.slice(0, 20).replace(/\s+/g, "-")}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDelete = (id: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">AI 图像生成器</h1>
              <p className="text-xs text-muted-foreground">Powered by Cloudflare AI</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                <TabsTrigger value="text-to-image" className="gap-2 data-[state=active]:bg-card">
                  <Wand2 className="w-4 h-4" />
                  文本生成图像
                </TabsTrigger>
                <TabsTrigger value="image-to-image" className="gap-2 data-[state=active]:bg-card">
                  <ImageIcon className="w-4 h-4" />
                  图像转换
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text-to-image" className="mt-6 space-y-4">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" />
                      输入提示词
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="描述您想要生成的图像...例如：一只可爱的橙色猫咪坐在窗台上，阳光透过窗户洒落"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] bg-secondary/30 border-border/50 resize-none text-foreground placeholder:text-muted-foreground"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="image-to-image" className="mt-6 space-y-4">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      上传源图像
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-secondary/20",
                        uploadedImage && "border-primary/50 bg-secondary/20"
                      )}
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      {uploadedImage ? (
                        <div className="space-y-4">
                          <img
                            src={uploadedImage}
                            alt="Uploaded"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <p className="text-sm text-muted-foreground">点击更换图像</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            点击或拖拽上传图像
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            支持 PNG, JPG, WebP
                          </p>
                        </div>
                      )}
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">转换强度: {strength[0].toFixed(2)}</Label>
                      <Slider
                        value={strength}
                        onValueChange={setStrength}
                        min={0.1}
                        max={1}
                        step={0.05}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground/70">
                        较低的值保留更多原图特征，较高的值生成更多新内容
                      </p>
                    </div>

                    <Textarea
                      placeholder="描述您想要的转换效果...例如：将这张照片转换成水彩画风格"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[80px] bg-secondary/30 border-border/50 resize-none text-foreground placeholder:text-muted-foreground"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || (activeTab === "image-to-image" && !uploadedImage)}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {isGenerating ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  正在生成...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  生成图像
                </>
              )}
            </Button>

            {/* Error Display */}
            {error && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardContent className="py-4">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Generated Images Gallery */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                生成结果
                {generatedImages.length > 0 && (
                  <span className="text-sm text-muted-foreground">({generatedImages.length})</span>
                )}
              </h2>

              {generatedImages.length === 0 ? (
                <Card className="bg-card/30 border-border/30">
                  <CardContent className="py-16 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">还没有生成任何图像</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      输入提示词并点击生成按钮开始创作
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {generatedImages.map((image) => (
                    <Card key={image.id} className="bg-card/50 border-border/50 overflow-hidden group">
                      <div className="relative aspect-square">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                              onClick={() => handleDownload(image.url, image.prompt)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              下载
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-white/20 hover:bg-destructive/80 backdrop-blur-sm text-white"
                              onClick={() => handleDelete(image.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <CardContent className="py-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{image.prompt}</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">
                          {image.timestamp.toLocaleTimeString("zh-CN")}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Settings */}
          <div className="space-y-6">
            <Card className="bg-card/50 border-border/50 sticky top-24">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  生成设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Model Selection */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">AI 模型</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-secondary/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-col items-start">
                            <span>{model.name}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">推理步数: {steps[0]}</Label>
                  <Slider
                    value={steps}
                    onValueChange={setSteps}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground/70">
                    更多步数可能提高质量，但会增加生成时间
                  </p>
                </div>

                {/* Tips */}
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-medium text-foreground mb-3">提示词技巧</h3>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      使用详细的描述词来获得更好的结果
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      包含风格关键词，如"油画风格"、"写实"、"动漫"
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      添加光线和氛围描述可以提升效果
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      英文提示词通常效果更佳
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

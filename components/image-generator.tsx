"use client"

import { useState, useCallback } from "react"
import { 
  ImageIcon, Wand2, Upload, Sparkles, Download, Trash2, Settings2, 
  Plus, X, BookOpen, Save, FolderOpen, ExternalLink, Copy, Check,
  ChevronDown, ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  negativePrompt: string
  timestamp: Date
  model: string
}

interface NegativePromptPreset {
  id: string
  name: string
  prompts: string[]
  isCustom: boolean
}

interface CustomModel {
  id: string
  name: string
  endpoint: string
  apiKeyEnvVar: string
  type: "cloudflare" | "openai" | "replicate" | "custom"
}

const DEFAULT_MODELS: CustomModel[] = [
  { id: "@cf/stabilityai/stable-diffusion-xl-base-1.0", name: "Stable Diffusion XL", endpoint: "", apiKeyEnvVar: "", type: "cloudflare" },
  { id: "@cf/lykon/dreamshaper-8-lcm", name: "DreamShaper 8 LCM", endpoint: "", apiKeyEnvVar: "", type: "cloudflare" },
  { id: "@cf/bytedance/stable-diffusion-xl-lightning", name: "SDXL Lightning", endpoint: "", apiKeyEnvVar: "", type: "cloudflare" },
]

const DEFAULT_NEGATIVE_PRESETS: NegativePromptPreset[] = [
  {
    id: "quality",
    name: "低质量过滤",
    prompts: ["blurry", "low quality", "low resolution", "pixelated", "jpeg artifacts", "compression artifacts"],
    isCustom: false,
  },
  {
    id: "anatomy",
    name: "人体结构",
    prompts: ["bad anatomy", "extra limbs", "missing limbs", "deformed", "disfigured", "mutated", "extra fingers", "fused fingers"],
    isCustom: false,
  },
  {
    id: "style",
    name: "风格排除",
    prompts: ["cartoon", "anime", "3d render", "cgi", "illustration", "painting", "drawing"],
    isCustom: false,
  },
  {
    id: "nsfw",
    name: "安全内容",
    prompts: ["nsfw", "nude", "explicit", "adult content", "violence", "gore", "disturbing"],
    isCustom: false,
  },
  {
    id: "artifacts",
    name: "AI瑕疵",
    prompts: ["watermark", "signature", "text", "logo", "username", "artist name", "border", "frame"],
    isCustom: false,
  },
]

const DOWNLOAD_FORMATS = [
  { id: "png", name: "PNG", mime: "image/png" },
  { id: "jpg", name: "JPG", mime: "image/jpeg" },
  { id: "webp", name: "WebP", mime: "image/webp" },
]

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0].id)
  const [models, setModels] = useState<CustomModel[]>(DEFAULT_MODELS)
  const [steps, setSteps] = useState([20])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [activeTab, setActiveTab] = useState("text-to-image")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [strength, setStrength] = useState([0.75])
  const [error, setError] = useState<string | null>(null)
  
  // Negative prompt presets
  const [negativePresets, setNegativePresets] = useState<NegativePromptPreset[]>(DEFAULT_NEGATIVE_PRESETS)
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [customNegativePrompts, setCustomNegativePrompts] = useState<string[]>([])
  const [newCustomPrompt, setNewCustomPrompt] = useState("")
  const [useNegativePrompt, setUseNegativePrompt] = useState(true)
  const [negativePromptOpen, setNegativePromptOpen] = useState(true)
  
  // Custom preset dialog
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [newPresetPrompts, setNewPresetPrompts] = useState("")
  
  // Model dialog
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [newModelName, setNewModelName] = useState("")
  const [newModelEndpoint, setNewModelEndpoint] = useState("")
  const [newModelType, setNewModelType] = useState<"cloudflare" | "openai" | "replicate" | "custom">("custom")
  const [newModelApiKey, setNewModelApiKey] = useState("")
  
  // Download
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Build complete negative prompt from selected presets and custom prompts
  const buildNegativePrompt = useCallback(() => {
    if (!useNegativePrompt) return ""
    
    const presetPrompts = selectedPresets.flatMap(presetId => {
      const preset = negativePresets.find(p => p.id === presetId)
      return preset ? preset.prompts : []
    })
    
    const allPrompts = [...presetPrompts, ...customNegativePrompts]
    if (negativePrompt.trim()) {
      allPrompts.push(negativePrompt.trim())
    }
    
    return [...new Set(allPrompts)].join(", ")
  }, [selectedPresets, customNegativePrompts, negativePrompt, negativePresets, useNegativePrompt])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setError(null)

    const finalNegativePrompt = buildNegativePrompt()
    const currentModel = models.find(m => m.id === selectedModel)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negativePrompt: finalNegativePrompt,
          model: selectedModel,
          modelConfig: currentModel,
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
        negativePrompt: finalNegativePrompt,
        timestamp: new Date(),
        model: currentModel?.name || selectedModel,
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

  const handleDownload = async (url: string, prompt: string, format: string) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const formatInfo = DOWNLOAD_FORMATS.find(f => f.id === format)
        const dataUrl = canvas.toDataURL(formatInfo?.mime || "image/png", 0.95)
        const a = document.createElement("a")
        a.href = dataUrl
        a.download = `ai-image-${prompt.slice(0, 20).replace(/\s+/g, "-")}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    }
    img.src = url
  }

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleDelete = (id: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== id))
  }

  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev => 
      prev.includes(presetId) 
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    )
  }

  const addCustomPrompt = () => {
    if (newCustomPrompt.trim() && !customNegativePrompts.includes(newCustomPrompt.trim())) {
      setCustomNegativePrompts(prev => [...prev, newCustomPrompt.trim()])
      setNewCustomPrompt("")
    }
  }

  const removeCustomPrompt = (prompt: string) => {
    setCustomNegativePrompts(prev => prev.filter(p => p !== prompt))
  }

  const saveCustomPreset = () => {
    if (newPresetName.trim() && newPresetPrompts.trim()) {
      const prompts = newPresetPrompts.split(",").map(p => p.trim()).filter(Boolean)
      const newPreset: NegativePromptPreset = {
        id: `custom-${Date.now()}`,
        name: newPresetName.trim(),
        prompts,
        isCustom: true,
      }
      setNegativePresets(prev => [...prev, newPreset])
      setNewPresetName("")
      setNewPresetPrompts("")
      setIsPresetDialogOpen(false)
    }
  }

  const deletePreset = (presetId: string) => {
    setNegativePresets(prev => prev.filter(p => p.id !== presetId))
    setSelectedPresets(prev => prev.filter(id => id !== presetId))
  }

  const addCustomModel = () => {
    if (newModelName.trim() && newModelEndpoint.trim()) {
      const newModel: CustomModel = {
        id: `custom-${Date.now()}`,
        name: newModelName.trim(),
        endpoint: newModelEndpoint.trim(),
        apiKeyEnvVar: newModelApiKey.trim(),
        type: newModelType,
      }
      setModels(prev => [...prev, newModel])
      setNewModelName("")
      setNewModelEndpoint("")
      setNewModelApiKey("")
      setIsModelDialogOpen(false)
    }
  }

  const deleteModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (model?.type === "cloudflare" && DEFAULT_MODELS.some(dm => dm.id === modelId)) {
      return // Don't delete default models
    }
    setModels(prev => prev.filter(m => m.id !== modelId))
    if (selectedModel === modelId) {
      setSelectedModel(DEFAULT_MODELS[0].id)
    }
  }

  const currentNegativePromptPreview = buildNegativePrompt()

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
              <p className="text-xs text-muted-foreground">支持负向提示词训练</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_420px] gap-8">
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
                      正向提示词
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
                    </div>

                    <Textarea
                      placeholder="描述您想要的转换效果..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[80px] bg-secondary/30 border-border/50 resize-none text-foreground placeholder:text-muted-foreground"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Negative Prompt Section */}
            <Collapsible open={negativePromptOpen} onOpenChange={setNegativePromptOpen}>
              <Card className="bg-card/50 border-border/50">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        负向提示词
                        <Badge variant="secondary" className="text-xs">
                          {selectedPresets.length + customNegativePrompts.length} 项
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={useNegativePrompt}
                            onCheckedChange={setUseNegativePrompt}
                          />
                          <span className="text-xs text-muted-foreground">
                            {useNegativePrompt ? "启用" : "禁用"}
                          </span>
                        </div>
                        {negativePromptOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {/* Preset Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">预设模板</Label>
                        <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <Plus className="w-3 h-3 mr-1" />
                              添加预设
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>创建自定义预设</DialogTitle>
                              <DialogDescription>
                                创建您自己的负向提示词预设模板，方便重复使用
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>预设名称</Label>
                                <Input
                                  placeholder="例如：写实风格排除"
                                  value={newPresetName}
                                  onChange={(e) => setNewPresetName(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>提示词（用逗号分隔）</Label>
                                <Textarea
                                  placeholder="cartoon, anime, illustration, drawing"
                                  value={newPresetPrompts}
                                  onChange={(e) => setNewPresetPrompts(e.target.value)}
                                  className="min-h-[100px]"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsPresetDialogOpen(false)}>
                                取消
                              </Button>
                              <Button onClick={saveCustomPreset}>
                                <Save className="w-4 h-4 mr-2" />
                                保存预设
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {negativePresets.map((preset) => (
                          <div key={preset.id} className="relative group">
                            <Badge
                              variant={selectedPresets.includes(preset.id) ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer transition-colors pr-2",
                                selectedPresets.includes(preset.id) 
                                  ? "bg-primary text-primary-foreground" 
                                  : "hover:bg-secondary"
                              )}
                              onClick={() => togglePreset(preset.id)}
                            >
                              {preset.name}
                              {preset.isCustom && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deletePreset(preset.id)
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Custom Prompts */}
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">自定义负向词</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="输入要排除的内容..."
                          value={newCustomPrompt}
                          onChange={(e) => setNewCustomPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addCustomPrompt()}
                          className="bg-secondary/30 border-border/50"
                        />
                        <Button onClick={addCustomPrompt} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {customNegativePrompts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {customNegativePrompts.map((cp) => (
                            <Badge
                              key={cp}
                              variant="secondary"
                              className="gap-1"
                            >
                              {cp}
                              <button onClick={() => removeCustomPrompt(cp)}>
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manual negative prompt */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">手动输入</Label>
                      <Textarea
                        placeholder="直接输入负向提示词..."
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="min-h-[60px] bg-secondary/30 border-border/50 resize-none text-sm"
                      />
                    </div>

                    {/* Preview */}
                    {currentNegativePromptPreview && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <Label className="text-xs text-muted-foreground mb-2 block">完整负向提示词预览</Label>
                        <p className="text-xs text-foreground/80 break-words">
                          {currentNegativePromptPreview}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                            {/* Download buttons */}
                            <div className="flex items-center gap-2">
                              {DOWNLOAD_FORMATS.map((format) => (
                                <Button
                                  key={format.id}
                                  size="sm"
                                  variant="secondary"
                                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs"
                                  onClick={() => handleDownload(image.url, image.prompt, format.id)}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  {format.name}
                                </Button>
                              ))}
                            </div>
                            {/* Action buttons */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                                  onClick={() => handleCopyUrl(image.url, image.id)}
                                >
                                  {copiedId === image.id ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                                  onClick={() => window.open(image.url, "_blank")}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
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
                      </div>
                      <CardContent className="py-3 space-y-2">
                        <p className="text-sm text-foreground line-clamp-2">{image.prompt}</p>
                        {image.negativePrompt && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            <span className="text-destructive/70">排除:</span> {image.negativePrompt}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">{image.model}</Badge>
                          <p className="text-xs text-muted-foreground/50">
                            {image.timestamp.toLocaleTimeString("zh-CN")}
                          </p>
                        </div>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">AI 模型</Label>
                    <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          添加模型
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>添加自定义模型</DialogTitle>
                          <DialogDescription>
                            添加 Cloudflare AI 模型或外部 API 端点
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>模型名称</Label>
                            <Input
                              placeholder="例如：My Custom Model"
                              value={newModelName}
                              onChange={(e) => setNewModelName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>模型类型</Label>
                            <Select value={newModelType} onValueChange={(v) => setNewModelType(v as typeof newModelType)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cloudflare">Cloudflare AI</SelectItem>
                                <SelectItem value="openai">OpenAI 兼容</SelectItem>
                                <SelectItem value="replicate">Replicate</SelectItem>
                                <SelectItem value="custom">自定义 API</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>
                              {newModelType === "cloudflare" ? "模型 ID" : "API 端点"}
                            </Label>
                            <Input
                              placeholder={
                                newModelType === "cloudflare" 
                                  ? "@cf/model/name" 
                                  : "https://api.example.com/generate"
                              }
                              value={newModelEndpoint}
                              onChange={(e) => setNewModelEndpoint(e.target.value)}
                            />
                          </div>
                          {newModelType !== "cloudflare" && (
                            <div className="space-y-2">
                              <Label>API Key 环境变量名</Label>
                              <Input
                                placeholder="CUSTOM_AI_API_KEY"
                                value={newModelApiKey}
                                onChange={(e) => setNewModelApiKey(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                留空则使用默认的 CUSTOM_AI_API_KEY
                              </p>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsModelDialogOpen(false)}>
                            取消
                          </Button>
                          <Button onClick={addCustomModel}>
                            <Plus className="w-4 h-4 mr-2" />
                            添加模型
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-secondary/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            {model.type !== "cloudflare" && (
                              <Badge variant="outline" className="text-xs">
                                {model.type}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Delete custom model button */}
                  {models.find(m => m.id === selectedModel)?.type !== "cloudflare" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => deleteModel(selectedModel)}
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      删除此模型
                    </Button>
                  )}
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
                </div>

                {/* Tips */}
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-medium text-foreground mb-3">负向提示词技巧</h3>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">1</span>
                      使用预设模板快速添加常用排除项
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">2</span>
                      创建自定义预设保存常用组合
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">3</span>
                      英文负向词通常效果更好
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">4</span>
                      避免与正向提示词冲突的负向词
                    </li>
                  </ul>
                </div>

                {/* Export/Import Presets */}
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-medium text-foreground mb-3">预设管理</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const customPresets = negativePresets.filter(p => p.isCustom)
                        const data = JSON.stringify(customPresets, null, 2)
                        const blob = new Blob([data], { type: "application/json" })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = "negative-prompt-presets.json"
                        a.click()
                      }}
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      导出
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = ".json"
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              try {
                                const imported = JSON.parse(ev.target?.result as string)
                                if (Array.isArray(imported)) {
                                  setNegativePresets(prev => [
                                    ...prev,
                                    ...imported.map((p: NegativePromptPreset) => ({
                                      ...p,
                                      id: `imported-${Date.now()}-${Math.random()}`,
                                      isCustom: true,
                                    }))
                                  ])
                                }
                              } catch {
                                setError("导入失败：文件格式错误")
                              }
                            }
                            reader.readAsText(file)
                          }
                        }
                        input.click()
                      }}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      导入
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

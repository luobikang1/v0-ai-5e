"use client"

import { useState, useCallback, useEffect } from "react"
import { useTheme } from "next-themes"
import { 
  ImageIcon, Wand2, Upload, Sparkles, Download, Trash2, Settings2, 
  Plus, X, BookOpen, Save, FolderOpen, ExternalLink, Copy, Check,
  ChevronDown, ChevronUp, History, Clock, Calendar, Search, Image,
  FileText, FolderPlus, Palette, Languages, Zap, BookMarked, Globe,
  Sun, Moon, Star, Heart, User, ShieldCheck, LogOut, Lock, Cloud, HardDrive,
  Menu, Grid, Sparkle, Layers
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Language, languageNames, useTranslation } from "@/lib/i18n"

// Interfaces
interface GeneratedImage {
  id: string
  url: string
  prompt: string
  negativePrompt: string
  timestamp: Date
  model: string
  width: number
  height: number
  sampler: string
  steps: number
  albumId?: string
  isFavorite?: boolean
}

interface HistoryRecord {
  id: string
  prompt: string
  negativePrompt: string
  timestamp: string
  model: string
  width: number
  height: number
  sampler: string
  steps: number
  imageData?: string
}

interface FavoriteItem {
  id: string
  itemType: "image" | "spell"
  title: string
  prompt: string
  negativePrompt?: string
  imageUrl?: string
  model?: string
  createdAt: string
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
  description?: string
  tags?: string[]
}

interface PromptNote {
  id: string
  title: string
  prompt: string
  negativePrompt: string
  createdAt: string
  updatedAt: string
}

interface Album {
  id: string
  name: string
  createdAt: string
  imageIds: string[]
}

interface Spell {
  id: string
  name: string
  prompt: string
  negativePrompt: string
  category: string
  isCustom: boolean
  isFavorite?: boolean
}

interface UserSession {
  id: string
  username: string
  isAdmin: boolean
  storageMode: "local" | "d1"
}

// Constants
const DEFAULT_MODELS: CustomModel[] = [
  { id: "@cf/stabilityai/stable-diffusion-xl-base-1.0", name: "Stable Diffusion XL", endpoint: "", apiKeyEnvVar: "", type: "cloudflare", description: "高质量图像生成基础模型", tags: ["stable-diffusion", "基础"] },
  { id: "@cf/lykon/dreamshaper-8-lcm", name: "DreamShaper 8 LCM", endpoint: "", apiKeyEnvVar: "", type: "cloudflare", description: "快速梦幻风格生成", tags: ["快速", "梦幻"] },
  { id: "@cf/bytedance/stable-diffusion-xl-lightning", name: "SDXL Lightning", endpoint: "", apiKeyEnvVar: "", type: "cloudflare", description: "闪电般快速的 SDXL", tags: ["快速", "SDXL"] },
]

const SEARCHABLE_MODELS: CustomModel[] = [
  ...DEFAULT_MODELS,
  { id: "@cf/runwayml/stable-diffusion-v1-5", name: "Stable Diffusion 1.5", endpoint: "", apiKeyEnvVar: "", type: "cloudflare", description: "经典 SD 1.5 模型", tags: ["经典", "stable-diffusion"] },
  { id: "@cf/stabilityai/stable-diffusion-xl-turbo", name: "SDXL Turbo", endpoint: "", apiKeyEnvVar: "", type: "cloudflare", description: "涡轮增压的 SDXL", tags: ["快速", "SDXL"] },
  { id: "dall-e-3", name: "DALL-E 3", endpoint: "https://api.openai.com/v1/images/generations", apiKeyEnvVar: "OPENAI_API_KEY", type: "openai", description: "OpenAI 最新图像模型", tags: ["OpenAI", "高质量"] },
]

const DEFAULT_SPELLS: Spell[] = [
  {
    id: "portrait-realistic",
    name: "写实人像",
    prompt: "professional portrait photograph, studio lighting, sharp focus, 8k, ultra detailed, natural skin texture, masterpiece",
    negativePrompt: "cartoon, anime, illustration, painting, blurry, low quality, deformed",
    category: "portrait",
    isCustom: false,
  },
  {
    id: "anime-character",
    name: "动漫角色",
    prompt: "anime character, detailed illustration, vibrant colors, dynamic pose, studio ghibli style, Makoto Shinkai aesthetic",
    negativePrompt: "realistic, photograph, 3d render, ugly, blurry, low quality",
    category: "anime",
    isCustom: false,
  },
  {
    id: "fantasy-landscape",
    name: "奇幻风景",
    prompt: "epic fantasy landscape, magical atmosphere, dramatic lighting, detailed environment, concept art, Unreal Engine 5 render",
    negativePrompt: "modern, urban, buildings, cars, people, low quality, blurry",
    category: "fantasy",
    isCustom: false,
  },
  {
    id: "scifi-scene",
    name: "科幻场景",
    prompt: "futuristic sci-fi scene, cyberpunk city, neon lights, advanced technology, cinematic lighting, 8k resolution",
    negativePrompt: "medieval, fantasy, nature, cartoon, low quality, blurry",
    category: "scifi",
    isCustom: false,
  },
  {
    id: "landscape-photo",
    name: "自然风光",
    prompt: "stunning landscape photography, golden hour, dramatic sky, national geographic style, ultra crisp 8k",
    negativePrompt: "cartoon, illustration, painting, people, buildings, text, watermark",
    category: "landscape",
    isCustom: false,
  },
]

const DEFAULT_NEGATIVE_PRESETS: NegativePromptPreset[] = [
  { id: "quality", name: "低质量过滤", prompts: ["blurry", "low quality", "low resolution", "pixelated", "jpeg artifacts", "compression artifacts"], isCustom: false },
  { id: "anatomy", name: "人体结构", prompts: ["bad anatomy", "extra limbs", "missing limbs", "deformed", "disfigured", "mutated", "extra fingers", "fused fingers"], isCustom: false },
  { id: "style", name: "风格排除", prompts: ["cartoon", "anime", "3d render", "cgi", "illustration", "painting", "drawing"], isCustom: false },
  { id: "nsfw", name: "安全内容", prompts: ["nsfw", "nude", "explicit", "adult content", "violence", "gore", "disturbing"], isCustom: false },
  { id: "artifacts", name: "AI瑕疵", prompts: ["watermark", "signature", "text", "logo", "username", "artist name", "border", "frame"], isCustom: false },
]

const DOWNLOAD_FORMATS = [
  { id: "png", name: "PNG", mime: "image/png" },
  { id: "jpg", name: "JPG", mime: "image/jpeg" },
  { id: "webp", name: "WebP", mime: "image/webp" },
]

const SAMPLERS = [
  { id: "euler_a", name: "Euler A" },
  { id: "euler", name: "Euler" },
  { id: "dpm_pp_2m", name: "DPM++ 2M" },
  { id: "dpm_pp_sde", name: "DPM++ SDE" },
  { id: "ddim", name: "DDIM" },
]

const IMAGE_SIZES = [
  { id: "1024x1024", name: "1024 x 1024 (1:1)", width: 1024, height: 1024 },
  { id: "768x1024", name: "768 x 1024 (3:4)", width: 768, height: 1024 },
  { id: "1024x768", name: "1024 x 768 (4:3)", width: 1024, height: 768 },
  { id: "512x512", name: "512 x 512 (小图)", width: 512, height: 512 },
  { id: "custom", name: "自定义尺寸", width: 512, height: 512 },
]

const BACKGROUND_COLORS = [
  { id: "transparent", name: "透明", value: "transparent" },
  { id: "white", name: "白色", value: "#ffffff" },
  { id: "black", name: "黑色", value: "#000000" },
  { id: "gray", name: "灰色", value: "#808080" },
]

const SPELL_CATEGORIES = ["portrait", "landscape", "anime", "realistic", "fantasy", "scifi"]

const STORAGE_KEYS = {
  history: "whitefox-history",
  notes: "whitefox-notes",
  albums: "whitefox-albums",
  spells: "whitefox-spells",
  models: "whitefox-models",
  language: "whitefox-language",
  favorites: "whitefox-favorites",
  user: "whitefox-user",
}

export function ImageGenerator() {
  // Theme
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Language
  const [language, setLanguage] = useState<Language>("zh")
  const t = useTranslation(language)

  // User Auth & Sync State
  const [user, setUser] = useState<UserSession | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"user" | "admin">("user")
  const [authSubTab, setAuthSubTab] = useState<"login" | "register">("login")
  const [authUsername, setAuthUsername] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [adminPasswordInput, setAdminPasswordInput] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // Batch count & quality enhancer
  const [batchCount, setBatchCount] = useState<number>(1)
  const [enableEnhancer, setEnableEnhancer] = useState<boolean>(true)

  // Core state
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0].id)
  const [models, setModels] = useState<CustomModel[]>(DEFAULT_MODELS)
  const [steps, setSteps] = useState([25])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [activeTab, setActiveTab] = useState("text-to-image")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [strength, setStrength] = useState([0.75])
  const [referenceStrength, setReferenceStrength] = useState([0.5])
  const [error, setError] = useState<string | null>(null)

  // Sampling and size
  const [selectedSampler, setSelectedSampler] = useState("euler_a")
  const [selectedSize, setSelectedSize] = useState("1024x1024")
  const [customWidth, setCustomWidth] = useState(512)
  const [customHeight, setCustomHeight] = useState(512)

  // Background color
  const [selectedBgColor, setSelectedBgColor] = useState("transparent")
  const [customBgColor, setCustomBgColor] = useState("#ffffff")

  // Favorites
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)

  // History
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Notes
  const [notes, setNotes] = useState<PromptNote[]>([])
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<PromptNote | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNotePrompt, setNewNotePrompt] = useState("")
  const [newNoteNegative, setNewNoteNegative] = useState("")

  // Albums
  const [albums, setAlbums] = useState<Album[]>([])
  const [isAlbumsOpen, setIsAlbumsOpen] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)
  const [newAlbumName, setNewAlbumName] = useState("")

  // Model search
  const [isModelsOpen, setIsModelsOpen] = useState(false)
  const [modelSearchQuery, setModelSearchQuery] = useState("")
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [newModelName, setNewModelName] = useState("")
  const [newModelEndpoint, setNewModelEndpoint] = useState("")
  const [newModelType, setNewModelType] = useState<"cloudflare" | "openai" | "replicate" | "custom">("custom")
  const [newModelApiKey, setNewModelApiKey] = useState("")

  // Spells
  const [spells, setSpells] = useState<Spell[]>(DEFAULT_SPELLS)
  const [isSpellsOpen, setIsSpellsOpen] = useState(false)
  const [isSpellDialogOpen, setIsSpellDialogOpen] = useState(false)
  const [newSpellName, setNewSpellName] = useState("")
  const [newSpellPrompt, setNewSpellPrompt] = useState("")
  const [newSpellNegative, setNewSpellNegative] = useState("")
  const [newSpellCategory, setNewSpellCategory] = useState("portrait")
  const [selectedSpellCategory, setSelectedSpellCategory] = useState<string | null>(null)

  // Negative presets
  const [negativePresets, setNegativePresets] = useState<NegativePromptPreset[]>(DEFAULT_NEGATIVE_PRESETS)
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [customNegativePrompts, setCustomNegativePrompts] = useState<string[]>([])
  const [newCustomPrompt, setNewCustomPrompt] = useState("")
  const [useNegativePrompt, setUseNegativePrompt] = useState(true)
  const [negativePromptOpen, setNegativePromptOpen] = useState(false)
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [newPresetPrompts, setNewPresetPrompts] = useState("")

  // Mobile drawer
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)

  // Copy URL state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      // Language
      const savedLang = localStorage.getItem(STORAGE_KEYS.language)
      if (savedLang && ["zh", "en", "ja", "ko"].includes(savedLang)) {
        setLanguage(savedLang as Language)
      }

      // User session
      const savedUser = localStorage.getItem(STORAGE_KEYS.user)
      if (savedUser) setUser(JSON.parse(savedUser))

      // Favorites
      const savedFavs = localStorage.getItem(STORAGE_KEYS.favorites)
      if (savedFavs) setFavorites(JSON.parse(savedFavs))

      // History
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history)
      if (savedHistory) setHistoryRecords(JSON.parse(savedHistory))

      // Notes
      const savedNotes = localStorage.getItem(STORAGE_KEYS.notes)
      if (savedNotes) setNotes(JSON.parse(savedNotes))

      // Albums
      const savedAlbums = localStorage.getItem(STORAGE_KEYS.albums)
      if (savedAlbums) setAlbums(JSON.parse(savedAlbums))

      // Spells
      const savedSpells = localStorage.getItem(STORAGE_KEYS.spells)
      if (savedSpells) {
        const customSpells = JSON.parse(savedSpells)
        setSpells([...DEFAULT_SPELLS, ...customSpells])
      }
    } catch {
      // ignore
    }
  }, [])

  // Handle Cloud Sync when user is logged in
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/sync?userId=${encodeURIComponent(user.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.isCloudSynced && data.favorites) {
            setFavorites(data.favorites)
            localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(data.favorites))
          }
        })
        .catch(() => {})
    }
  }, [user])

  const getCurrentDimensions = useCallback(() => {
    if (selectedSize === "custom") {
      return { width: customWidth, height: customHeight }
    }
    const size = IMAGE_SIZES.find((s) => s.id === selectedSize)
    return { width: size?.width || 1024, height: size?.height || 1024 }
  }, [selectedSize, customWidth, customHeight])

  const buildNegativePrompt = useCallback(() => {
    if (!useNegativePrompt) return ""
    const presetPrompts = selectedPresets.flatMap((presetId) => {
      const preset = negativePresets.find((p) => p.id === presetId)
      return preset ? preset.prompts : []
    })
    const allPrompts = [...presetPrompts, ...customNegativePrompts]
    if (negativePrompt.trim()) {
      allPrompts.push(negativePrompt.trim())
    }
    return [...new Set(allPrompts)].join(", ")
  }, [selectedPresets, customNegativePrompts, negativePrompt, negativePresets, useNegativePrompt])

  const getCurrentBgColor = useCallback(() => {
    return selectedBgColor === "custom" ? customBgColor : BACKGROUND_COLORS.find((c) => c.id === selectedBgColor)?.value || "transparent"
  }, [selectedBgColor, customBgColor])

  // Auth Handler
  const handleAuth = async () => {
    setAuthLoading(true)
    setAuthError(null)

    try {
      const body =
        authMode === "admin"
          ? { action: "verifyAdmin", adminPassword: adminPasswordInput }
          : { action: authSubTab, username: authUsername, password: authPassword }

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "认证操作失败")
      }

      setUser(data.user)
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user))
      setIsAuthOpen(false)
      setAuthUsername("")
      setAuthPassword("")
      setAdminPasswordInput("")
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "认证过程出现未知错误")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.user)
  }

  // Save/Toggle Favorite
  const toggleFavorite = (image: GeneratedImage) => {
    const existingIndex = favorites.findIndex((f) => f.imageUrl === image.url || f.id === image.id)
    let updatedFavs: FavoriteItem[] = []

    if (existingIndex >= 0) {
      updatedFavs = favorites.filter((_, idx) => idx !== existingIndex)
    } else {
      const newFav: FavoriteItem = {
        id: image.id,
        itemType: "image",
        title: image.prompt.slice(0, 30),
        prompt: image.prompt,
        negativePrompt: image.negativePrompt,
        imageUrl: image.url,
        model: image.model,
        createdAt: new Date().toISOString(),
      }
      updatedFavs = [newFav, ...favorites]
    }

    setFavorites(updatedFavs)
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(updatedFavs))

    // Cloud Sync if logged in
    if (user?.id) {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, favorites: updatedFavs }),
      }).catch(() => {})
    }
  }

  // Generation Handler
  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)

    // Build Final Prompt with Enhancer if enabled
    let finalPrompt = prompt.trim()
    if (enableEnhancer) {
      finalPrompt += ", masterpiece, best quality, ultra-detailed, 8k resolution, cinematic lighting, sharp focus"
    }

    const finalNegativePrompt = buildNegativePrompt()
    const currentModel = models.find((m) => m.id === selectedModel)
    const { width, height } = getCurrentDimensions()

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          negativePrompt: finalNegativePrompt,
          model: selectedModel,
          modelConfig: currentModel,
          steps: steps[0],
          mode: activeTab,
          sourceImage: uploadedImage,
          referenceImage: referenceImage,
          strength: strength[0],
          referenceStrength: referenceStrength[0],
          sampler: selectedSampler,
          width,
          height,
          backgroundColor: getCurrentBgColor(),
          batchCount: batchCount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t("generating"))
      }

      const data = await response.json()
      const newImagesList: GeneratedImage[] = (data.images || []).map((imgUrl: string, idx: number) => ({
        id: `${Date.now()}-${idx}`,
        url: imgUrl,
        prompt: prompt,
        negativePrompt: finalNegativePrompt,
        timestamp: new Date(),
        model: currentModel?.name || selectedModel,
        width,
        height,
        sampler: selectedSampler,
        steps: steps[0],
      }))

      setGeneratedImages((prev) => [...newImagesList, ...prev])

      // Save to History
      setHistoryRecords((prev) => {
        const newRecords: HistoryRecord[] = newImagesList.map((img) => ({
          id: img.id,
          prompt: img.prompt,
          negativePrompt: img.negativePrompt,
          timestamp: img.timestamp.toISOString(),
          model: img.model,
          width: img.width,
          height: img.height,
          sampler: img.sampler,
          steps: img.steps,
          imageData: img.url,
        }))
        const updated = [...newRecords, ...prev].slice(0, 100)
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(updated))
        return updated
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating image")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "source" | "reference") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === "source") setUploadedImage(reader.result as string)
        else setReferenceImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = async (url: string, promptText: string, format: string) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const formatInfo = DOWNLOAD_FORMATS.find((f) => f.id === format)
        const dataUrl = canvas.toDataURL(formatInfo?.mime || "image/png", 0.95)
        const a = document.createElement("a")
        a.href = dataUrl
        a.download = `whitefox-${promptText.slice(0, 15).replace(/\s+/g, "-")}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    }
    img.src = url
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground tracking-tight">{t("title")}</h1>
                {user?.isAdmin && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {t("adminBadge")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">{t("subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Account Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-primary/30">
                    <User className="w-4 h-4 text-primary" />
                    <span className="hidden sm:inline font-medium">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 border-b mb-1">
                    {user.storageMode === "d1" ? <Cloud className="w-3.5 h-3.5 text-emerald-500" /> : <HardDrive className="w-3.5 h-3.5 text-blue-500" />}
                    <span>{user.storageMode === "d1" ? t("cloudSyncedTag") : t("localModeTag")}</span>
                  </div>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" onClick={() => setIsAuthOpen(true)} className="gap-2 shadow-sm">
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("login")}</span>
              </Button>
            )}

            {/* Dark/Light Mode One-Click Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-full"
                title={t("theme")}
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </Button>
            )}

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 px-2.5">
                  <Globe className="w-4 h-4" />
                  <span className="hidden md:inline">{languageNames[language]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)}>
                    {languageNames[lang]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Drawer */}
            <Sheet open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden w-9 h-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-6 space-y-6">
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    快捷创作中心
                  </SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start gap-2 h-12" onClick={() => { setIsSpellsOpen(true); setMobileSettingsOpen(false) }}>
                    <Zap className="w-4 h-4 text-amber-500" />
                    {t("spells")}
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-12" onClick={() => { setIsNotesOpen(true); setMobileSettingsOpen(false) }}>
                    <BookMarked className="w-4 h-4 text-blue-500" />
                    {t("notes")}
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-12" onClick={() => { setIsFavoritesOpen(true); setMobileSettingsOpen(false) }}>
                    <Star className="w-4 h-4 text-yellow-500" />
                    {t("favorites")}
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-12" onClick={() => { setIsHistoryOpen(true); setMobileSettingsOpen(false) }}>
                    <History className="w-4 h-4 text-purple-500" />
                    {t("history")}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Navigation Quick Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsSpellsOpen(true)} className="gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                {t("spells")}
              </Button>

              <Button variant="outline" size="sm" onClick={() => setIsNotesOpen(true)} className="gap-2">
                <BookMarked className="w-4 h-4 text-blue-500" />
                {t("notes")}
              </Button>

              <Button variant="outline" size="sm" onClick={() => setIsFavoritesOpen(true)} className="gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                {t("favorites")}
                {favorites.length > 0 && <Badge variant="secondary" className="text-[10px] px-1">{favorites.length}</Badge>}
              </Button>

              <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)} className="gap-2">
                <History className="w-4 h-4" />
                {t("history")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto px-4 py-6 flex-1 pb-24 md:pb-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Controls Area */}
          <div className="space-y-6">
            {/* Mode Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1 rounded-xl">
                <TabsTrigger value="text-to-image" className="gap-2 rounded-lg">
                  <Wand2 className="w-4 h-4" />
                  {t("textToImage")}
                </TabsTrigger>
                <TabsTrigger value="image-to-image" className="gap-2 rounded-lg">
                  <ImageIcon className="w-4 h-4" />
                  {t("imageToImage")}
                </TabsTrigger>
                <TabsTrigger value="reference-image" className="gap-2 rounded-lg">
                  <Image className="w-4 h-4" />
                  {t("referenceImage")}
                </TabsTrigger>
              </TabsList>

              {/* Text to Image */}
              <TabsContent value="text-to-image" className="mt-4 space-y-4">
                <Card className="border-border/50 bg-card/60 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" />
                      {t("positivePrompt")}
                    </CardTitle>
                    {/* Prompt Enhancer Switch */}
                    <div className="flex items-center gap-2 bg-secondary/40 px-2.5 py-1 rounded-full">
                      <Sparkle className="w-3.5 h-3.5 text-amber-500" />
                      <Label htmlFor="enhancer-mode" className="text-xs cursor-pointer">{t("enhancePrompt")}</Label>
                      <Switch id="enhancer-mode" checked={enableEnhancer} onCheckedChange={setEnableEnhancer} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={t("promptPlaceholder")}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] bg-secondary/30 border-border/50 resize-none text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Image to Image */}
              <TabsContent value="image-to-image" className="mt-4 space-y-4">
                <Card className="border-border/50 bg-card/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      {t("uploadImage")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed border-border/60 rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-secondary/30",
                        uploadedImage && "border-primary/50 bg-secondary/20"
                      )}
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      {uploadedImage ? (
                        <div className="space-y-3">
                          <img src={uploadedImage} alt="Uploaded" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                          <p className="text-xs text-muted-foreground">{t("clickToChange")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{t("clickToUpload")}</p>
                        </div>
                      )}
                      <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "source")} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("strength")}: {strength[0].toFixed(2)}</Label>
                      <Slider value={strength} onValueChange={setStrength} min={0.1} max={1} step={0.05} />
                    </div>
                    <Textarea
                      placeholder={t("promptPlaceholder")}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[80px] bg-secondary/30 border-border/50"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reference Image */}
              <TabsContent value="reference-image" className="mt-4 space-y-4">
                <Card className="border-border/50 bg-card/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Image className="w-4 h-4 text-primary" />
                      {t("uploadReference")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed border-border/60 rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-secondary/30",
                        referenceImage && "border-primary/50 bg-secondary/20"
                      )}
                      onClick={() => document.getElementById("reference-upload")?.click()}
                    >
                      {referenceImage ? (
                        <div className="space-y-3">
                          <img src={referenceImage} alt="Reference" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                          <p className="text-xs text-muted-foreground">{t("clickToChange")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Image className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{t("clickToUpload")}</p>
                        </div>
                      )}
                      <input id="reference-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "reference")} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("referenceStrength")}: {referenceStrength[0].toFixed(2)}</Label>
                      <Slider value={referenceStrength} onValueChange={setReferenceStrength} min={0.1} max={1} step={0.05} />
                    </div>
                    <Textarea
                      placeholder={t("promptPlaceholder")}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[80px] bg-secondary/30 border-border/50"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Batch Count Selector (1-4 张一键出图) */}
            <Card className="border-border/50 bg-card/60 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{t("batchCount")}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={batchCount === num ? "default" : "outline"}
                      size="sm"
                      className="px-3 py-1.5 h-8"
                      onClick={() => setBatchCount(num)}
                    >
                      {num} 张
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Negative Prompt Collapsible */}
            <Collapsible open={negativePromptOpen} onOpenChange={setNegativePromptOpen}>
              <Card className="border-border/50 bg-card/60 shadow-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="py-3 px-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        {t("negativePrompt")}
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Switch checked={useNegativePrompt} onCheckedChange={setUseNegativePrompt} />
                        </div>
                        {negativePromptOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-3 pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {negativePresets.map((preset) => (
                        <Badge
                          key={preset.id}
                          variant={selectedPresets.includes(preset.id) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() =>
                            setSelectedPresets((prev) => (prev.includes(preset.id) ? prev.filter((id) => id !== preset.id) : [...prev, preset.id]))
                          }
                        >
                          {preset.name}
                        </Badge>
                      ))}
                    </div>
                    <Textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="排除不需要出现的元素..."
                      className="min-h-[60px] bg-secondary/30 border-border/50 text-xs"
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Action Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md transition-all rounded-xl"
            >
              {isGenerating ? (
                <>
                  <Spinner className="w-5 h-5 mr-2" />
                  {t("generating")} ({batchCount}张)
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t("generate")} ({batchCount}张)
                </>
              )}
            </Button>

            {error && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardContent className="py-3 px-4 text-sm text-destructive">{error}</CardContent>
              </Card>
            )}

            {/* Results Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  {t("results")}
                  {generatedImages.length > 0 && <span className="text-xs text-muted-foreground">({generatedImages.length})</span>}
                </h2>
              </div>

              {generatedImages.length === 0 ? (
                <Card className="border-border/30 bg-card/30">
                  <CardContent className="py-12 text-center space-y-2">
                    <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t("noImages")}</p>
                    <p className="text-xs text-muted-foreground/60">{t("startCreating")}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedImages.map((image) => {
                    const isFav = favorites.some((f) => f.imageUrl === image.url || f.id === image.id)
                    return (
                      <Card key={image.id} className="border-border/50 bg-card/60 overflow-hidden group shadow-sm">
                        <div className="relative aspect-square">
                          <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                            <div className="flex justify-end">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                                onClick={() => toggleFavorite(image)}
                              >
                                <Star className={cn("w-4 h-4", isFav ? "fill-amber-400 text-amber-400" : "text-white")} />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {DOWNLOAD_FORMATS.map((format) => (
                                  <Button
                                    key={format.id}
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 text-[10px] px-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                                    onClick={() => handleDownload(image.url, image.prompt, format.id)}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    {format.name}
                                  </Button>
                                ))}
                              </div>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="w-7 h-7 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
                                onClick={() => setGeneratedImages((prev) => prev.filter((img) => img.id !== image.id))}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3 space-y-1.5">
                          <p className="text-xs text-foreground line-clamp-2">{image.prompt}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">{image.model}</Badge>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">{image.width}x{image.height}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-4">
            <Card className="border-border/50 bg-card/60 sticky top-20 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  {t("settings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("model")}</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-secondary/30 border-border/50 text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id} className="text-xs">
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sampler */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("sampler")}</Label>
                  <Select value={selectedSampler} onValueChange={setSelectedSampler}>
                    <SelectTrigger className="bg-secondary/30 border-border/50 text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLERS.map((sampler) => (
                        <SelectItem key={sampler.id} value={sampler.id} className="text-xs">{sampler.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Steps */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("steps")}: {steps[0]}</Label>
                  <Slider value={steps} onValueChange={setSteps} min={10} max={50} step={1} />
                </div>

                {/* Image Size */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("imageSize")}</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger className="bg-secondary/30 border-border/50 text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_SIZES.map((size) => (
                        <SelectItem key={size.id} value={size.id} className="text-xs">{size.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Auth & Login Modal */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t("loginTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs">{t("loginDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex border-b">
              <button
                className={cn("pb-2 px-4 text-xs font-medium border-b-2 transition-colors", authMode === "user" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
                onClick={() => setAuthMode("user")}
              >
                用户模式 (普通/免库)
              </button>
              <button
                className={cn("pb-2 px-4 text-xs font-medium border-b-2 transition-colors", authMode === "admin" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
                onClick={() => setAuthMode("admin")}
              >
                管理员钥匙模式
              </button>
            </div>

            {authMode === "user" ? (
              <div className="space-y-3">
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    className={cn("hover:underline", authSubTab === "login" ? "text-primary font-bold" : "text-muted-foreground")}
                    onClick={() => setAuthSubTab("login")}
                  >
                    登录
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <button
                    className={cn("hover:underline", authSubTab === "register" ? "text-primary font-bold" : "text-muted-foreground")}
                    onClick={() => setAuthSubTab("register")}
                  >
                    注册
                  </button>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{t("username")}</Label>
                  <Input value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="输入用户名" className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("password")}</Label>
                  <Input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="输入密码" className="h-9 text-xs" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs">{t("adminPassword")}</Label>
                <Input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="输入环境变量 ADMIN_PASSWORD"
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">{t("adminPasswordHint")}</p>
              </div>
            )}

            {authError && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">{authError}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAuthOpen(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={handleAuth} disabled={authLoading}>
              {authLoading ? <Spinner className="w-3.5 h-3.5 mr-1" /> : null}
              {authMode === "admin" ? t("loginAction") : authSubTab === "login" ? t("loginAction") : t("registerAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Favorites Modal */}
      <Dialog open={isFavoritesOpen} onOpenChange={setIsFavoritesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              {t("favoritesTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs">{t("favoritesDesc")}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 py-2">
            {favorites.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t("noFavorites")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map((fav) => (
                  <Card key={fav.id} className="border-border/50 bg-secondary/20 p-3 relative group">
                    {fav.imageUrl && (
                      <img src={fav.imageUrl} alt={fav.title} className="w-full aspect-square object-cover rounded-lg mb-2" />
                    )}
                    <p className="text-xs font-medium text-foreground line-clamp-2">{fav.prompt}</p>
                    <div className="flex justify-between items-center mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2 text-destructive"
                        onClick={() => {
                          const updated = favorites.filter((f) => f.id !== fav.id)
                          setFavorites(updated)
                          localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(updated))
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {t("delete")}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs px-2"
                        onClick={() => {
                          setPrompt(fav.prompt)
                          if (fav.negativePrompt) setNegativePrompt(fav.negativePrompt)
                          setIsFavoritesOpen(false)
                        }}
                      >
                        {t("usePrompt")}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Spells Modal */}
      <Dialog open={isSpellsOpen} onOpenChange={setIsSpellsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              {t("spellsTitle")}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 py-2">
            <div className="space-y-3">
              {spells.map((spell) => (
                <Card key={spell.id} className="bg-secondary/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-semibold">{spell.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{spell.prompt}</p>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setPrompt(spell.prompt)
                        setNegativePrompt(spell.negativePrompt)
                        setIsSpellsOpen(false)
                      }}
                    >
                      {t("applySpell")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-blue-500" />
              {t("notesTitle")}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 py-2">
            {notes.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-8">{t("noNotes")}</p>
            ) : (
              notes.map((note) => (
                <Card key={note.id} className="p-3 bg-secondary/30 mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold">{note.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{note.prompt}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={() => {
                        setPrompt(note.prompt)
                        setNegativePrompt(note.negativePrompt)
                        setIsNotesOpen(false)
                      }}
                    >
                      {t("usePrompt")}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-500" />
              {t("historyTitle")}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 py-2">
            {historyRecords.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-8">{t("noHistory")}</p>
            ) : (
              <div className="space-y-3">
                {historyRecords.map((record) => (
                  <Card key={record.id} className="p-3 bg-secondary/20 flex gap-3 items-center">
                    {record.imageData && <img src={record.imageData} alt="" className="w-14 h-14 object-cover rounded-md flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2">{record.prompt}</p>
                      <p className="text-[10px] text-muted-foreground">{record.model} • {record.width}x{record.height}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setPrompt(record.prompt)
                        setNegativePrompt(record.negativePrompt)
                        setIsHistoryOpen(false)
                      }}
                    >
                      {t("restore")}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border/50 px-4 py-2 z-40 flex items-center justify-around">
        <button className="flex flex-col items-center text-xs text-primary font-medium gap-0.5" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Wand2 className="w-5 h-5" />
          <span>创作</span>
        </button>
        <button className="flex flex-col items-center text-xs text-muted-foreground hover:text-foreground gap-0.5" onClick={() => setIsSpellsOpen(true)}>
          <Zap className="w-5 h-5 text-amber-500" />
          <span>咒语</span>
        </button>
        <button className="flex flex-col items-center text-xs text-muted-foreground hover:text-foreground gap-0.5" onClick={() => setIsFavoritesOpen(true)}>
          <Star className="w-5 h-5 text-yellow-500" />
          <span>收藏</span>
        </button>
        <button className="flex flex-col items-center text-xs text-muted-foreground hover:text-foreground gap-0.5" onClick={() => setIsHistoryOpen(true)}>
          <History className="w-5 h-5 text-purple-500" />
          <span>历史</span>
        </button>
      </div>
    </div>
  )
}

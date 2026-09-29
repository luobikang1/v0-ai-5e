"use client"

import { useState, useCallback, useEffect } from "react"
import { useTheme } from "next-themes"
import { 
  ImageIcon, Wand2, Upload, Sparkles, Download, Trash2, Settings2, 
  Plus, X, BookOpen, Save, FolderOpen, ExternalLink, Copy, Check,
  ChevronDown, ChevronUp, History, Clock, Calendar, Search, Image as LucideImage,
  FileText, FolderPlus, Palette, Languages, Zap, BookMarked, Globe,
  Sun, Moon, Heart, User, LogOut, Lock, RefreshCw, Layers, SlidersHorizontal,
  Smartphone, Monitor, Frame
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Language, languageNames, useTranslation } from "@/lib/i18n"

// Types
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

interface FavoriteImage {
  id: string
  imageData: string
  prompt: string
  negativePrompt?: string
  model?: string
  width?: number
  height?: number
  createdAt: string
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
}

interface UserSession {
  id: string
  username: string
  isAdmin: boolean
  token?: string
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
  { id: "stability-ai/sdxl", name: "SDXL (Replicate)", endpoint: "https://api.replicate.com/v1/predictions", apiKeyEnvVar: "REPLICATE_API_TOKEN", type: "replicate", description: "Replicate 上的 SDXL", tags: ["Replicate", "SDXL"] },
]

const DEFAULT_SPELLS: Spell[] = [
  {
    id: "portrait-realistic",
    name: "写实人像",
    prompt: "professional portrait photograph, studio lighting, sharp focus, 8k, ultra detailed, natural skin texture",
    negativePrompt: "cartoon, anime, illustration, painting, blurry, low quality, deformed",
    category: "portrait",
    isCustom: false,
  },
  {
    id: "anime-character",
    name: "动漫角色",
    prompt: "anime character, detailed illustration, vibrant colors, dynamic pose, studio ghibli style",
    negativePrompt: "realistic, photograph, 3d render, ugly, blurry, low quality",
    category: "anime",
    isCustom: false,
  },
  {
    id: "fantasy-landscape",
    name: "奇幻风景",
    prompt: "epic fantasy landscape, magical atmosphere, dramatic lighting, detailed environment, concept art",
    negativePrompt: "modern, urban, buildings, cars, people, low quality, blurry",
    category: "fantasy",
    isCustom: false,
  },
  {
    id: "scifi-scene",
    name: "科幻场景",
    prompt: "futuristic sci-fi scene, cyberpunk city, neon lights, advanced technology, cinematic",
    negativePrompt: "medieval, fantasy, nature, cartoon, low quality, blurry",
    category: "scifi",
    isCustom: false,
  },
  {
    id: "landscape-photo",
    name: "自然风光",
    prompt: "stunning landscape photography, golden hour, dramatic sky, national geographic style, 8k",
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
  { id: "euler", name: "Euler" },
  { id: "euler_a", name: "Euler A" },
  { id: "dpm_2", name: "DPM2" },
  { id: "dpm_2_a", name: "DPM2 A" },
  { id: "dpm_pp_2s_a", name: "DPM++ 2S A" },
  { id: "dpm_pp_2m", name: "DPM++ 2M" },
  { id: "dpm_pp_sde", name: "DPM++ SDE" },
  { id: "ddim", name: "DDIM" },
  { id: "lms", name: "LMS" },
  { id: "heun", name: "Heun" },
]

const ASPECT_RATIOS = [
  { id: "1:1", name: "1:1 正方形", width: 1024, height: 1024, icon: Frame },
  { id: "3:4", name: "3:4 竖屏人像", width: 768, height: 1024, icon: Smartphone },
  { id: "4:3", name: "4:3 横屏风景", width: 1024, height: 768, icon: Monitor },
  { id: "9:16", name: "9:16 手机壁纸", width: 576, height: 1024, icon: Smartphone },
  { id: "16:9", name: "16:9 电脑宽屏", width: 1024, height: 576, icon: Monitor },
  { id: "custom", name: "自定义尺寸", width: 512, height: 512, icon: Frame },
]

const BACKGROUND_COLORS = [
  { id: "transparent", name: "透明", value: "transparent" },
  { id: "white", name: "白色", value: "#ffffff" },
  { id: "black", name: "黑色", value: "#000000" },
  { id: "gray", name: "灰色", value: "#808080" },
  { id: "blue", name: "蓝色", value: "#0066cc" },
  { id: "green", name: "绿色", value: "#00cc66" },
  { id: "custom", name: "自定义", value: "" },
]

const SPELL_CATEGORIES = ["portrait", "landscape", "anime", "realistic", "fantasy", "scifi"]

const STORAGE_KEYS = {
  history: "whitefox-history",
  notes: "whitefox-notes",
  albums: "whitefox-albums",
  spells: "whitefox-spells",
  models: "whitefox-models",
  language: "whitefox-language",
  user: "whitefox-user",
  favorites: "whitefox-favorites",
}

const HISTORY_MAX_DAYS = 30

export function ImageGenerator() {
  // Theme & Language
  const { theme, setTheme } = useTheme()
  const [language, setLanguage] = useState<Language>("zh")
  const t = useTranslation(language)
  
  // User Session & Auth
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [authTab, setAuthTab] = useState<"login" | "register" | "admin">("login")
  const [authUsername, setAuthUsername] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Core state
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0].id)
  const [models, setModels] = useState<CustomModel[]>(DEFAULT_MODELS)
  const [steps, setSteps] = useState([20])
  const [batchCount, setBatchCount] = useState<number>(1) // Up to 4 images
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [activeTab, setActiveTab] = useState("text-to-image")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [strength, setStrength] = useState([0.75])
  const [referenceStrength, setReferenceStrength] = useState([0.5])
  const [error, setError] = useState<string | null>(null)
  
  // Aspect Ratio and Size
  const [selectedRatio, setSelectedRatio] = useState("1:1")
  const [customWidth, setCustomWidth] = useState(1024)
  const [customHeight, setCustomHeight] = useState(1024)
  const [selectedSampler, setSelectedSampler] = useState("euler_a")
  
  // Background color
  const [selectedBgColor, setSelectedBgColor] = useState("transparent")
  const [customBgColor, setCustomBgColor] = useState("#ffffff")
  
  // Favorites
  const [favorites, setFavorites] = useState<FavoriteImage[]>([])
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)

  // History & Mobile Settings Sheet
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false)
  
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
  
  // Spells (Incantations)
  const [spells, setSpells] = useState<Spell[]>(DEFAULT_SPELLS)
  const [isSpellsOpen, setIsSpellsOpen] = useState(false)
  const [isSpellDialogOpen, setIsSpellDialogOpen] = useState(false)
  const [newSpellName, setNewSpellName] = useState("")
  const [newSpellPrompt, setNewSpellPrompt] = useState("")
  const [newSpellNegative, setNewSpellNegative] = useState("")
  const [newSpellCategory, setNewSpellCategory] = useState("portrait")
  const [selectedSpellCategory, setSelectedSpellCategory] = useState<string | null>(null)
  
  // Negative prompts
  const [negativePresets, setNegativePresets] = useState<NegativePromptPreset[]>(DEFAULT_NEGATIVE_PRESETS)
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [customNegativePrompts, setCustomNegativePrompts] = useState<string[]>([])
  const [newCustomPrompt, setNewCustomPrompt] = useState("")
  const [useNegativePrompt, setUseNegativePrompt] = useState(true)
  const [negativePromptOpen, setNegativePromptOpen] = useState(false)
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [newPresetPrompts, setNewPresetPrompts] = useState("")
  
  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load local state & restore user
  useEffect(() => {
    try {
      // Language
      const savedLang = localStorage.getItem(STORAGE_KEYS.language)
      if (savedLang && ["zh", "en", "ja", "ko"].includes(savedLang)) {
        setLanguage(savedLang as Language)
      }

      // User session
      const savedUser = localStorage.getItem(STORAGE_KEYS.user)
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser))
      }
      
      // Favorites
      const savedFavorites = localStorage.getItem(STORAGE_KEYS.favorites)
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }

      // History
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history)
      if (savedHistory) {
        const parsed: HistoryRecord[] = JSON.parse(savedHistory)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - HISTORY_MAX_DAYS)
        const validRecords = parsed.filter(r => new Date(r.timestamp) > cutoffDate)
        setHistoryRecords(validRecords)
      }
      
      // Notes, Albums, Spells, Models
      const savedNotes = localStorage.getItem(STORAGE_KEYS.notes)
      if (savedNotes) setNotes(JSON.parse(savedNotes))
      
      const savedAlbums = localStorage.getItem(STORAGE_KEYS.albums)
      if (savedAlbums) setAlbums(JSON.parse(savedAlbums))
      
      const savedSpells = localStorage.getItem(STORAGE_KEYS.spells)
      if (savedSpells) {
        setSpells([...DEFAULT_SPELLS, ...JSON.parse(savedSpells)])
      }
      
      const savedModels = localStorage.getItem(STORAGE_KEYS.models)
      if (savedModels) {
        setModels([...DEFAULT_MODELS, ...JSON.parse(savedModels)])
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Save language preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.language, language)
  }, [language])

  // Sync to Cloudflare D1 or Local mode
  const syncUserData = useCallback(async (user: UserSession) => {
    setIsSyncing(true)
    try {
      // Fetch server data
      const res = await fetch(`/api/user/sync?userId=${user.id}`)
      if (res.ok) {
        const result = await res.json()
        if (result.favorites && result.favorites.length > 0) {
          setFavorites(result.favorites)
          localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(result.favorites))
        }
        if (result.data) {
          if (result.data.history?.length) setHistoryRecords(result.data.history)
          if (result.data.notes?.length) setNotes(result.data.notes)
          if (result.data.albums?.length) setAlbums(result.data.albums)
        }
      }

      // Save current local state to cloud
      await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          favorites,
          history: historyRecords,
          notes,
          albums,
        }),
      })
    } catch (err) {
      console.warn("Cloud sync warning:", err)
    } finally {
      setIsSyncing(false)
    }
  }, [favorites, historyRecords, notes, albums])

  // Auth Submit
  const handleAuthSubmit = async () => {
    setAuthError(null)
    const isAdmin = authTab === "admin"
    const endpoint = authTab === "register" ? "/api/auth/register" : "/api/auth/login"

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
          isAdmin,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "认证失败")
      }

      setCurrentUser(data.user)
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user))
      setIsAuthDialogOpen(false)
      setAuthPassword("")

      // Trigger cloud data sync
      syncUserData(data.user)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "请求失败")
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_KEYS.user)
  }

  // Dimensions & Negative prompt helpers
  const getCurrentDimensions = useCallback(() => {
    if (selectedRatio === "custom") {
      return { width: customWidth, height: customHeight }
    }
    const ratio = ASPECT_RATIOS.find(r => r.id === selectedRatio)
    return { width: ratio?.width || 1024, height: ratio?.height || 1024 }
  }, [selectedRatio, customWidth, customHeight])

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

  const getCurrentBgColor = useCallback(() => {
    return selectedBgColor === "custom" ? customBgColor : BACKGROUND_COLORS.find(c => c.id === selectedBgColor)?.value || "transparent"
  }, [selectedBgColor, customBgColor])

  const saveToHistory = useCallback((image: GeneratedImage, imageData?: string) => {
    const record: HistoryRecord = {
      id: image.id,
      prompt: image.prompt,
      negativePrompt: image.negativePrompt,
      timestamp: image.timestamp.toISOString(),
      model: image.model,
      width: image.width,
      height: image.height,
      sampler: image.sampler,
      steps: image.steps,
      imageData,
    }
    setHistoryRecords(prev => {
      const updated = [record, ...prev].slice(0, 100)
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Favorite toggling
  const toggleFavorite = (image: GeneratedImage) => {
    const isFav = favorites.some(f => f.id === image.id)
    let updated: FavoriteImage[]

    if (isFav) {
      updated = favorites.filter(f => f.id !== image.id)
    } else {
      const newFav: FavoriteImage = {
        id: image.id,
        imageData: image.url,
        prompt: image.prompt,
        negativePrompt: image.negativePrompt,
        model: image.model,
        width: image.width,
        height: image.height,
        createdAt: new Date().toISOString(),
      }
      updated = [newFav, ...favorites]
    }

    setFavorites(updated)
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(updated))

    // Sync to D1 if logged in
    if (currentUser) {
      syncUserData(currentUser)
    }
  }

  // Generation Handler (Batching 1-4 images)
  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setError(null)

    const finalNegativePrompt = buildNegativePrompt()
    const currentModel = models.find(m => m.id === selectedModel)
    const { width, height } = getCurrentDimensions()
    const bgColor = getCurrentBgColor()

    try {
      const generateSingleImage = async (index: number): Promise<GeneratedImage> => {
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
            referenceImage: referenceImage,
            strength: strength[0],
            referenceStrength: referenceStrength[0],
            sampler: selectedSampler,
            width,
            height,
            backgroundColor: bgColor,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || t("generating"))
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const id = `${Date.now()}-${index}`

        const reader = new FileReader()
        reader.readAsDataURL(blob)

        const newImage: GeneratedImage = {
          id,
          url,
          prompt,
          negativePrompt: finalNegativePrompt,
          timestamp: new Date(),
          model: currentModel?.name || selectedModel,
          width,
          height,
          sampler: selectedSampler,
          steps: steps[0],
        }

        reader.onloadend = () => {
          saveToHistory(newImage, reader.result as string)
        }

        return newImage
      }

      // Execute batch requests concurrently up to 4
      const promises = Array.from({ length: batchCount }, (_, i) => generateSingleImage(i))
      const results = await Promise.all(promises)

      setGeneratedImages(prev => [...results, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating images")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "source" | "reference") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === "source") {
          setUploadedImage(reader.result as string)
        } else {
          setReferenceImage(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = async (url: string, prompt: string, format: string) => {
    const img = new window.Image()
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
        a.download = `whitefox-${prompt.slice(0, 20).replace(/\s+/g, "-")}.${format}`
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
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  // Note handlers
  const saveNote = () => {
    if (editingNote) {
      setNotes(prev => {
        const updated = prev.map(n => n.id === editingNote.id ? {
          ...n,
          title: newNoteTitle,
          prompt: newNotePrompt,
          negativePrompt: newNoteNegative,
          updatedAt: new Date().toISOString(),
        } : n)
        localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(updated))
        return updated
      })
    } else if (newNoteTitle.trim() && newNotePrompt.trim()) {
      const newNote: PromptNote = {
        id: Date.now().toString(),
        title: newNoteTitle,
        prompt: newNotePrompt,
        negativePrompt: newNoteNegative,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setNotes(prev => {
        const updated = [newNote, ...prev]
        localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(updated))
        return updated
      })
    }
    setEditingNote(null)
    setNewNoteTitle("")
    setNewNotePrompt("")
    setNewNoteNegative("")
  }

  const deleteNote = (id: string) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id)
      localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(updated))
      return updated
    })
  }

  const useNote = (note: PromptNote) => {
    setPrompt(note.prompt)
    setNegativePrompt(note.negativePrompt)
    setIsNotesOpen(false)
  }

  // Album handlers
  const createAlbum = () => {
    if (newAlbumName.trim()) {
      const newAlbum: Album = {
        id: Date.now().toString(),
        name: newAlbumName,
        createdAt: new Date().toISOString(),
        imageIds: [],
      }
      setAlbums(prev => {
        const updated = [newAlbum, ...prev]
        localStorage.setItem(STORAGE_KEYS.albums, JSON.stringify(updated))
        return updated
      })
      setNewAlbumName("")
    }
  }

  const addToAlbum = (imageId: string, albumId: string) => {
    setAlbums(prev => {
      const updated = prev.map(a => a.id === albumId ? {
        ...a,
        imageIds: [...a.imageIds, imageId],
      } : a)
      localStorage.setItem(STORAGE_KEYS.albums, JSON.stringify(updated))
      return updated
    })
  }

  const deleteAlbum = (id: string) => {
    setAlbums(prev => {
      const updated = prev.filter(a => a.id !== id)
      localStorage.setItem(STORAGE_KEYS.albums, JSON.stringify(updated))
      return updated
    })
  }

  // Model handlers
  const filteredModels = SEARCHABLE_MODELS.filter(m => 
    m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    m.tags?.some(tag => tag.toLowerCase().includes(modelSearchQuery.toLowerCase()))
  )

  const addModelFromSearch = (model: CustomModel) => {
    if (!models.some(m => m.id === model.id)) {
      setModels(prev => {
        const updated = [...prev, model]
        const customModels = updated.filter(m => !DEFAULT_MODELS.some(dm => dm.id === m.id))
        localStorage.setItem(STORAGE_KEYS.models, JSON.stringify(customModels))
        return updated
      })
    }
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
      setModels(prev => {
        const updated = [...prev, newModel]
        const customModels = updated.filter(m => !DEFAULT_MODELS.some(dm => dm.id === m.id))
        localStorage.setItem(STORAGE_KEYS.models, JSON.stringify(customModels))
        return updated
      })
      setNewModelName("")
      setNewModelEndpoint("")
      setNewModelApiKey("")
      setIsModelDialogOpen(false)
    }
  }

  const deleteModel = (modelId: string) => {
    if (DEFAULT_MODELS.some(dm => dm.id === modelId)) return
    setModels(prev => {
      const updated = prev.filter(m => m.id !== modelId)
      const customModels = updated.filter(m => !DEFAULT_MODELS.some(dm => dm.id === m.id))
      localStorage.setItem(STORAGE_KEYS.models, JSON.stringify(customModels))
      return updated
    })
    if (selectedModel === modelId) {
      setSelectedModel(DEFAULT_MODELS[0].id)
    }
  }

  // Spell handlers
  const applySpell = (spell: Spell) => {
    setPrompt(spell.prompt)
    setNegativePrompt(spell.negativePrompt)
    setIsSpellsOpen(false)
  }

  const addSpell = () => {
    if (newSpellName.trim() && newSpellPrompt.trim()) {
      const newSpell: Spell = {
        id: `custom-${Date.now()}`,
        name: newSpellName,
        prompt: newSpellPrompt,
        negativePrompt: newSpellNegative,
        category: newSpellCategory,
        isCustom: true,
      }
      setSpells(prev => {
        const updated = [...prev, newSpell]
        const customSpells = updated.filter(s => s.isCustom)
        localStorage.setItem(STORAGE_KEYS.spells, JSON.stringify(customSpells))
        return updated
      })
      setNewSpellName("")
      setNewSpellPrompt("")
      setNewSpellNegative("")
      setIsSpellDialogOpen(false)
    }
  }

  const deleteSpell = (id: string) => {
    setSpells(prev => {
      const updated = prev.filter(s => s.id !== id)
      const customSpells = updated.filter(s => s.isCustom)
      localStorage.setItem(STORAGE_KEYS.spells, JSON.stringify(customSpells))
      return updated
    })
  }

  const filteredSpells = selectedSpellCategory 
    ? spells.filter(s => s.category === selectedSpellCategory)
    : spells

  // Preset handlers
  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev => 
      prev.includes(presetId) ? prev.filter(id => id !== presetId) : [...prev, presetId]
    )
  }

  const addCustomPromptHandler = () => {
    if (newCustomPrompt.trim() && !customNegativePrompts.includes(newCustomPrompt.trim())) {
      setCustomNegativePrompts(prev => [...prev, newCustomPrompt.trim()])
      setNewCustomPrompt("")
    }
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

  // History handlers
  const restoreFromHistory = (record: HistoryRecord) => {
    setPrompt(record.prompt)
    setNegativePrompt(record.negativePrompt)
    setSelectedSampler(record.sampler)
    setSteps([record.steps])

    // Match ratio
    const matchingRatio = ASPECT_RATIOS.find(r => r.width === record.width && r.height === record.height)
    if (matchingRatio) {
      setSelectedRatio(matchingRatio.id)
    } else {
      setSelectedRatio("custom")
      setCustomWidth(record.width)
      setCustomHeight(record.height)
    }
    setIsHistoryOpen(false)
  }

  const formatHistoryDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return t("today")
    if (diffDays === 1) return t("yesterday")
    if (diffDays < 7) return `${diffDays} ${t("daysAgo")}`
    return date.toLocaleDateString(language === "zh" ? "zh-CN" : language === "ja" ? "ja-JP" : language === "ko" ? "ko-KR" : "en-US")
  }

  const currentNegativePromptPreview = buildNegativePrompt()

  // Settings Panel Component for Reuse in Desktop & Mobile Sheet
  const RenderSettingsContent = () => (
    <div className="space-y-6">
      {/* Batch Count (1 to 4 Images) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            {t("batchCount")}
          </Label>
          <Badge variant="default" className="text-xs bg-primary text-primary-foreground font-bold">
            {batchCount} {batchCount === 1 ? "Image" : "Images"}
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(num => (
            <Button
              key={num}
              type="button"
              variant={batchCount === num ? "default" : "outline"}
              size="sm"
              className={cn("h-9 font-medium text-xs", batchCount === num && "ring-2 ring-primary")}
              onClick={() => setBatchCount(num)}
            >
              {num} 张
            </Button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">{t("model")}</Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="bg-secondary/30 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map(model => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  {model.name}
                  {!DEFAULT_MODELS.some(dm => dm.id === model.id) && (
                    <Badge variant="outline" className="text-xs">Custom</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio & Custom Dimensions */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">{t("aspectRatio")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {ASPECT_RATIOS.map(ratio => {
            const IconComp = ratio.icon
            return (
              <Button
                key={ratio.id}
                type="button"
                variant={selectedRatio === ratio.id ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() => setSelectedRatio(ratio.id)}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{ratio.name}</span>
              </Button>
            )
          })}
        </div>

        {selectedRatio === "custom" && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("width")}</Label>
              <Input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Math.min(2048, Math.max(256, parseInt(e.target.value) || 512)))}
                min={256}
                max={2048}
                className="bg-secondary/30 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("height")}</Label>
              <Input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Math.min(2048, Math.max(256, parseInt(e.target.value) || 512)))}
                min={256}
                max={2048}
                className="bg-secondary/30 border-border/50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sampler */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">{t("sampler")}</Label>
        <Select value={selectedSampler} onValueChange={setSelectedSampler}>
          <SelectTrigger className="bg-secondary/30 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SAMPLERS.map(sampler => (
              <SelectItem key={sampler.id} value={sampler.id}>{sampler.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">{t("steps")}: {steps[0]}</Label>
        <Slider value={steps} onValueChange={setSteps} min={1} max={50} step={1} className="w-full" />
      </div>

      {/* Background Color */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground flex items-center gap-2">
          <Palette className="w-4 h-4" />
          {t("backgroundColor")}
        </Label>
        <div className="flex flex-wrap gap-2">
          {BACKGROUND_COLORS.map(color => (
            <button
              key={color.id}
              type="button"
              className={cn(
                "w-8 h-8 rounded-lg border-2 transition-all",
                selectedBgColor === color.id ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-primary/50",
                color.id === "transparent" && "bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]"
              )}
              style={{ backgroundColor: color.id !== "transparent" && color.id !== "custom" ? color.value : undefined }}
              onClick={() => setSelectedBgColor(color.id)}
              title={color.name}
            />
          ))}
        </div>
        {selectedBgColor === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customBgColor}
              onChange={(e) => setCustomBgColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer"
            />
            <Input
              value={customBgColor}
              onChange={(e) => setCustomBgColor(e.target.value)}
              className="flex-1 bg-secondary/30 border-border/50"
              placeholder="#ffffff"
            />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">{t("title")}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{t("subtitle")}</p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Dark Mode One-Click Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-xl border-border/60"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? t("lightMode") : t("darkMode")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400" />
            </Button>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-2.5 rounded-xl border-border/60 gap-1.5 text-xs font-medium">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">{languageNames[language]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(languageNames) as Language[]).map(lang => (
                  <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)}>
                    {languageNames[lang]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Login & Account Button */}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="h-9 px-3 rounded-xl gap-2 font-medium text-xs">
                    <User className="w-3.5 h-3.5" />
                    <span>{currentUser.username}</span>
                    {currentUser.isAdmin && <Badge variant="secondary" className="text-[10px] px-1 py-0">Admin</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-xs border-b border-border/50">
                    <p className="font-semibold text-foreground">{currentUser.username}</p>
                    <p className="text-muted-foreground text-[10px] truncate">{currentUser.isAdmin ? "系统管理员" : "已绑定云同步"}</p>
                  </div>
                  <DropdownMenuItem onClick={() => syncUserData(currentUser)} disabled={isSyncing}>
                    <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isSyncing && "animate-spin")} />
                    {t("syncData")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="h-9 px-3 rounded-xl gap-1.5 text-xs font-medium"
                onClick={() => setIsAuthDialogOpen(true)}
              >
                <User className="w-3.5 h-3.5" />
                <span>{t("login")}</span>
              </Button>
            )}

            {/* Mobile Settings Drawer Button */}
            <Sheet open={isMobileSettingsOpen} onOpenChange={setIsMobileSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl border-border/60 lg:hidden">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[380px] p-6 overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-primary" />
                    {t("settings")}
                  </SheetTitle>
                </SheetHeader>
                <RenderSettingsContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Feature Navigation Bar for Quick Tools */}
        <div className="border-t border-border/30 bg-muted/30">
          <div className="container mx-auto px-4 py-2 flex items-center justify-start gap-2 overflow-x-auto no-scrollbar">
            {/* Spells */}
            <Dialog open={isSpellsOpen} onOpenChange={setIsSpellsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 whitespace-nowrap rounded-lg">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {t("spells")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    {t("spellsTitle")}
                  </DialogTitle>
                  <DialogDescription>{t("spellsDesc")}</DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge 
                    variant={selectedSpellCategory === null ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedSpellCategory(null)}
                  >
                    All
                  </Badge>
                  {SPELL_CATEGORIES.map(cat => (
                    <Badge 
                      key={cat}
                      variant={selectedSpellCategory === cat ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedSpellCategory(cat)}
                    >
                      {t(cat)}
                    </Badge>
                  ))}
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4">
                    {filteredSpells.map(spell => (
                      <Card key={spell.id} className="bg-secondary/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-foreground">{spell.name}</h4>
                                <Badge variant="outline" className="text-xs">{t(spell.category)}</Badge>
                                {spell.isCustom && <Badge variant="secondary" className="text-xs">Custom</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{spell.prompt}</p>
                              {spell.negativePrompt && (
                                <p className="text-xs text-destructive/70 line-clamp-1">- {spell.negativePrompt}</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button size="sm" onClick={() => applySpell(spell)}>
                                {t("applySpell")}
                              </Button>
                              {spell.isCustom && (
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSpell(spell.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                <DialogFooter className="mt-4">
                  <Button onClick={() => setIsSpellDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("addSpell")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Favorites */}
            <Dialog open={isFavoritesOpen} onOpenChange={setIsFavoritesOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 whitespace-nowrap rounded-lg">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                  {t("favorites")}
                  {favorites.length > 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0">{favorites.length}</Badge>}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    {t("favoritesTitle")}
                  </DialogTitle>
                  <DialogDescription>{t("favoritesDesc")}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  <div className="p-1">
                    {favorites.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Heart className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-500" />
                        <p>{t("noFavorites")}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {favorites.map(fav => (
                          <Card key={fav.id} className="overflow-hidden bg-card/60 border-border/50 group">
                            <div className="relative aspect-square">
                              <img src={fav.imageData} alt="" className="w-full h-full object-cover" />
                              <div className="absolute top-2 right-2">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="w-7 h-7 rounded-full bg-black/60 text-rose-500 hover:text-rose-400"
                                  onClick={() => {
                                    const updated = favorites.filter(f => f.id !== fav.id)
                                    setFavorites(updated)
                                    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(updated))
                                  }}
                                >
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                </Button>
                              </div>
                            </div>
                            <CardContent className="p-2.5">
                              <p className="text-xs text-foreground line-clamp-2">{fav.prompt}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-7 mt-2 text-[11px]"
                                onClick={() => {
                                  setPrompt(fav.prompt)
                                  if (fav.negativePrompt) setNegativePrompt(fav.negativePrompt)
                                  setIsFavoritesOpen(false)
                                }}
                              >
                                {t("usePrompt")}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Notes */}
            <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 whitespace-nowrap rounded-lg">
                  <BookMarked className="w-3.5 h-3.5 text-blue-500" />
                  {t("notes")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-blue-500" />
                    {t("notesTitle")}
                  </DialogTitle>
                  <DialogDescription>{t("notesDesc")}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  <div className="space-y-4 pr-4 py-4">
                    <Card className="bg-secondary/30">
                      <CardContent className="p-4 space-y-3">
                        <Input 
                          placeholder={t("noteTitle")} 
                          value={newNoteTitle} 
                          onChange={e => setNewNoteTitle(e.target.value)} 
                        />
                        <Textarea 
                          placeholder={t("positivePrompt")} 
                          value={newNotePrompt} 
                          onChange={e => setNewNotePrompt(e.target.value)} 
                          className="min-h-[80px]"
                        />
                        <Textarea 
                          placeholder={t("negativePrompt")} 
                          value={newNoteNegative} 
                          onChange={e => setNewNoteNegative(e.target.value)} 
                          className="min-h-[60px]"
                        />
                        <Button onClick={saveNote} disabled={!newNoteTitle.trim() || !newNotePrompt.trim()}>
                          <Save className="w-4 h-4 mr-2" />
                          {editingNote ? t("save") : t("addNote")}
                        </Button>
                      </CardContent>
                    </Card>

                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{t("noNotes")}</p>
                      </div>
                    ) : (
                      notes.map(note => (
                        <Card key={note.id} className="bg-secondary/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground mb-2">{note.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{note.prompt}</p>
                                {note.negativePrompt && (
                                  <p className="text-xs text-destructive/70 line-clamp-1">- {note.negativePrompt}</p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button size="sm" onClick={() => useNote(note)}>{t("usePrompt")}</Button>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setEditingNote(note)
                                    setNewNoteTitle(note.title)
                                    setNewNotePrompt(note.prompt)
                                    setNewNoteNegative(note.negativePrompt)
                                  }}>
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteNote(note.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Albums */}
            <Dialog open={isAlbumsOpen} onOpenChange={setIsAlbumsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 whitespace-nowrap rounded-lg">
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-500" />
                  {t("albums")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-emerald-500" />
                    {t("albumsTitle")}
                  </DialogTitle>
                  <DialogDescription>{t("albumsDesc")}</DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 mb-4">
                  <Input 
                    placeholder={t("albumName")} 
                    value={newAlbumName} 
                    onChange={e => setNewAlbumName(e.target.value)} 
                  />
                  <Button onClick={createAlbum} disabled={!newAlbumName.trim()}>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    {t("createAlbum")}
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-4 pr-4">
                    {albums.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{t("noAlbums")}</p>
                      </div>
                    ) : (
                      albums.map(album => (
                        <Card key={album.id} className={cn("bg-secondary/30 cursor-pointer transition-colors", selectedAlbum === album.id && "ring-2 ring-primary")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3" onClick={() => setSelectedAlbum(selectedAlbum === album.id ? null : album.id)}>
                                <FolderOpen className="w-8 h-8 text-primary" />
                                <div>
                                  <h4 className="font-medium text-foreground">{album.name}</h4>
                                  <p className="text-xs text-muted-foreground">{album.imageIds.length} images</p>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAlbum(album.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {selectedAlbum === album.id && album.imageIds.length > 0 && (
                              <div className="grid grid-cols-4 gap-2 mt-4">
                                {album.imageIds.map(imgId => {
                                  const img = generatedImages.find(i => i.id === imgId)
                                  const historyImg = historyRecords.find(h => h.id === imgId)
                                  const imgSrc = img?.url || historyImg?.imageData
                                  return imgSrc ? (
                                    <img key={imgId} src={imgSrc} alt="" className="w-full aspect-square object-cover rounded-lg" />
                                  ) : null
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Model Search */}
            <Dialog open={isModelsOpen} onOpenChange={setIsModelsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 whitespace-nowrap rounded-lg">
                  <Search className="w-3.5 h-3.5 text-purple-500" />
                  {t("models")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-purple-500" />
                    {t("modelsTitle")}
                  </DialogTitle>
                  <DialogDescription>{t("modelsDesc")}</DialogDescription>
                </DialogHeader>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder={t("searchModels")} 
                    value={modelSearchQuery} 
                    onChange={e => setModelSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4">
                    {filteredModels.map(model => {
                      const isAdded = models.some(m => m.id === model.id)
                      return (
                        <Card key={model.id} className="bg-secondary/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-foreground">{model.name}</h4>
                                  <Badge variant="outline" className="text-xs">{model.type}</Badge>
                                </div>
                                {model.description && (
                                  <p className="text-xs text-muted-foreground mb-2">{model.description}</p>
                                )}
                                {model.tags && (
                                  <div className="flex gap-1 flex-wrap">
                                    {model.tags.map(tag => (
                                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                variant={isAdded ? "secondary" : "default"}
                                onClick={() => addModelFromSearch(model)}
                                disabled={isAdded}
                              >
                                {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
                <DialogFooter className="mt-4">
                  <Button onClick={() => setIsModelDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("addModel")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* History */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 whitespace-nowrap rounded-lg">
                  <History className="w-3.5 h-3.5 text-indigo-500" />
                  {t("history")}
                  {historyRecords.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">{historyRecords.length}</Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-500" />
                    {t("historyTitle")}
                  </DialogTitle>
                  <DialogDescription>{t("historyDesc")}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4 py-4">
                    {historyRecords.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{t("noHistory")}</p>
                      </div>
                    ) : (
                      historyRecords.map(record => (
                        <Card key={record.id} className="bg-secondary/30">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {record.imageData && (
                                <img src={record.imageData} alt={record.prompt} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0 space-y-2">
                                <p className="text-sm text-foreground line-clamp-2">{record.prompt}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatHistoryDate(record.timestamp)}
                                  </span>
                                  <Badge variant="outline" className="text-xs">{record.model}</Badge>
                                  <Badge variant="outline" className="text-xs">{record.width}x{record.height}</Badge>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button size="sm" variant="secondary" onClick={() => restoreFromHistory(record)}>
                                  {t("restore")}
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                                  setHistoryRecords(prev => {
                                    const updated = prev.filter(r => r.id !== record.id)
                                    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(updated))
                                    return updated
                                  })
                                }}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
                {historyRecords.length > 0 && (
                  <DialogFooter>
                    <Button variant="destructive" onClick={() => {
                      setHistoryRecords([])
                      localStorage.removeItem(STORAGE_KEYS.history)
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("clearHistory")}
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-6">
          {/* Main Work Area */}
          <div className="space-y-6">
            {/* Mode Selection Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/40 p-1 rounded-2xl">
                <TabsTrigger value="text-to-image" className="gap-1.5 rounded-xl text-xs sm:text-sm font-medium data-[state=active]:bg-card">
                  <Wand2 className="w-4 h-4 text-primary" />
                  {t("textToImage")}
                </TabsTrigger>
                <TabsTrigger value="image-to-image" className="gap-1.5 rounded-xl text-xs sm:text-sm font-medium data-[state=active]:bg-card">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  {t("imageToImage")}
                </TabsTrigger>
                <TabsTrigger value="reference-image" className="gap-1.5 rounded-xl text-xs sm:text-sm font-medium data-[state=active]:bg-card">
                  <LucideImage className="w-4 h-4 text-primary" />
                  {t("referenceImage")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text-to-image" className="mt-4 space-y-4">
                <Card className="bg-card/60 border-border/50 rounded-2xl shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" />
                      {t("positivePrompt")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4">
                    <Textarea
                      placeholder={t("promptPlaceholder")}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[110px] sm:min-h-[130px] bg-secondary/20 border-border/40 rounded-xl resize-none text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="image-to-image" className="mt-4 space-y-4">
                <Card className="bg-card/60 border-border/50 rounded-2xl shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      {t("uploadImage")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4 space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed border-border/50 rounded-2xl p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-secondary/20",
                        uploadedImage && "border-primary/50 bg-secondary/20"
                      )}
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      {uploadedImage ? (
                        <div className="space-y-3">
                          <img src={uploadedImage} alt="Uploaded" className="max-h-40 mx-auto rounded-xl object-contain" />
                          <p className="text-xs text-muted-foreground">{t("clickToChange")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-xs sm:text-sm text-muted-foreground">{t("clickToUpload")}</p>
                          <p className="text-[11px] text-muted-foreground/70">{t("supportedFormats")}</p>
                        </div>
                      )}
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, "source")}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t("strength")}</span>
                        <span>{strength[0].toFixed(2)}</span>
                      </div>
                      <Slider value={strength} onValueChange={setStrength} min={0.1} max={1} step={0.05} />
                    </div>
                    <Textarea
                      placeholder={t("promptPlaceholder")}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[80px] bg-secondary/20 border-border/40 rounded-xl resize-none text-sm"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reference-image" className="mt-4 space-y-4">
                <Card className="bg-card/60 border-border/50 rounded-2xl shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                      <LucideImage className="w-4 h-4 text-primary" />
                      {t("uploadReference")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4 space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed border-border/50 rounded-2xl p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-secondary/20",
                        referenceImage && "border-primary/50 bg-secondary/20"
                      )}
                      onClick={() => document.getElementById("reference-upload")?.click()}
                    >
                      {referenceImage ? (
                        <div className="space-y-3">
                          <img src={referenceImage} alt="Reference" className="max-h-40 mx-auto rounded-xl object-contain" />
                          <p className="text-xs text-muted-foreground">{t("clickToChange")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <LucideImage className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-xs sm:text-sm text-muted-foreground">{t("clickToUpload")}</p>
                          <p className="text-[11px] text-muted-foreground/70">{t("supportedFormats")}</p>
                        </div>
                      )}
                      <input
                        id="reference-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, "reference")}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t("referenceStrength")}</span>
                        <span>{referenceStrength[0].toFixed(2)}</span>
                      </div>
                      <Slider value={referenceStrength} onValueChange={setReferenceStrength} min={0.1} max={1} step={0.05} />
                    </div>
                    <Textarea
                      placeholder={t("promptPlaceholder")}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[80px] bg-secondary/20 border-border/40 rounded-xl resize-none text-sm"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Negative Prompt Collapsible */}
            <Collapsible open={negativePromptOpen} onOpenChange={setNegativePromptOpen}>
              <Card className="bg-card/60 border-border/50 rounded-2xl shadow-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 pt-4 px-4 sm:px-6 cursor-pointer hover:bg-secondary/10 transition-colors rounded-2xl">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        {t("negativePrompt")}
                        <Badge variant="secondary" className="text-xs rounded-lg">
                          {selectedPresets.length + customNegativePrompts.length}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Switch checked={useNegativePrompt} onCheckedChange={setUseNegativePrompt} />
                          <span className="text-xs text-muted-foreground hidden sm:inline">{useNegativePrompt ? t("enabled") : t("disabled")}</span>
                        </div>
                        {negativePromptOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-4 sm:px-6 pb-4 space-y-4 pt-0">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">{t("presetTemplates")}</Label>
                        <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <Plus className="w-3 h-3 mr-1" />
                              {t("addPreset")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t("createPreset")}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>{t("presetName")}</Label>
                                <Input value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("presetPrompts")}</Label>
                                <Textarea value={newPresetPrompts} onChange={(e) => setNewPresetPrompts(e.target.value)} className="min-h-[100px]" />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsPresetDialogOpen(false)}>{t("cancel")}</Button>
                              <Button onClick={saveCustomPreset}><Save className="w-4 h-4 mr-2" />{t("save")}</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {negativePresets.map((preset) => (
                          <Badge
                            key={preset.id}
                            variant={selectedPresets.includes(preset.id) ? "default" : "outline"}
                            className={cn("cursor-pointer transition-colors text-xs rounded-lg py-1 px-2.5", selectedPresets.includes(preset.id) ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}
                            onClick={() => togglePreset(preset.id)}
                          >
                            {preset.name}
                            {preset.isCustom && (
                              <button onClick={(e) => { e.stopPropagation(); setNegativePresets(prev => prev.filter(p => p.id !== preset.id)) }} className="ml-1 hover:text-destructive">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("customPrompts")}</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="..."
                          value={newCustomPrompt}
                          onChange={(e) => setNewCustomPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addCustomPromptHandler()}
                          className="bg-secondary/30 border-border/40 rounded-xl text-xs h-9"
                        />
                        <Button onClick={addCustomPromptHandler} size="sm" className="h-9 px-3"><Plus className="w-4 h-4" /></Button>
                      </div>
                      {customNegativePrompts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {customNegativePrompts.map((cp) => (
                            <Badge key={cp} variant="secondary" className="gap-1 text-xs rounded-lg">
                              {cp}
                              <button onClick={() => setCustomNegativePrompts(prev => prev.filter(p => p !== cp))}><X className="w-3 h-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("manualInput")}</Label>
                      <Textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="min-h-[60px] bg-secondary/30 border-border/40 rounded-xl resize-none text-xs"
                      />
                    </div>
                    {currentNegativePromptPreview && (
                      <div className="p-2.5 bg-secondary/30 rounded-xl">
                        <Label className="text-[11px] text-muted-foreground mb-1 block">{t("preview")}</Label>
                        <p className="text-xs text-foreground/80 break-words line-clamp-3">{currentNegativePromptPreview}</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Desktop & Mobile Main Generate Action Bar */}
            <div className="sticky bottom-4 z-40 bg-background/80 backdrop-blur-md p-2 rounded-2xl border border-border/50 shadow-lg">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || (activeTab === "image-to-image" && !uploadedImage) || (activeTab === "reference-image" && !referenceImage)}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-base shadow-md transition-all active:scale-[0.99]"
              >
                {isGenerating ? (
                  <><Spinner className="w-5 h-5 mr-2" />{t("generating")} ({batchCount}张)...</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" />{t("generate")} ({batchCount}张)</>
                )}
              </Button>
            </div>

            {error && (
              <Card className="bg-destructive/10 border-destructive/30 rounded-xl">
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Generated Results Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  {t("results")}
                  {generatedImages.length > 0 && <span className="text-xs font-normal text-muted-foreground">({generatedImages.length})</span>}
                </h2>
              </div>

              {generatedImages.length === 0 ? (
                <Card className="bg-card/40 border-border/40 rounded-2xl">
                  <CardContent className="py-12 sm:py-16 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">{t("noImages")}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{t("startCreating")}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedImages.map((image) => {
                    const isFav = favorites.some(f => f.id === image.id)
                    return (
                      <Card key={image.id} className="bg-card/60 border-border/50 rounded-2xl overflow-hidden group shadow-sm transition-all hover:shadow-md">
                        <div className="relative aspect-square bg-muted/20">
                          <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />
                          <div className="absolute top-3 right-3 z-10">
                            <Button
                              size="icon"
                              variant="secondary"
                              className={cn("w-8 h-8 rounded-full bg-black/60 backdrop-blur-md transition-colors", isFav ? "text-rose-500" : "text-white/80 hover:text-rose-400")}
                              onClick={() => toggleFavorite(image)}
                            >
                              <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
                            </Button>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 sm:p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {DOWNLOAD_FORMATS.map((format) => (
                                  <Button
                                    key={format.id}
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 px-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[11px] rounded-lg"
                                    onClick={() => handleDownload(image.url, image.prompt, format.id)}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    {format.name}
                                  </Button>
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Button size="sm" variant="secondary" className="h-7 w-7 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg" onClick={() => handleCopyUrl(image.url, image.id)}>
                                    {copiedId === image.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  </Button>
                                  <a href={image.url} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="secondary" className="h-7 w-7 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                  </a>
                                  {albums.length > 0 && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="secondary" className="h-7 w-7 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg">
                                          <FolderPlus className="w-3.5 h-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start">
                                        {albums.map(album => (
                                          <DropdownMenuItem key={album.id} onClick={() => addToAlbum(image.id, album.id)}>
                                            {album.name}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                                <Button size="sm" variant="secondary" className="h-7 w-7 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg" onClick={() => setGeneratedImages(prev => prev.filter(img => img.id !== image.id))}>
                                  <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="text-xs text-foreground line-clamp-2">{image.prompt}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md">{image.model}</Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md">{image.width}x{image.height}</Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md">{image.sampler}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Settings Panel for Desktop Screen */}
          <div className="hidden lg:block">
            <Card className="bg-card/60 border-border/50 rounded-2xl sticky top-20 shadow-sm p-5">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  {t("settings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RenderSettingsContent />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Auth Dialog (Login / Register / Admin Login) */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <User className="w-5 h-5 text-primary" />
              {authTab === "admin" ? t("adminLogin") : authTab === "login" ? t("login") : t("register")}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={authTab} onValueChange={(v) => { setAuthTab(v as typeof authTab); setAuthError(null); }} className="w-full">
            <TabsList className="grid grid-cols-3 bg-secondary/30 mb-4 rounded-xl">
              <TabsTrigger value="login" className="text-xs rounded-lg">{t("login")}</TabsTrigger>
              <TabsTrigger value="register" className="text-xs rounded-lg">{t("register")}</TabsTrigger>
              <TabsTrigger value="admin" className="text-xs rounded-lg flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {t("adminLogin")}
              </TabsTrigger>
            </TabsList>

            <div className="space-y-3 py-2">
              {authTab !== "admin" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("username")}</Label>
                  <Input
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="bg-secondary/20 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {authTab === "admin" ? t("adminPassword") : t("password")}
                </Label>
                <Input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder={authTab === "admin" ? "请输入部署的环境变量 ADMIN_PASSWORD" : "请输入密码"}
                  className="bg-secondary/20 rounded-xl text-xs"
                />
              </div>

              {authTab === "admin" && (
                <p className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                  💡 管理员密码通过部署环境变量 <code className="text-primary font-mono">ADMIN_PASSWORD</code> 设置，无需数据库即可一键验证激活管理功能。
                </p>
              )}

              {authTab === "register" && (
                <p className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                  ✨ 免库模式支持无数据库直接注册与免密体验；如配置了 Cloudflare D1 数据库，将自动同步您的收藏与历史数据。
                </p>
              )}

              {authError && (
                <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">{authError}</p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsAuthDialogOpen(false)} className="rounded-xl">
                {t("cancel")}
              </Button>
              <Button size="sm" onClick={handleAuthSubmit} className="rounded-xl">
                {authTab === "register" ? t("register") : t("login")}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

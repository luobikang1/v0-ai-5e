"use client"

import { useState, useCallback, useEffect } from "react"
import { useTheme } from "next-themes"
import { 
  ImageIcon, Wand2, Upload, Sparkles, Download, Trash2, Settings2, 
  Plus, X, BookOpen, Save, FolderOpen, ExternalLink, Copy, Check,
  ChevronDown, ChevronUp, History, Clock, Calendar, Search, Image,
  FileText, FolderPlus, Palette, Languages, Zap, BookMarked, Globe,
  Sun, Moon, Menu, Heart, Star, Shield, User, LogOut, Lock, SlidersHorizontal,
  Layers, KeyRound
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
} from "@/components/ui/dropdown-menu"
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
  backgroundColor?: string
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

interface UserAccount {
  id: string
  username: string
  isAdmin: boolean
  storageMode?: "local" | "d1"
}

interface FavoriteItem {
  id: string
  title: string
  prompt: string
  negativePrompt?: string
  url?: string
  model?: string
  createdAt: string
  type: "image" | "prompt" | "spell"
}

interface AspectRatioOption {
  id: string
  name: string
  width: number
  height: number
  ratioLabel: string
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

const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: "1:1", name: "1:1 正方形", width: 1024, height: 1024, ratioLabel: "1:1" },
  { id: "16:9", name: "16:9 横屏/风景", width: 1280, height: 720, ratioLabel: "16:9" },
  { id: "9:16", name: "9:16 竖屏/手机", width: 720, height: 1280, ratioLabel: "9:16" },
  { id: "4:3", name: "4:3 传统屏幕", width: 1024, height: 768, ratioLabel: "4:3" },
  { id: "3:4", name: "3:4 人像/海报", width: 768, height: 1024, ratioLabel: "3:4" },
  { id: "21:9", name: "21:9 宽银幕", width: 1280, height: 544, ratioLabel: "21:9" },
  { id: "custom", name: "自定义尺寸", width: 512, height: 512, ratioLabel: "自定义" },
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
  cfConfig: "whitefox-cf-config",
}

const HISTORY_MAX_DAYS = 30

export function ImageGenerator() {
  // Theme
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const toggleTheme = useCallback(() => {
    const current = resolvedTheme || theme
    setTheme(current === "dark" ? "light" : "dark")
  }, [resolvedTheme, theme, setTheme])

  // Language
  const [language, setLanguage] = useState<Language>("zh")
  const t = useTranslation(language)

  // Core state
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0].id)
  const [models, setModels] = useState<CustomModel[]>(DEFAULT_MODELS)
  const [steps, setSteps] = useState([20])
  const [batchCount, setBatchCount] = useState<number>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingProgress, setGeneratingProgress] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [activeTab, setActiveTab] = useState("text-to-image")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [strength, setStrength] = useState([0.75])
  const [referenceStrength, setReferenceStrength] = useState([0.5])
  const [error, setError] = useState<string | null>(null)

  // Cloudflare API Credentials in UI Settings
  const [cfAccountId, setCfAccountId] = useState("")
  const [cfApiToken, setCfApiToken] = useState("")
  const [isCfConfigOpen, setIsCfConfigOpen] = useState(false)

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Sampling and aspect ratio
  const [selectedSampler, setSelectedSampler] = useState("euler_a")
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1")
  const [customWidth, setCustomWidth] = useState(512)
  const [customHeight, setCustomHeight] = useState(512)

  // Background color
  const [selectedBgColor, setSelectedBgColor] = useState("transparent")
  const [customBgColor, setCustomBgColor] = useState("#ffffff")

  // User auth & Favorites
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [authTab, setAuthTab] = useState<"login" | "register" | "admin">("login")
  const [authUsername, setAuthUsername] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authAdminPassword, setAuthAdminPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)

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

  // Download
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load data from localStorage
  useEffect(() => {
    try {
      // Language
      const savedLang = localStorage.getItem(STORAGE_KEYS.language)
      if (savedLang && ["zh", "en", "ja", "ko"].includes(savedLang)) {
        setLanguage(savedLang as Language)
      }

      // Cloudflare config
      const savedCf = localStorage.getItem(STORAGE_KEYS.cfConfig)
      if (savedCf) {
        const parsedCf = JSON.parse(savedCf)
        setCfAccountId(parsedCf.cfAccountId || "")
        setCfApiToken(parsedCf.cfApiToken || "")
      }

      // User Profile
      const savedUser = localStorage.getItem(STORAGE_KEYS.user)
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser))
      }

      // Favorites
      const savedFavs = localStorage.getItem(STORAGE_KEYS.favorites)
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs))
      }

      // History
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history)
      if (savedHistory) {
        const parsed: HistoryRecord[] = JSON.parse(savedHistory)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - HISTORY_MAX_DAYS)
        const validRecords = parsed.filter(r => new Date(r.timestamp) > cutoffDate)
        setHistoryRecords(validRecords)
        if (validRecords.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(validRecords))
        }
      }

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

      // Models
      const savedModels = localStorage.getItem(STORAGE_KEYS.models)
      if (savedModels) {
        const customModels = JSON.parse(savedModels)
        setModels([...DEFAULT_MODELS, ...customModels])
      }
    } catch {
      // Ignore errors
    }
  }, [])

  // Save language preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.language, language)
  }, [language])

  const saveCfConfig = () => {
    localStorage.setItem(STORAGE_KEYS.cfConfig, JSON.stringify({ cfAccountId, cfApiToken }))
    setIsCfConfigOpen(false)
  }

  // Helpers
  const getCurrentDimensions = useCallback(() => {
    if (selectedAspectRatio === "custom") {
      return { width: customWidth, height: customHeight }
    }
    const ratioOpt = ASPECT_RATIOS.find(r => r.id === selectedAspectRatio)
    return { width: ratioOpt?.width || 1024, height: ratioOpt?.height || 1024 }
  }, [selectedAspectRatio, customWidth, customHeight])

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

  // Auth & User actions
  const handleAuthAction = async () => {
    setAuthError(null)
    setAuthSuccess(null)

    try {
      if (authTab === "admin") {
        if (!authAdminPassword) {
          setAuthError(t("adminPassword") + " 不能为空")
          return
        }

        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verifyAdmin", adminPassword: authAdminPassword }),
        })

        const data = await res.json()
        if (res.ok && data.success) {
          const userObj: UserAccount = {
            id: data.user.id,
            username: data.user.username,
            isAdmin: true,
            storageMode: data.user.storageMode,
          }
          setCurrentUser(userObj)
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userObj))
          setAuthSuccess("管理员身份验证成功！")
          setTimeout(() => setIsAuthOpen(false), 1000)
        } else {
          setAuthError(data.error || "管理员密码验证失败")
        }
        return
      }

      if (!authUsername.trim() || !authPassword.trim()) {
        setAuthError(t("username") + " 和 " + t("password") + " 不能为空")
        return
      }

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authTab,
          username: authUsername.trim(),
          password: authPassword.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        const userObj: UserAccount = {
          id: data.user.id,
          username: data.user.username,
          isAdmin: data.user.isAdmin,
          storageMode: data.user.storageMode,
        }
        setCurrentUser(userObj)
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userObj))
        setAuthSuccess(authTab === "login" ? "登录成功！" : "注册成功并自动登录！")
        setTimeout(() => setIsAuthOpen(false), 1000)
      } else {
        const isOfflineAdmin = authPassword === "admin123456"
        const localUser: UserAccount = {
          id: `local-${Date.now()}`,
          username: isOfflineAdmin ? `${authUsername.trim()} (管理员)` : authUsername.trim(),
          isAdmin: isOfflineAdmin,
          storageMode: "local",
        }
        setCurrentUser(localUser)
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(localUser))
        setAuthSuccess(authTab === "login" ? "离线/本地模式登录成功！" : "本地注册成功！")
        setTimeout(() => setIsAuthOpen(false), 1000)
      }
    } catch {
      const isOfflineAdmin = authPassword === "admin123456"
      const localUser: UserAccount = {
        id: `local-${Date.now()}`,
        username: isOfflineAdmin ? `${authUsername.trim()} (管理员)` : authUsername.trim(),
        isAdmin: isOfflineAdmin,
        storageMode: "local",
      }
      setCurrentUser(localUser)
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(localUser))
      setAuthSuccess("已使用本地状态保存！")
      setTimeout(() => setIsAuthOpen(false), 1000)
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_KEYS.user)
  }

  // Favorites (收藏夹)
  const toggleFavorite = (item: FavoriteItem) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id)
      const updated = exists ? prev.filter(f => f.id !== item.id) : [item, ...prev]
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(updated))
      return updated
    })
  }

  const isFavorited = (id: string) => favorites.some(f => f.id === id)

  // Generation handler (supports 1 - 4 batch generation)
  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setGeneratingProgress(null)

    const finalNegativePrompt = buildNegativePrompt()
    const currentModel = models.find(m => m.id === selectedModel)
    const { width, height } = getCurrentDimensions()
    const bgColor = getCurrentBgColor()

    const newGenerated: GeneratedImage[] = []

    try {
      for (let i = 0; i < batchCount; i++) {
        if (batchCount > 1) {
          setGeneratingProgress(`正在生成第 ${i + 1} / ${batchCount} 张图像...`)
        }

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
            cfAccountId,
            cfApiToken,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || t("generating"))
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        const newImage: GeneratedImage = {
          id: `${Date.now()}-${i}`,
          url,
          prompt,
          negativePrompt: finalNegativePrompt,
          timestamp: new Date(),
          model: currentModel?.name || selectedModel,
          width,
          height,
          sampler: selectedSampler,
          steps: steps[0],
          backgroundColor: bgColor,
        }

        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          saveToHistory(newImage, reader.result as string)
        }

        newGenerated.push(newImage)
      }

      setGeneratedImages(prev => [...newGenerated, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成图像时出错，请重试")
    } finally {
      setIsGenerating(false)
      setGeneratingProgress(null)
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

  const handleDownload = async (url: string, promptText: string, format: string, bgColor?: string) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        if (bgColor && bgColor !== "transparent") {
          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(img, 0, 0)
        const formatInfo = DOWNLOAD_FORMATS.find(f => f.id === format)
        const dataUrl = canvas.toDataURL(formatInfo?.mime || "image/png", 0.95)
        const a = document.createElement("a")
        a.href = dataUrl
        a.download = `whitefox-${promptText.slice(0, 20).replace(/\s+/g, "-")}.${format}`
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
    const matchingRatio = ASPECT_RATIOS.find(s => s.width === record.width && s.height === record.height)
    if (matchingRatio) {
      setSelectedAspectRatio(matchingRatio.id)
    } else {
      setSelectedAspectRatio("custom")
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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground">{t("title")}</h1>
                {currentUser?.isAdmin && (
                  <Badge variant="default" className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {t("adminBadge")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">{t("subtitle")}</p>
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="w-4 h-4" />
                  {languageNames[language]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(languageNames) as Language[]).map(lang => (
                  <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)}>
                    {languageNames[lang]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Single Click Dark/Light Mode Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9"
              onClick={toggleTheme}
              title={t("theme")}
            >
              {mounted && (resolvedTheme === "dark" || theme === "dark") ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              )}
            </Button>

            {/* Cloudflare Token Config Modal Trigger */}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsCfConfigOpen(true)}>
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>CF 凭证配置</span>
            </Button>

            {/* Spells */}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsSpellsOpen(true)}>
              <Zap className="w-4 h-4" />
              {t("spells")}
            </Button>

            {/* Notes */}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsNotesOpen(true)}>
              <BookMarked className="w-4 h-4" />
              {t("notes")}
            </Button>

            {/* Favorites (收藏夹) */}
            <Button variant="outline" size="sm" className="gap-2 relative" onClick={() => setIsFavoritesOpen(true)}>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              {t("favorites")}
              {favorites.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 min-w-4 flex items-center justify-center">
                  {favorites.length}
                </Badge>
              )}
            </Button>

            {/* Albums */}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsAlbumsOpen(true)}>
              <FolderOpen className="w-4 h-4" />
              {t("albums")}
            </Button>

            {/* Models */}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsModelsOpen(true)}>
              <Search className="w-4 h-4" />
              {t("models")}
            </Button>

            {/* History */}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsHistoryOpen(true)}>
              <History className="w-4 h-4" />
              {t("history")}
              {historyRecords.length > 0 && (
                <Badge variant="secondary" className="text-xs">{historyRecords.length}</Badge>
              )}
            </Button>

            {/* Account / Admin Login */}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{currentUser.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    ID: {currentUser.id}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="secondary" size="sm" className="gap-2" onClick={() => { setAuthTab("login"); setIsAuthOpen(true) }}>
                <User className="w-4 h-4" />
                {t("login")}
              </Button>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Single Click Dark/Light Mode Switcher on Mobile */}
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9"
              onClick={toggleTheme}
              title={t("theme")}
            >
              {mounted && (resolvedTheme === "dark" || theme === "dark") ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              )}
            </Button>

            {/* Mobile Menu Trigger */}
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 bg-card/95 backdrop-blur-md p-4 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t("language")}:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs font-normal">
                      {languageNames[language]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(Object.keys(languageNames) as Language[]).map(lang => (
                      <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)}>
                        {languageNames[lang]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {currentUser ? (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-destructive h-7">
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  {t("logout")}
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => { setIsMobileMenuOpen(false); setAuthTab("login"); setIsAuthOpen(true) }} className="h-7 text-xs">
                  <User className="w-3.5 h-3.5 mr-1" />
                  {t("login")} / {t("adminLogin")}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setIsMobileMenuOpen(false); setIsCfConfigOpen(true) }}>
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>CF 凭证</span>
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setIsMobileMenuOpen(false); setIsSpellsOpen(true) }}>
                <Zap className="w-4 h-4 text-amber-500" />
                {t("spells")}
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setIsMobileMenuOpen(false); setIsNotesOpen(true) }}>
                <BookMarked className="w-4 h-4 text-blue-500" />
                {t("notes")}
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setIsMobileMenuOpen(false); setIsFavoritesOpen(true) }}>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {t("favorites")}
                {favorites.length > 0 && <Badge variant="secondary" className="ml-auto text-xs">{favorites.length}</Badge>}
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setIsMobileMenuOpen(false); setIsAlbumsOpen(true) }}>
                <FolderOpen className="w-4 h-4 text-emerald-500" />
                {t("albums")}
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setIsMobileMenuOpen(false); setIsModelsOpen(true) }}>
                <Search className="w-4 h-4 text-purple-500" />
                {t("models")}
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setIsMobileMenuOpen(false); setIsHistoryOpen(true) }}>
                <History className="w-4 h-4 text-rose-500" />
                {t("history")}
                {historyRecords.length > 0 && <Badge variant="secondary" className="ml-auto text-xs">{historyRecords.length}</Badge>}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Tabs (Mode Selection) */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1">
                <TabsTrigger value="text-to-image" className="gap-2 data-[state=active]:bg-card text-xs sm:text-sm">
                  <Wand2 className="w-4 h-4" />
                  <span>{t("textToImage")}</span>
                </TabsTrigger>
                <TabsTrigger value="image-to-image" className="gap-2 data-[state=active]:bg-card text-xs sm:text-sm">
                  <ImageIcon className="w-4 h-4" />
                  <span>{t("imageToImage")}</span>
                </TabsTrigger>
                <TabsTrigger value="reference-image" className="gap-2 data-[state=active]:bg-card text-xs sm:text-sm">
                  <Image className="w-4 h-4" />
                  <span>{t("referenceImage")}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text-to-image" className="mt-4 space-y-4">
                <Card className="bg-card/50 border-border/50 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" />
                      {t("positivePrompt")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={t("promptPlaceholder")}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] bg-secondary/30 border-border/50 resize-none text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="image-to-image" className="mt-4 space-y-4">
                <Card className="bg-card/50 border-border/50 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      {t("uploadImage")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-secondary/20",
                        uploadedImage && "border-primary/50 bg-secondary/20"
                      )}
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      {uploadedImage ? (
                        <div className="space-y-3">
                          <img src={uploadedImage} alt="Uploaded" className="max-h-48 mx-auto rounded-lg shadow-md" />
                          <p className="text-xs text-muted-foreground">{t("clickToChange")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <Upload className="w-10 h-10 mx-auto text-muted-foreground/70" />
                          <p className="text-sm text-muted-foreground font-medium">{t("clickToUpload")}</p>
                          <p className="text-xs text-muted-foreground/60">{t("supportedFormats")}</p>
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
                      <div className="flex justify-between items-center text-xs">
                        <Label>{t("strength")}</Label>
                        <span className="font-mono">{strength[0].toFixed(2)}</span>
                      </div>
                      <Slider value={strength} onValueChange={setStrength} min={0.1} max={1} step={0.05} className="w-full" />
                    </div>
                    <Textarea
                      placeholder={t("promptPlaceholder")}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[80px] bg-secondary/30 border-border/50 resize-none text-foreground placeholder:text-muted-foreground"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reference-image" className="mt-4 space-y-4">
                <Card className="bg-card/50 border-border/50 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Image className="w-4 h-4 text-primary" />
                      {t("uploadReference")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-secondary/20",
                        referenceImage && "border-primary/50 bg-secondary/20"
                      )}
                      onClick={() => document.getElementById("reference-upload")?.click()}
                    >
                      {referenceImage ? (
                        <div className="space-y-3">
                          <img src={referenceImage} alt="Reference" className="max-h-48 mx-auto rounded-lg shadow-md" />
                          <p className="text-xs text-muted-foreground">{t("clickToChange")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <Image className="w-10 h-10 mx-auto text-muted-foreground/70" />
                          <p className="text-sm text-muted-foreground font-medium">{t("clickToUpload")}</p>
                          <p className="text-xs text-muted-foreground/60">{t("supportedFormats")}</p>
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
                      <div className="flex justify-between items-center text-xs">
                        <Label>{t("referenceStrength")}</Label>
                        <span className="font-mono">{referenceStrength[0].toFixed(2)}</span>
                      </div>
                      <Slider value={referenceStrength} onValueChange={setReferenceStrength} min={0.1} max={1} step={0.05} className="w-full" />
                    </div>
                    <Textarea
                      placeholder={t("promptPlaceholder")}
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
              <Card className="bg-card/50 border-border/50 shadow-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        {t("negativePrompt")}
                        <Badge variant="secondary" className="text-xs">
                          {selectedPresets.length + customNegativePrompts.length}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Switch checked={useNegativePrompt} onCheckedChange={setUseNegativePrompt} />
                          <span className="text-xs text-muted-foreground">{useNegativePrompt ? t("enabled") : t("disabled")}</span>
                        </div>
                        {negativePromptOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">{t("presetTemplates")}</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setIsPresetDialogOpen(true)}>
                          <Plus className="w-3 h-3 mr-1" />
                          {t("addPreset")}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {negativePresets.map((preset) => (
                          <Badge
                            key={preset.id}
                            variant={selectedPresets.includes(preset.id) ? "default" : "outline"}
                            className={cn("cursor-pointer transition-colors", selectedPresets.includes(preset.id) ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}
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
                          className="bg-secondary/30 border-border/50 text-sm"
                        />
                        <Button onClick={addCustomPromptHandler} size="sm"><Plus className="w-4 h-4" /></Button>
                      </div>
                      {customNegativePrompts.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {customNegativePrompts.map((cp) => (
                            <Badge key={cp} variant="secondary" className="gap-1 text-xs">
                              {cp}
                              <button onClick={() => setCustomNegativePrompts(prev => prev.filter(p => p !== cp))}><X className="w-3 h-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("manualInput")}</Label>
                      <Textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="min-h-[60px] bg-secondary/30 border-border/50 resize-none text-xs"
                      />
                    </div>
                    {currentNegativePromptPreview && (
                      <div className="p-2.5 bg-secondary/30 rounded-lg border border-border/30">
                        <Label className="text-[10px] text-muted-foreground block mb-1">{t("preview")}</Label>
                        <p className="text-xs text-foreground/80 break-words font-mono">{currentNegativePromptPreview}</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Quick Action Bar / Generate Control */}
            <div className="space-y-3">
              {generatingProgress && (
                <div className="text-xs text-center text-primary animate-pulse font-medium">
                  {generatingProgress}
                </div>
              )}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || (activeTab === "image-to-image" && !uploadedImage) || (activeTab === "reference-image" && !referenceImage)}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base shadow-lg shadow-primary/20"
              >
                {isGenerating ? (
                  <><Spinner className="w-5 h-5 mr-2" />{generatingProgress || t("generating")}</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" />{t("generate")}{batchCount > 1 ? ` (${batchCount}张)` : ""}</>
                )}
              </Button>
            </div>

            {error && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardContent className="py-3">
                  <p className="text-xs sm:text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Generated Images Gallery */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  {t("results")}
                  {generatedImages.length > 0 && <span className="text-xs text-muted-foreground font-normal">({generatedImages.length})</span>}
                </h2>
              </div>

              {generatedImages.length === 0 ? (
                <Card className="bg-card/30 border-border/30">
                  <CardContent className="py-12 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground text-sm">{t("noImages")}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{t("startCreating")}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {generatedImages.map((image) => {
                    const favorited = isFavorited(image.id)
                    const bgStyle = image.backgroundColor && image.backgroundColor !== "transparent"
                      ? { backgroundColor: image.backgroundColor }
                      : undefined
                    return (
                      <Card key={image.id} className="bg-card/50 border-border/50 overflow-hidden group shadow-sm transition-all hover:shadow-md">
                        <div className="relative aspect-square bg-muted/20 flex items-center justify-center" style={bgStyle}>
                          <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {DOWNLOAD_FORMATS.map((format) => (
                                  <Button
                                    key={format.id}
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[10px] h-7 px-2"
                                    onClick={() => handleDownload(image.url, image.prompt, format.id, image.backgroundColor)}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    {format.name}
                                  </Button>
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {/* Favorite Toggle */}
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className={cn("bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-8 w-8 p-0", favorited && "bg-amber-500/80 hover:bg-amber-500 text-white")}
                                    onClick={() => toggleFavorite({
                                      id: image.id,
                                      title: image.prompt.slice(0, 30),
                                      prompt: image.prompt,
                                      negativePrompt: image.negativePrompt,
                                      url: image.url,
                                      model: image.model,
                                      createdAt: new Date().toISOString(),
                                      type: "image",
                                    })}
                                    title={t("favorites")}
                                  >
                                    <Star className={cn("w-4 h-4", favorited && "fill-white")} />
                                  </Button>
                                  <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-8 w-8 p-0" onClick={() => handleCopyUrl(image.url, image.id)}>
                                    {copiedId === image.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                  </Button>
                                  <a href={image.url} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-8 w-8 p-0">
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  </a>
                                  {albums.length > 0 && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-8 w-8 p-0">
                                          <FolderPlus className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        {albums.map(album => (
                                          <DropdownMenuItem key={album.id} onClick={() => addToAlbum(image.id, album.id)}>
                                            {album.name}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                                <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-8 w-8 p-0" onClick={() => setGeneratedImages(prev => prev.filter(img => img.id !== image.id))}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="text-xs text-foreground line-clamp-2">{image.prompt}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="outline" className="text-[10px]">{image.model}</Badge>
                            <Badge variant="outline" className="text-[10px]">{image.width}x{image.height}</Badge>
                            <Badge variant="outline" className="text-[10px]">{image.sampler}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Settings Drawer */}
          <div className="space-y-4">
            <Card className="bg-card/50 border-border/50 sticky top-20 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  {t("settings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Batch Count (批量生成数量 1-4) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      {t("batchCount")}
                    </Label>
                    <span className="text-xs font-bold text-primary font-mono">{batchCount} 张</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map(num => (
                      <Button
                        key={num}
                        type="button"
                        size="sm"
                        variant={batchCount === num ? "default" : "outline"}
                        className={cn("h-8 text-xs font-medium", batchCount === num && "bg-primary text-primary-foreground")}
                        onClick={() => setBatchCount(num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio & Resolution Control */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                    {t("aspectRatio")}
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ASPECT_RATIOS.map(ratio => (
                      <Button
                        key={ratio.id}
                        type="button"
                        size="sm"
                        variant={selectedAspectRatio === ratio.id ? "default" : "outline"}
                        className={cn("h-8 text-xs justify-start px-2.5", selectedAspectRatio === ratio.id && "bg-primary text-primary-foreground")}
                        onClick={() => setSelectedAspectRatio(ratio.id)}
                      >
                        <span className="font-mono text-[10px] opacity-70 mr-1.5">{ratio.ratioLabel}</span>
                        <span className="truncate">{ratio.name.split(" ")[1] || ratio.name}</span>
                      </Button>
                    ))}
                  </div>

                  {selectedAspectRatio === "custom" && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{t("width")}</Label>
                        <Input
                          type="number"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(Math.min(2048, Math.max(256, parseInt(e.target.value) || 512)))}
                          min={256}
                          max={2048}
                          className="bg-secondary/30 border-border/50 text-xs h-8 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{t("height")}</Label>
                        <Input
                          type="number"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(Math.min(2048, Math.max(256, parseInt(e.target.value) || 512)))}
                          min={256}
                          max={2048}
                          className="bg-secondary/30 border-border/50 text-xs h-8 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Model Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">{t("model")}</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-secondary/30 border-border/50 text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(model => (
                        <SelectItem key={model.id} value={model.id} className="text-xs">
                          <div className="flex items-center gap-2">
                            {model.name}
                            {!DEFAULT_MODELS.some(dm => dm.id === model.id) && (
                              <Badge variant="outline" className="text-[10px]">Custom</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sampler Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">{t("sampler")}</Label>
                  <Select value={selectedSampler} onValueChange={setSelectedSampler}>
                    <SelectTrigger className="bg-secondary/30 border-border/50 text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLERS.map(sampler => (
                        <SelectItem key={sampler.id} value={sampler.id} className="text-xs">{sampler.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Steps Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label className="text-muted-foreground">{t("steps")}</Label>
                    <span className="font-mono">{steps[0]}</span>
                  </div>
                  <Slider value={steps} onValueChange={setSteps} min={1} max={50} step={1} className="w-full" />
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    {t("backgroundColor")}
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {BACKGROUND_COLORS.map(color => (
                      <button
                        key={color.id}
                        type="button"
                        className={cn(
                          "w-7 h-7 rounded-md border transition-all",
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
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="color"
                        value={customBgColor}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className="w-8 h-8 rounded border border-border/50 cursor-pointer"
                      />
                      <Input
                        value={customBgColor}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className="flex-1 bg-secondary/30 border-border/50 text-xs h-8 font-mono"
                        placeholder="#ffffff"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialogs */}

      {/* Cloudflare Config Modal */}
      <Dialog open={isCfConfigOpen} onOpenChange={setIsCfConfigOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Cloudflare 凭证配置
            </DialogTitle>
            <DialogDescription>
              可在此直接设置 Cloudflare Account ID 和 API Token，无需依赖部署后台环境变量。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cloudflare Account ID</Label>
              <Input
                placeholder="例如: abc123def456..."
                value={cfAccountId}
                onChange={(e) => setCfAccountId(e.target.value)}
                className="bg-secondary/30 border-border/50 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cloudflare API Token</Label>
              <Input
                type="password"
                placeholder="包含 Workers AI 读写权限的 API Token"
                value={cfApiToken}
                onChange={(e) => setCfApiToken(e.target.value)}
                className="bg-secondary/30 border-border/50 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={saveCfConfig} className="w-full">
              保存 Cloudflare 凭证
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth / Admin Login Dialog */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t("account")}
            </DialogTitle>
            <DialogDescription>
              免数据库模式：保存本地偏好、自定义设置，或验证管理员密码。
            </DialogDescription>
          </DialogHeader>

          <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as typeof authTab)} className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login" className="text-xs">{t("login")}</TabsTrigger>
              <TabsTrigger value="register" className="text-xs">{t("register")}</TabsTrigger>
              <TabsTrigger value="admin" className="text-xs text-amber-500 font-medium">{t("adminLogin")}</TabsTrigger>
            </TabsList>

            <div className="space-y-4 py-4">
              {authTab === "admin" ? (
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    {t("adminPassword")}
                  </Label>
                  <Input
                    type="password"
                    placeholder="输入环境变量配置的 ADMIN_PASSWORD"
                    value={authAdminPassword}
                    onChange={(e) => setAuthAdminPassword(e.target.value)}
                    className="bg-secondary/30 border-border/50"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">{t("username")}</Label>
                    <Input
                      placeholder="用户名..."
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className="bg-secondary/30 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t("password")}</Label>
                    <Input
                      type="password"
                      placeholder="密码..."
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="bg-secondary/30 border-border/50"
                    />
                  </div>
                </>
              )}

              {authError && <p className="text-xs text-destructive">{authError}</p>}
              {authSuccess && <p className="text-xs text-emerald-500 font-medium">{authSuccess}</p>}
            </div>

            <DialogFooter>
              <Button onClick={handleAuthAction} className="w-full">
                {authTab === "admin" ? "验证管理员" : authTab === "login" ? t("login") : t("register")}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Favorites Modal (收藏夹) */}
      <Dialog open={isFavoritesOpen} onOpenChange={setIsFavoritesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              {t("favorites")}
            </DialogTitle>
            <DialogDescription>已收藏的图像与提示词</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 my-2">
            {favorites.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
                <p className="text-sm">暂无收藏内容</p>
                <p className="text-xs text-muted-foreground/70 mt-1">在生成的图像或提示词上点击星号按钮进行收藏</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {favorites.map((fav) => (
                  <Card key={fav.id} className="bg-secondary/30 border-border/50 overflow-hidden">
                    {fav.url && (
                      <img src={fav.url} alt={fav.title} className="w-full aspect-video object-cover" />
                    )}
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-xs text-foreground line-clamp-1">{fav.title || fav.prompt}</h4>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-amber-400 hover:text-amber-500" onClick={() => toggleFavorite(fav)}>
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 font-mono">{fav.prompt}</p>
                      <div className="flex justify-end pt-1">
                        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => { setPrompt(fav.prompt); if (fav.negativePrompt) setNegativePrompt(fav.negativePrompt); setIsFavoritesOpen(false); }}>
                          {t("usePrompt")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Spells Modal */}
      <Dialog open={isSpellsOpen} onOpenChange={setIsSpellsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              {t("spellsTitle")}
            </DialogTitle>
            <DialogDescription>{t("spellsDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-1.5 flex-wrap my-2">
            <Badge
              variant={selectedSpellCategory === null ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedSpellCategory(null)}
            >
              All
            </Badge>
            {SPELL_CATEGORIES.map(cat => (
              <Badge
                key={cat}
                variant={selectedSpellCategory === cat ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedSpellCategory(cat)}
              >
                {t(cat)}
              </Badge>
            ))}
          </div>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {filteredSpells.map(spell => (
                <Card key={spell.id} className="bg-secondary/30">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-xs text-foreground">{spell.name}</h4>
                          <Badge variant="outline" className="text-[10px]">{t(spell.category)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{spell.prompt}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 text-xs" onClick={() => applySpell(spell)}>
                          {t("applySpell")}
                        </Button>
                        {spell.isCustom && (
                          <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => deleteSpell(spell.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-2">
            <Button size="sm" onClick={() => setIsSpellDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              {t("addSpell")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Spell Dialog */}
      <Dialog open={isSpellDialogOpen} onOpenChange={setIsSpellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addSpell")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("spellName")}</Label>
              <Input value={newSpellName} onChange={e => setNewSpellName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("spellCategory")}</Label>
              <Select value={newSpellCategory} onValueChange={setNewSpellCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPELL_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{t(cat)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("spellPrompt")}</Label>
              <Textarea value={newSpellPrompt} onChange={e => setNewSpellPrompt(e.target.value)} className="min-h-[70px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("spellNegative")}</Label>
              <Textarea value={newSpellNegative} onChange={e => setNewSpellNegative(e.target.value)} className="min-h-[50px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsSpellDialogOpen(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={addSpell}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-blue-500" />
              {t("notesTitle")}
            </DialogTitle>
            <DialogDescription>{t("notesDesc")}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3 py-2">
              <Card className="bg-secondary/30">
                <CardContent className="p-3 space-y-2">
                  <Input
                    placeholder={t("noteTitle")}
                    value={newNoteTitle}
                    onChange={e => setNewNoteTitle(e.target.value)}
                    className="text-xs"
                  />
                  <Textarea
                    placeholder={t("positivePrompt")}
                    value={newNotePrompt}
                    onChange={e => setNewNotePrompt(e.target.value)}
                    className="min-h-[70px] text-xs"
                  />
                  <Textarea
                    placeholder={t("negativePrompt")}
                    value={newNoteNegative}
                    onChange={e => setNewNoteNegative(e.target.value)}
                    className="min-h-[50px] text-xs"
                  />
                  <Button size="sm" onClick={saveNote} disabled={!newNoteTitle.trim() || !newNotePrompt.trim()}>
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {editingNote ? t("save") : t("addNote")}
                  </Button>
                </CardContent>
              </Card>

              {notes.map(note => (
                <Card key={note.id} className="bg-secondary/30">
                  <CardContent className="p-3 flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-xs text-foreground">{note.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{note.prompt}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 text-xs" onClick={() => useNote(note)}>{t("usePrompt")}</Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteNote(note.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-rose-500" />
              {t("historyTitle")}
            </DialogTitle>
            <DialogDescription>{t("historyDesc")}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 my-2">
            <div className="space-y-3">
              {historyRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-xs">{t("noHistory")}</p>
                </div>
              ) : (
                historyRecords.map(record => (
                  <Card key={record.id} className="bg-secondary/30">
                    <CardContent className="p-3 flex gap-3 items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-foreground line-clamp-2">{record.prompt}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatHistoryDate(record.timestamp)} | {record.width}x{record.height}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => restoreFromHistory(record)}>
                          {t("restore")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Albums Modal */}
      <Dialog open={isAlbumsOpen} onOpenChange={setIsAlbumsOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-emerald-500" />
              {t("albumsTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 my-2">
            <Input
              placeholder={t("albumName")}
              value={newAlbumName}
              onChange={e => setNewAlbumName(e.target.value)}
              className="text-xs"
            />
            <Button size="sm" onClick={createAlbum} disabled={!newAlbumName.trim()}>
              <FolderPlus className="w-4 h-4 mr-1" />
              {t("createAlbum")}
            </Button>
          </div>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {albums.map(album => (
                <Card key={album.id} className="bg-secondary/30 p-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-xs">{album.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{album.imageIds.length} images</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => deleteAlbum(album.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Models Modal */}
      <Dialog open={isModelsOpen} onOpenChange={setIsModelsOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" />
              {t("modelsTitle")}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t("searchModels")}
            value={modelSearchQuery}
            onChange={e => setModelSearchQuery(e.target.value)}
            className="my-2 text-xs"
          />
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {filteredModels.map(model => {
                const isAdded = models.some(m => m.id === model.id)
                return (
                  <Card key={model.id} className="bg-secondary/30 p-3 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-xs">{model.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{model.description}</p>
                    </div>
                    <Button size="sm" variant={isAdded ? "secondary" : "default"} onClick={() => addModelFromSearch(model)} disabled={isAdded} className="h-7 text-xs">
                      {isAdded ? "已添加" : "添加"}
                    </Button>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

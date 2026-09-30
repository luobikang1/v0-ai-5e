"use client"

import { useState, useCallback, useEffect } from "react"
import { useTheme } from "next-themes"
import { 
  ImageIcon, Wand2, Upload, Sparkles, Download, Trash2, Settings2, 
  Plus, X, BookOpen, Save, FolderOpen, ExternalLink, Copy, Check,
  ChevronDown, ChevronUp, History, Clock, Calendar, Search, Image,
  FileText, FolderPlus, Palette, Languages, Zap, BookMarked, Globe,
  Sun, Moon, Menu, Heart, Star, Shield, User, LogOut, Lock, SlidersHorizontal,
  Layers, KeyRound, CheckSquare, Square, RefreshCw, Camera, Tv, Film, Box, Grid, Smile
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
  modelId: string
  width: number
  height: number
  sampler: string
  steps: number
  albumId?: string
  isFavorite?: boolean
  backgroundColor?: string
  stylePreset?: string
}

interface HistoryRecord {
  id: string
  prompt: string
  negativePrompt: string
  timestamp: string
  model: string
  modelId?: string
  width: number
  height: number
  sampler: string
  steps: number
  imageData?: string
  backgroundColor?: string
  stylePreset?: string
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
  coverUrl?: string
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

interface StylePreset {
  id: string
  name: string
  promptModifier: string
  negativeModifier: string
  coverUrl: string
}

// Constants
const DEFAULT_MODELS: CustomModel[] = [
  {
    id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    name: "Stable Diffusion XL",
    endpoint: "",
    apiKeyEnvVar: "",
    type: "cloudflare",
    description: "高质量通用图像生成基础模型，画质细腻逼真",
    tags: ["SDXL", "高画质", "推荐"],
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
  },
  {
    id: "@cf/lykon/dreamshaper-8-lcm",
    name: "DreamShaper 8 LCM",
    endpoint: "",
    apiKeyEnvVar: "",
    type: "cloudflare",
    description: "快速梦幻艺术风格生成，色彩绚丽生动",
    tags: ["快速", "梦幻", "插画"],
    coverUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&q=80",
  },
  {
    id: "@cf/bytedance/stable-diffusion-xl-lightning",
    name: "SDXL Lightning",
    endpoint: "",
    apiKeyEnvVar: "",
    type: "cloudflare",
    description: "字节跳动极速 SDXL 模型，1-4步秒级高帧率成图",
    tags: ["极速", "SDXL", "高效率"],
    coverUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&q=80",
  },
]

const SEARCHABLE_MODELS: CustomModel[] = [
  ...DEFAULT_MODELS,
  {
    id: "@cf/runwayml/stable-diffusion-v1-5",
    name: "Stable Diffusion 1.5",
    endpoint: "",
    apiKeyEnvVar: "",
    type: "cloudflare",
    description: "经典 SD 1.5 图像模型，艺术风格兼容性强",
    tags: ["经典", "SD1.5"],
    coverUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80",
  },
  {
    id: "@cf/stabilityai/stable-diffusion-xl-turbo",
    name: "SDXL Turbo",
    endpoint: "",
    apiKeyEnvVar: "",
    type: "cloudflare",
    description: "涡轮增压 SDXL 模型，单步实时流畅成图",
    tags: ["实时", "SDXL"],
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
  },
  {
    id: "dall-e-3",
    name: "DALL-E 3",
    endpoint: "https://api.openai.com/v1/images/generations",
    apiKeyEnvVar: "OPENAI_API_KEY",
    type: "openai",
    description: "OpenAI 旗舰 AI 绘图模型，精准理解复杂文字语义",
    tags: ["OpenAI", "旗舰", "语义理解"],
    coverUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&q=80",
  },
  {
    id: "stability-ai/sdxl",
    name: "SDXL (Replicate)",
    endpoint: "https://api.replicate.com/v1/predictions",
    apiKeyEnvVar: "REPLICATE_API_TOKEN",
    type: "replicate",
    description: "Replicate 云端高精度 SDXL 生产渲染",
    tags: ["Replicate", "云端"],
    coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
  },
]

const STYLE_PRESETS: StylePreset[] = [
  { id: "none", name: "无风格", promptModifier: "", negativeModifier: "", coverUrl: "" },
  { id: "photorealistic", name: "写实逼真", promptModifier: ", professional 8k photograph, sharp focus, ultra realistic, studio lighting, highly detailed", negativeModifier: ", cartoon, anime, drawing, painting, 3d render", coverUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80" },
  { id: "anime", name: "动漫二次元", promptModifier: ", anime style, vibrant colors, detailed illustration, dynamic lighting, studio ghibli aesthetic", negativeModifier: ", realistic, photo, 3d render", coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80" },
  { id: "cyberpunk", name: "赛博朋克", promptModifier: ", cyberpunk aesthetic, neon glow, futuristic city, cinematic lighting, octane render, 8k", negativeModifier: ", medieval, rural, pastel", coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&q=80" },
  { id: "watercolor", name: "水彩插画", promptModifier: ", soft watercolor painting, elegant ink washes, textured paper, artistic brush strokes, masterpiece", negativeModifier: ", photo, 3d, realistic", coverUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&q=80" },
  { id: "oil", name: "古典油画", promptModifier: ", classical oil painting, rich impasto texture, dramatic chiaroscuro lighting, museum quality", negativeModifier: ", photo, digital, cartoon", coverUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&q=80" },
  { id: "cinematic", name: "胶片电影", promptModifier: ", 35mm film photograph, cinematic shot, anamorphic lens flare, movie scene, depth of field, color graded", negativeModifier: ", CG, 3d, drawing", coverUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&q=80" },
  { id: "3d", name: "3D 渲染", promptModifier: ", 3D Pixar style render, Octane render, ray tracing, cute volumetric lighting, smooth 3d model", negativeModifier: ", flat 2d, sketch, photo", coverUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=200&q=80" },
  { id: "pixel", name: "像素艺术", promptModifier: ", 16-bit pixel art, retro video game style, pixelated detail, nostalgia", negativeModifier: ", smooth, high res photo, 3d", coverUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&q=80" },
  { id: "clay", name: "粘土材质", promptModifier: ", claymation style, stop motion plasticine, tactile clay texture, handcrafted sculpture", negativeModifier: ", photo, digital drawing", coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=200&q=80" },
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
  const [selectedStyle, setSelectedStyle] = useState("none")
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

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Cloudflare API Credentials
  const [cfAccountId, setCfAccountId] = useState("")
  const [cfApiToken, setCfApiToken] = useState("")
  const [isCfConfigOpen, setIsCfConfigOpen] = useState(false)

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Sampling and aspect ratio
  const [selectedSampler, setSelectedSampler] = useState("euler_a")
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1")
  const [customWidthInput, setCustomWidthInput] = useState("512")
  const [customHeightInput, setCustomHeightInput] = useState("512")

  // Background color
  const [selectedBgColor, setSelectedBgColor] = useState("transparent")
  const [customBgColor, setCustomBgColor] = useState("#ffffff")

  // User auth & Favorites
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [hasAdminPassword, setHasAdminPassword] = useState(false)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [authTab, setAuthTab] = useState<"login" | "register" | "admin">("login")
  const [authUsername, setAuthUsername] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authAdminPassword, setAuthAdminPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)

  // History & Batch History
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([])

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

  // Download state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Check admin status on load
  useEffect(() => {
    fetch("/api/auth")
      .then(res => res.json())
      .then(data => {
        if (data.hasAdminPassword) {
          setHasAdminPassword(true)
        }
      })
      .catch(() => {})
  }, [])

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
    showToast("Cloudflare 凭证保存成功！")
  }

  // Dimension helpers
  const getParsedCustomDimensions = useCallback(() => {
    let w = parseInt(customWidthInput) || 512
    let h = parseInt(customHeightInput) || 512
    w = Math.min(2048, Math.max(128, w))
    h = Math.min(2048, Math.max(128, h))
    return { width: w, height: h }
  }, [customWidthInput, customHeightInput])

  const getCurrentDimensions = useCallback(() => {
    if (selectedAspectRatio === "custom") {
      return getParsedCustomDimensions()
    }
    const ratioOpt = ASPECT_RATIOS.find(r => r.id === selectedAspectRatio)
    return { width: ratioOpt?.width || 1024, height: ratioOpt?.height || 1024 }
  }, [selectedAspectRatio, getParsedCustomDimensions])

  const buildNegativePrompt = useCallback(() => {
    if (!useNegativePrompt) return ""
    const presetPrompts = selectedPresets.flatMap(presetId => {
      const preset = negativePresets.find(p => p.id === presetId)
      return preset ? preset.prompts : []
    })
    const allPrompts = [...presetPrompts, ...customNegativePrompts]

    // Append style negative modifier if selected
    const styleObj = STYLE_PRESETS.find(s => s.id === selectedStyle)
    if (styleObj?.negativeModifier) {
      allPrompts.push(styleObj.negativeModifier)
    }

    if (negativePrompt.trim()) {
      allPrompts.push(negativePrompt.trim())
    }
    return [...new Set(allPrompts)].join(", ")
  }, [selectedPresets, customNegativePrompts, negativePrompt, negativePresets, useNegativePrompt, selectedStyle])

  const buildPositivePrompt = useCallback(() => {
    let finalPrompt = prompt.trim()
    const styleObj = STYLE_PRESETS.find(s => s.id === selectedStyle)
    if (styleObj?.promptModifier) {
      finalPrompt += styleObj.promptModifier
    }
    return finalPrompt
  }, [prompt, selectedStyle])

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
      modelId: image.modelId,
      width: image.width,
      height: image.height,
      sampler: image.sampler,
      steps: image.steps,
      imageData: imageData || image.url,
      backgroundColor: image.backgroundColor,
      stylePreset: image.stylePreset,
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
        const localUser: UserAccount = {
          id: `local-${Date.now()}`,
          username: authUsername.trim(),
          isAdmin: false,
          storageMode: "local",
        }
        setCurrentUser(localUser)
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(localUser))
        setAuthSuccess(authTab === "login" ? "离线/本地模式登录成功！" : "本地注册成功！")
        setTimeout(() => setIsAuthOpen(false), 1000)
      }
    } catch {
      const localUser: UserAccount = {
        id: `local-${Date.now()}`,
        username: authUsername.trim(),
        isAdmin: false,
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

  // Import parameters from image or history
  const importParameters = (targetPrompt: string, targetNegative?: string, targetModelId?: string, targetWidth?: number, targetHeight?: number, targetSampler?: string, targetSteps?: number) => {
    setPrompt(targetPrompt)
    if (targetNegative) setNegativePrompt(targetNegative)
    if (targetModelId && models.some(m => m.id === targetModelId)) {
      setSelectedModel(targetModelId)
    }
    if (targetSampler) setSelectedSampler(targetSampler)
    if (targetSteps) setSteps([Math.min(50, Math.max(1, targetSteps))])

    if (targetWidth && targetHeight) {
      const matched = ASPECT_RATIOS.find(r => r.width === targetWidth && r.height === targetHeight)
      if (matched) {
        setSelectedAspectRatio(matched.id)
      } else {
        setSelectedAspectRatio("custom")
        setCustomWidthInput(targetWidth.toString())
        setCustomHeightInput(targetHeight.toString())
      }
    }
    showToast("已成功导入绘图参数！")
  }

  // Generation handler (supports 1 - 4 batch generation)
  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setGeneratingProgress(null)

    const finalPositivePrompt = buildPositivePrompt()
    const finalNegativePrompt = buildNegativePrompt()
    const currentModel = models.find(m => m.id === selectedModel)
    const { width, height } = getCurrentDimensions()
    const bgColor = getCurrentBgColor()

    // Clamp steps <= 50 to prevent crash
    const safeSteps = Math.min(50, Math.max(1, steps[0]))

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
            prompt: finalPositivePrompt,
            negativePrompt: finalNegativePrompt,
            model: selectedModel,
            modelConfig: currentModel,
            steps: safeSteps,
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

        const reader = new FileReader()
        reader.readAsDataURL(blob)

        const newImage: GeneratedImage = {
          id: `${Date.now()}-${i}`,
          url,
          prompt: finalPositivePrompt,
          negativePrompt: finalNegativePrompt,
          timestamp: new Date(),
          model: currentModel?.name || selectedModel,
          modelId: selectedModel,
          width,
          height,
          sampler: selectedSampler,
          steps: safeSteps,
          backgroundColor: bgColor,
          stylePreset: selectedStyle,
        }

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

  // Download handler
  const handleDownload = async (url: string, promptText: string, format: string = "png", bgColor?: string) => {
    try {
      const formatInfo = DOWNLOAD_FORMATS.find(f => f.id === format) || DOWNLOAD_FORMATS[0]
      const img = new window.Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })

      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth || img.width || 1024
      canvas.height = img.naturalHeight || img.height || 1024
      const ctx = canvas.getContext("2d")

      if (ctx) {
        if (bgColor && bgColor !== "transparent") {
          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL(formatInfo.mime, 0.95)
        const a = document.createElement("a")
        a.href = dataUrl
        a.download = `whitefox-${promptText.slice(0, 20).replace(/\s+/g, "-")}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        return
      }
    } catch {
      const a = document.createElement("a")
      a.href = url
      a.download = `whitefox-${promptText.slice(0, 20).replace(/\s+/g, "-")}.${format}`
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
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

  // History handlers & Batch Management
  const toggleSelectHistory = (id: string) => {
    setSelectedHistoryIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const selectAllHistory = () => {
    if (selectedHistoryIds.length === historyRecords.length) {
      setSelectedHistoryIds([])
    } else {
      setSelectedHistoryIds(historyRecords.map(r => r.id))
    }
  }

  const batchDeleteHistory = () => {
    if (selectedHistoryIds.length === 0) return
    setHistoryRecords(prev => {
      const updated = prev.filter(r => !selectedHistoryIds.includes(r.id))
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(updated))
      return updated
    })
    setSelectedHistoryIds([])
    showToast("已成功批量删除记录！")
  }

  const restoreFromHistory = (record: HistoryRecord) => {
    importParameters(
      record.prompt,
      record.negativePrompt,
      record.modelId,
      record.width,
      record.height,
      record.sampler,
      record.steps
    )
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground text-xs px-4 py-2.5 rounded-lg shadow-xl font-medium animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

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
            {/* Art Styles Selection Grid (艺术风格选择) */}
            <Card className="bg-card/50 border-border/50 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  {t("styles")}
                </CardTitle>
                {selectedStyle !== "none" && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => setSelectedStyle("none")}>
                    {t("styleNone")}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                  <div className="flex gap-2">
                    {STYLE_PRESETS.map(style => (
                      <button
                        key={style.id}
                        type="button"
                        className={cn(
                          "relative group flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all flex flex-col justify-end p-1.5 text-left",
                          selectedStyle === style.id ? "border-primary ring-2 ring-primary/40" : "border-border/40 hover:border-primary/50"
                        )}
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        {style.coverUrl ? (
                          <img src={style.coverUrl} alt={style.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <span className="relative text-[11px] font-medium text-white truncate z-10">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

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

                                  {/* 1-Click Import Parameters */}
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-8 w-8 p-0"
                                    onClick={() => importParameters(image.prompt, image.negativePrompt, image.modelId, image.width, image.height, image.sampler, image.steps)}
                                    title={t("importParams")}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>

                                  <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-8 w-8 p-0" onClick={() => handleCopyUrl(image.url, image.id)}>
                                    {copiedId === image.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                  </Button>
                                  <a href={image.url} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-8 w-8 p-0">
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  </a>
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
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">{t("width")}</Label>
                          <Input
                            type="number"
                            value={customWidthInput}
                            onChange={(e) => setCustomWidthInput(e.target.value)}
                            onBlur={() => {
                              let val = parseInt(customWidthInput) || 512
                              val = Math.min(2048, Math.max(128, val))
                              setCustomWidthInput(val.toString())
                            }}
                            className="bg-secondary/30 border-border/50 text-xs h-8 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">{t("height")}</Label>
                          <Input
                            type="number"
                            value={customHeightInput}
                            onChange={(e) => setCustomHeightInput(e.target.value)}
                            onBlur={() => {
                              let val = parseInt(customHeightInput) || 512
                              val = Math.min(2048, Math.max(128, val))
                              setCustomHeightInput(val.toString())
                            }}
                            className="bg-secondary/30 border-border/50 text-xs h-8 font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {[512, 768, 1024, 1280].map(res => (
                          <Button
                            key={res}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px] font-mono"
                            onClick={() => {
                              setCustomWidthInput(res.toString())
                              setCustomHeightInput(res.toString())
                            }}
                          >
                            {res}x{res}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Model Selector */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium text-muted-foreground">{t("model")}</Label>
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1 text-primary" onClick={() => setIsModelsOpen(true)}>
                      查看全部/搜索模型
                    </Button>
                  </div>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-secondary/30 border-border/50 text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(model => (
                        <SelectItem key={model.id} value={model.id} className="text-xs">
                          <div className="flex items-center gap-2 truncate">
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

                {/* Steps Slider (Clamped max 50) */}
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
              {hasAdminPassword && (
                <TabsTrigger value="admin" className="text-xs text-amber-500 font-medium">{t("adminLogin")}</TabsTrigger>
              )}
            </TabsList>

            <div className="space-y-4 py-4">
              {authTab === "admin" && hasAdminPassword ? (
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
                        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => { importParameters(fav.prompt, fav.negativePrompt); setIsFavoritesOpen(false); }}>
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

      {/* History Modal with Batch Management & Thumbnails */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-rose-500" />
              {t("historyTitle")}
            </DialogTitle>
            <DialogDescription>{t("historyDesc")}</DialogDescription>
          </DialogHeader>

          {/* Batch Controls Toolbar */}
          {historyRecords.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={selectAllHistory}>
                  {selectedHistoryIds.length === historyRecords.length ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5" />}
                  {selectedHistoryIds.length === historyRecords.length ? t("deselectAll") : t("selectAll")}
                </Button>
                {selectedHistoryIds.length > 0 && (
                  <span className="text-xs text-muted-foreground">已选择 {selectedHistoryIds.length} 项</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedHistoryIds.length > 0 && (
                  <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={batchDeleteHistory}>
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("batchDelete")} ({selectedHistoryIds.length})
                  </Button>
                )}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 pr-4 my-2">
            <div className="space-y-3">
              {historyRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-xs">{t("noHistory")}</p>
                </div>
              ) : (
                historyRecords.map(record => {
                  const isSelected = selectedHistoryIds.includes(record.id)
                  return (
                    <Card key={record.id} className={cn("bg-secondary/30 transition-all border-border/40", isSelected && "border-primary/80 ring-1 ring-primary/40 bg-primary/5")}>
                      <CardContent className="p-3 flex gap-3 items-center">
                        <button type="button" onClick={() => toggleSelectHistory(record.id)} className="text-muted-foreground hover:text-primary">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                        </button>

                        {/* Thumbnail Image */}
                        {record.imageData ? (
                          <img src={record.imageData} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-muted/20" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-xs font-medium text-foreground line-clamp-2">{record.prompt}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                            <span>{formatHistoryDate(record.timestamp)}</span>
                            <Badge variant="outline" className="text-[10px] py-0 h-4">{record.model}</Badge>
                            <Badge variant="outline" className="text-[10px] py-0 h-4">{record.width}x{record.height}</Badge>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => restoreFromHistory(record)}>
                            <RefreshCw className="w-3 h-3" />
                            {t("importParams")}
                          </Button>
                          {record.imageData && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleDownload(record.imageData!, record.prompt, "png", record.backgroundColor)}>
                              <Download className="w-3 h-3" />
                              {t("download")}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
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

      {/* Models Search Modal with Cover Images & Direct Use */}
      <Dialog open={isModelsOpen} onOpenChange={setIsModelsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" />
              {t("modelsTitle")}
            </DialogTitle>
            <DialogDescription>{t("modelsDesc")}</DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t("searchModels")}
            value={modelSearchQuery}
            onChange={e => setModelSearchQuery(e.target.value)}
            className="my-2 text-xs"
          />
          <ScrollArea className="flex-1 pr-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredModels.map(model => {
                const isSelected = selectedModel === model.id
                return (
                  <Card key={model.id} className={cn("bg-secondary/30 border-border/40 overflow-hidden flex flex-col justify-between transition-all", isSelected && "ring-2 ring-primary border-primary")}>
                    {model.coverUrl && (
                      <div className="w-full h-28 overflow-hidden relative">
                        <img src={model.coverUrl} alt={model.name} className="w-full h-full object-cover" />
                        <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] bg-black/60 backdrop-blur-sm text-white">
                          {model.type}
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="font-semibold text-xs text-foreground truncate">{model.name}</h4>
                          {isSelected && <Badge variant="default" className="text-[10px] bg-emerald-500">当前使用</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{model.description}</p>
                        {model.tags && (
                          <div className="flex gap-1 flex-wrap mt-2">
                            {model.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-[9px] py-0 h-4">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="pt-2 flex justify-end">
                        <Button
                          size="sm"
                          variant={isSelected ? "secondary" : "default"}
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            if (!models.some(m => m.id === model.id)) {
                              addModelFromSearch(model)
                            }
                            setSelectedModel(model.id)
                            setIsModelsOpen(false)
                            showToast(`已切换至模型: ${model.name}`)
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isSelected ? "当前使用中" : t("useModel")}
                        </Button>
                      </div>
                    </CardContent>
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

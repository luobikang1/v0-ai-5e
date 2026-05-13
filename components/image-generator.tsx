"use client"

import { useState, useCallback, useEffect } from "react"
import { 
  ImageIcon, Wand2, Upload, Sparkles, Download, Trash2, Settings2, 
  Plus, X, BookOpen, Save, FolderOpen, ExternalLink, Copy, Check,
  ChevronDown, ChevronUp, History, Clock, Calendar, Search, Image,
  FileText, FolderPlus, Palette, Languages, Zap, BookMarked, Globe
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

const IMAGE_SIZES = [
  { id: "512x512", name: "512 x 512", width: 512, height: 512 },
  { id: "768x768", name: "768 x 768", width: 768, height: 768 },
  { id: "1024x1024", name: "1024 x 1024", width: 1024, height: 1024 },
  { id: "512x768", name: "512 x 768", width: 512, height: 768 },
  { id: "768x512", name: "768 x 512", width: 768, height: 512 },
  { id: "768x1024", name: "768 x 1024", width: 768, height: 1024 },
  { id: "1024x768", name: "1024 x 768", width: 1024, height: 768 },
  { id: "custom", name: "自定义尺寸", width: 512, height: 512 },
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
}

const HISTORY_MAX_DAYS = 30

export function ImageGenerator() {
  // Language
  const [language, setLanguage] = useState<Language>("zh")
  const t = useTranslation(language)
  
  // Core state
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0].id)
  const [models, setModels] = useState<CustomModel[]>(DEFAULT_MODELS)
  const [steps, setSteps] = useState([20])
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

  // Helpers
  const getCurrentDimensions = useCallback(() => {
    if (selectedSize === "custom") {
      return { width: customWidth, height: customHeight }
    }
    const size = IMAGE_SIZES.find(s => s.id === selectedSize)
    return { width: size?.width || 1024, height: size?.height || 1024 }
  }, [selectedSize, customWidth, customHeight])

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

  // Generation handler
  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setError(null)

    const finalNegativePrompt = buildNegativePrompt()
    const currentModel = models.find(m => m.id === selectedModel)
    const { width, height } = getCurrentDimensions()
    const bgColor = getCurrentBgColor()

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
      
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
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

      setGeneratedImages((prev) => [newImage, ...prev])
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
    const matchingSize = IMAGE_SIZES.find(s => s.width === record.width && s.height === record.height)
    if (matchingSize) {
      setSelectedSize(matchingSize.id)
    } else {
      setSelectedSize("custom")
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{t("title")}</h1>
              <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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

            {/* Spells */}
            <Dialog open={isSpellsOpen} onOpenChange={setIsSpellsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Zap className="w-4 h-4" />
                  {t("spells")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
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

            {/* Add Spell Dialog */}
            <Dialog open={isSpellDialogOpen} onOpenChange={setIsSpellDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("addSpell")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t("spellName")}</Label>
                    <Input value={newSpellName} onChange={e => setNewSpellName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("spellCategory")}</Label>
                    <Select value={newSpellCategory} onValueChange={setNewSpellCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPELL_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{t(cat)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("spellPrompt")}</Label>
                    <Textarea value={newSpellPrompt} onChange={e => setNewSpellPrompt(e.target.value)} className="min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("spellNegative")}</Label>
                    <Textarea value={newSpellNegative} onChange={e => setNewSpellNegative(e.target.value)} className="min-h-[60px]" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSpellDialogOpen(false)}>{t("cancel")}</Button>
                  <Button onClick={addSpell}>{t("save")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Notes */}
            <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <BookMarked className="w-4 h-4" />
                  {t("notes")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5" />
                    {t("notesTitle")}
                  </DialogTitle>
                  <DialogDescription>{t("notesDesc")}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  <div className="space-y-4 pr-4 py-4">
                    {/* Add/Edit Note Form */}
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

                    {/* Notes List */}
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
                <Button variant="outline" size="sm" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  {t("albums")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
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
                <Button variant="outline" size="sm" className="gap-2">
                  <Search className="w-4 h-4" />
                  {t("models")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
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

            {/* Add Custom Model Dialog */}
            <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("addModel")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t("modelName")}</Label>
                    <Input value={newModelName} onChange={e => setNewModelName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("modelType")}</Label>
                    <Select value={newModelType} onValueChange={(v) => setNewModelType(v as typeof newModelType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cloudflare">Cloudflare AI</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="replicate">Replicate</SelectItem>
                        <SelectItem value="custom">Custom API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("modelEndpoint")}</Label>
                    <Input value={newModelEndpoint} onChange={e => setNewModelEndpoint(e.target.value)} placeholder="https://api.example.com/v1/images" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("apiKeyVar")}</Label>
                    <Input value={newModelApiKey} onChange={e => setNewModelApiKey(e.target.value)} placeholder="CUSTOM_API_KEY" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsModelDialogOpen(false)}>{t("cancel")}</Button>
                  <Button onClick={addCustomModel}>{t("save")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* History */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <History className="w-4 h-4" />
                  {t("history")}
                  {historyRecords.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{historyRecords.length}</Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_420px] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
                <TabsTrigger value="text-to-image" className="gap-2 data-[state=active]:bg-card">
                  <Wand2 className="w-4 h-4" />
                  {t("textToImage")}
                </TabsTrigger>
                <TabsTrigger value="image-to-image" className="gap-2 data-[state=active]:bg-card">
                  <ImageIcon className="w-4 h-4" />
                  {t("imageToImage")}
                </TabsTrigger>
                <TabsTrigger value="reference-image" className="gap-2 data-[state=active]:bg-card">
                  <Image className="w-4 h-4" />
                  {t("referenceImage")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text-to-image" className="mt-6 space-y-4">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-4">
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
                      {t("uploadImage")}
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
                          <img src={uploadedImage} alt="Uploaded" className="max-h-48 mx-auto rounded-lg" />
                          <p className="text-sm text-muted-foreground">{t("clickToChange")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{t("clickToUpload")}</p>
                          <p className="text-xs text-muted-foreground/70">{t("supportedFormats")}</p>
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
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">{t("strength")}: {strength[0].toFixed(2)}</Label>
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

              <TabsContent value="reference-image" className="mt-6 space-y-4">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Image className="w-4 h-4 text-primary" />
                      {t("uploadReference")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-secondary/20",
                        referenceImage && "border-primary/50 bg-secondary/20"
                      )}
                      onClick={() => document.getElementById("reference-upload")?.click()}
                    >
                      {referenceImage ? (
                        <div className="space-y-4">
                          <img src={referenceImage} alt="Reference" className="max-h-48 mx-auto rounded-lg" />
                          <p className="text-sm text-muted-foreground">{t("clickToChange")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Image className="w-10 h-10 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{t("clickToUpload")}</p>
                          <p className="text-xs text-muted-foreground/70">{t("supportedFormats")}</p>
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
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">{t("referenceStrength")}: {referenceStrength[0].toFixed(2)}</Label>
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
              <Card className="bg-card/50 border-border/50">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-4 cursor-pointer hover:bg-secondary/20 transition-colors">
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">{t("presetTemplates")}</Label>
                        <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
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
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">{t("customPrompts")}</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="..."
                          value={newCustomPrompt}
                          onChange={(e) => setNewCustomPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addCustomPromptHandler()}
                          className="bg-secondary/30 border-border/50"
                        />
                        <Button onClick={addCustomPromptHandler} size="sm"><Plus className="w-4 h-4" /></Button>
                      </div>
                      {customNegativePrompts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {customNegativePrompts.map((cp) => (
                            <Badge key={cp} variant="secondary" className="gap-1">
                              {cp}
                              <button onClick={() => setCustomNegativePrompts(prev => prev.filter(p => p !== cp))}><X className="w-3 h-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{t("manualInput")}</Label>
                      <Textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="min-h-[60px] bg-secondary/30 border-border/50 resize-none text-sm"
                      />
                    </div>
                    {currentNegativePromptPreview && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <Label className="text-xs text-muted-foreground mb-2 block">{t("preview")}</Label>
                        <p className="text-xs text-foreground/80 break-words">{currentNegativePromptPreview}</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || (activeTab === "image-to-image" && !uploadedImage) || (activeTab === "reference-image" && !referenceImage)}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {isGenerating ? (
                <><Spinner className="w-4 h-4 mr-2" />{t("generating")}</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />{t("generate")}</>
              )}
            </Button>

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
                {t("results")}
                {generatedImages.length > 0 && <span className="text-sm text-muted-foreground">({generatedImages.length})</span>}
              </h2>

              {generatedImages.length === 0 ? (
                <Card className="bg-card/30 border-border/30">
                  <CardContent className="py-16 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("noImages")}</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">{t("startCreating")}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {generatedImages.map((image) => (
                    <Card key={image.id} className="bg-card/50 border-border/50 overflow-hidden group">
                      <div className="relative aspect-square">
                        <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white" onClick={() => handleCopyUrl(image.url, image.id)}>
                                  {copiedId === image.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <a href={image.url} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </a>
                                {albums.length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white">
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
                              <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white" onClick={() => setGeneratedImages(prev => prev.filter(img => img.id !== image.id))}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm text-foreground line-clamp-2">{image.prompt}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{image.model}</Badge>
                          <Badge variant="outline" className="text-xs">{image.width}x{image.height}</Badge>
                          <Badge variant="outline" className="text-xs">{image.sampler}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Settings */}
          <div className="space-y-4">
            <Card className="bg-card/50 border-border/50 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  {t("settings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Model */}
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

                {/* Image Size */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">{t("imageSize")}</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger className="bg-secondary/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_SIZES.map(size => (
                        <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSize === "custom" && (
                    <div className="grid grid-cols-2 gap-3">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

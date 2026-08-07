import { create } from "zustand"
import { Store } from "@tauri-apps/plugin-store"

interface SettingsState {
  aiApiUrl: string
  aiApiKey: string
  aiModel: string
  serverUrl: string
  language: string
  isLoading: boolean
  setAiApiUrl: (url: string) => Promise<void>
  setAiApiKey: (key: string) => Promise<void>
  setAiModel: (model: string) => Promise<void>
  setServerUrl: (url: string) => Promise<void>
  setLanguage: (language: string) => Promise<void>
  loadSettings: () => Promise<void>
}

let store: Store | null = null

async function getStore() {
  if (!store) {
    store = await Store.load("settings.json")
  }
  return store
}

const DEFAULT_SERVER_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"

export const useSettingsStore = create<SettingsState>((set) => ({
  aiApiUrl: import.meta.env.VITE_AI_API_URL ?? "",
  aiApiKey: import.meta.env.VITE_AI_API_KEY ?? "",
  aiModel: "kimi-k2.6",
  serverUrl: DEFAULT_SERVER_URL,
  language: "en",
  isLoading: true,

  setAiApiUrl: async (url) => {
    const s = await getStore()
    await s.set("aiApiUrl", url)
    await s.save()
    set({ aiApiUrl: url })
  },

  setAiApiKey: async (key) => {
    const s = await getStore()
    await s.set("aiApiKey", key)
    await s.save()
    set({ aiApiKey: key })
  },

  setAiModel: async (model) => {
    const s = await getStore()
    await s.set("aiModel", model)
    await s.save()
    set({ aiModel: model })
  },

  setServerUrl: async (url) => {
    const s = await getStore()
    await s.set("serverUrl", url)
    await s.save()
    set({ serverUrl: url })
  },

  setLanguage: async (language) => {
    const s = await getStore()
    await s.set("language", language)
    await s.save()
    set({ language })
  },

  loadSettings: async () => {
    const s = await getStore()
    const [savedUrl, savedKey, savedModel, savedServerUrl, savedLanguage] = await Promise.all([
      s.get<string>("aiApiUrl"),
      s.get<string>("aiApiKey"),
      s.get<string>("aiModel"),
      s.get<string>("serverUrl"),
      s.get<string>("language"),
    ])

    set({
      aiApiUrl: savedUrl ?? import.meta.env.VITE_AI_API_URL ?? "",
      aiApiKey: savedKey ?? import.meta.env.VITE_AI_API_KEY ?? "",
      aiModel: savedModel ?? "kimi-k2.6",
      serverUrl: savedServerUrl ?? DEFAULT_SERVER_URL,
      language: savedLanguage ?? "en",
      isLoading: false,
    })
  },
}))

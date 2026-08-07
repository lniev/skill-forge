import * as React from "react"
import { useTranslation } from "react-i18next"
import { useSettingsStore } from "../store/settingsStore"

export function SettingsInitializer({ children }: { children: React.ReactNode }) {
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const language = useSettingsStore((state) => state.language)
  const { i18n } = useTranslation()

  React.useEffect(() => {
    loadSettings()
  }, [loadSettings])

  React.useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language, i18n])

  return <>{children}</>
}

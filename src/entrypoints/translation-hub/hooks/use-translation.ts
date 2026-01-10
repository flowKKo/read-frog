import type { LangCodeISO6393 } from '@read-frog/definitions'
import type { ServiceInfo, TranslationResult } from '../types'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { getProviderConfigById } from '@/utils/config/helpers'
import { executeTranslate } from '@/utils/host/translate/execute-translate'
import { useAvailableServices } from './use-available-services'

export function useTranslation() {
  const language = useAtomValue(configFieldsAtomMap.language)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const { services: availableServices } = useAvailableServices()

  const [sourceLanguage, setSourceLanguage] = useState<LangCodeISO6393>(
    language.sourceCode === 'auto' ? 'eng' : language.sourceCode,
  )
  const [targetLanguage, setTargetLanguage] = useState<LangCodeISO6393>(language.targetCode)
  const [inputText, setInputText] = useState('')
  const [selectedServices, setSelectedServices] = useState<ServiceInfo[]>(availableServices)
  const [translationResults, setTranslationResults] = useState<TranslationResult[]>([])
  const isTranslating = translationResults.some(r => r.isLoading)

  // Initialize services if they load asynchronously
  const isInitializedRef = useRef(availableServices.length > 0)
  useEffect(() => {
    if (!isInitializedRef.current && availableServices.length > 0) {
      setSelectedServices(availableServices)
      isInitializedRef.current = true
    }
  }, [availableServices])

  // Helper to update a single translation result
  const updateResult = useCallback((id: string, updates: Partial<TranslationResult>) => {
    setTranslationResults(prev =>
      prev.map(result => (result.id === id ? { ...result, ...updates } : result)),
    )
  }, [])

  const handleLanguageExchange = useCallback(() => {
    setSourceLanguage((prevSource) => {
      const currentTarget = targetLanguage
      setTargetLanguage(prevSource)
      return currentTarget
    })
  }, [targetLanguage])

  // Helper to translate specific services
  const translateServices = useCallback(async (services: ServiceInfo[]) => {
    if (!inputText.trim() || services.length === 0) {
      return
    }

    // Add loading state while preserving existing text
    setTranslationResults((prev) => {
      const existingIds = new Set(services.map(s => s.id))
      const existingResults = prev.filter(r => !existingIds.has(r.id))

      const updatedResults: TranslationResult[] = services.map((service) => {
        const existing = prev.find(r => r.id === service.id)
        return {
          id: service.id,
          name: service.name,
          provider: service.provider,
          isLoading: true,
          text: existing ? existing.text : undefined,
        }
      })

      return [...existingResults, ...updatedResults]
    })

    // Translation API calls
    const translationPromises = services.map(async (service) => {
      try {
        const providerConfig = getProviderConfigById(providersConfig, service.id)
        if (!providerConfig) {
          throw new Error(`Provider config not found for ${service.id}`)
        }

        const langConfig = {
          sourceCode: sourceLanguage,
          targetCode: targetLanguage,
          level: language.level,
        }

        const translatedText = await executeTranslate(inputText, langConfig, providerConfig)
        updateResult(service.id, { text: translatedText, isLoading: false, error: undefined })
      }
      catch (error) {
        updateResult(service.id, {
          error: error instanceof Error ? error.message : 'Translation failed',
          isLoading: false,
          text: undefined,
        })
      }
    })

    await Promise.allSettled(translationPromises)
  }, [inputText, sourceLanguage, targetLanguage, language.level, providersConfig, updateResult])

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim() || selectedServices.length === 0) {
      return
    }
    await translateServices(selectedServices)
  }, [inputText, selectedServices, translateServices])

  // Explicitly handle service toggle (add/remove)
  const handleToggleService = useCallback((serviceId: string, enabled: boolean) => {
    if (enabled) {
      const service = availableServices.find(s => s.id === serviceId)
      if (service) {
        setSelectedServices(prev => [...prev, service])
        // Trigger translation immediately for the new service
        if (inputText.trim()) {
          void translateServices([service])
        }
      }
    }
    else {
      setSelectedServices(prev => prev.filter(s => s.id !== serviceId))
      // Remove result immediately
      setTranslationResults(prev => prev.filter(r => r.id !== serviceId))
    }
  }, [availableServices, inputText, translateServices])

  // Auto-retranslate when language changes
  const languageKey = `${sourceLanguage}-${targetLanguage}`
  const prevLanguageKeyRef = useRef(languageKey)

  useEffect(() => {
    // Only trigger logic if language key has changed
    if (prevLanguageKeyRef.current === languageKey) {
      return
    }
    prevLanguageKeyRef.current = languageKey

    if (inputText.trim() && selectedServices.length > 0 && !isTranslating && translationResults.length > 0) {
      void handleTranslate()
    }
  }, [languageKey, inputText, selectedServices, isTranslating, translationResults, handleTranslate])

  const handleInputChange = useCallback((value: string) => {
    setInputText(value)
    if (!value.trim()) {
      setTranslationResults([])
    }
  }, [])

  const handleCopyText = useCallback((text: string) => {
    void navigator.clipboard.writeText(text)
    toast.success('Translation copied to clipboard!')
  }, [])

  const handleRemoveService = useCallback((id: string) => {
    handleToggleService(id, false)
  }, [handleToggleService])

  return {
    sourceLanguage,
    setSourceLanguage,
    targetLanguage,
    setTargetLanguage,
    inputText,
    handleInputChange,
    selectedServices,
    setSelectedServices,
    translationResults,
    handleTranslate,
    handleLanguageExchange,
    handleCopyText,
    handleRemoveService,
    handleToggleService, // Export new handler
  }
}

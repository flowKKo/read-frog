import type { ServiceInfo, TranslationResult } from '../types'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback, useEffect, useEffectEvent, useRef } from 'react'
import { toast } from 'sonner'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { getProviderConfigById } from '@/utils/config/helpers'
import { executeTranslate } from '@/utils/host/translate/execute-translate'
import {
  inputTextAtom,
  selectedServicesAtom,
  sourceLanguageAtom,
  targetLanguageAtom,
  translationResultsAtom,
} from '../atoms'
import { useAvailableServices } from './use-available-services'

export function useTranslation() {
  const language = useAtomValue(configFieldsAtomMap.language)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const { services: availableServices } = useAvailableServices()

  const [sourceLanguage, setSourceLanguage] = useAtom(sourceLanguageAtom)
  const [targetLanguage, setTargetLanguage] = useAtom(targetLanguageAtom)
  const [inputText, setInputText] = useAtom(inputTextAtom)
  const [selectedServices, setSelectedServices] = useAtom(selectedServicesAtom)
  const [translationResults, setTranslationResults] = useAtom(translationResultsAtom)

  const isTranslating = translationResults.some(r => r.isLoading)

  // Initialize languages from config
  const isLangInitializedRef = useRef(false)
  useEffect(() => {
    if (!isLangInitializedRef.current && language) {
      setSourceLanguage(language.sourceCode === 'auto' ? 'eng' : language.sourceCode)
      setTargetLanguage(language.targetCode)
      isLangInitializedRef.current = true
    }
  }, [language, setSourceLanguage, setTargetLanguage])

  // Initialize services if they load asynchronously
  const isServicesInitializedRef = useRef(false)
  useEffect(() => {
    // Only initialize if selectedServices is empty and availableServices has items
    // This prevents overwriting user selection if they navigate away and back (if atoms persist)
    // But since atoms are memory-only for now, it mostly acts as initial load.
    if (!isServicesInitializedRef.current && availableServices.length > 0) {
      if (selectedServices.length === 0) {
        setSelectedServices(availableServices)
      }
      isServicesInitializedRef.current = true
    }
  }, [availableServices, selectedServices.length, setSelectedServices])

  // Helper to update a single translation result
  const updateResult = useCallback((id: string, updates: Partial<TranslationResult>) => {
    setTranslationResults(prev =>
      prev.map(result => (result.id === id ? { ...result, ...updates } : result)),
    )
  }, [setTranslationResults])

  const handleLanguageExchange = useCallback(() => {
    setSourceLanguage((prevSource) => {
      const currentTarget = targetLanguage
      setTargetLanguage(prevSource)
      return currentTarget
    })
  }, [targetLanguage, setSourceLanguage, setTargetLanguage])

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
  }, [inputText, sourceLanguage, targetLanguage, language.level, providersConfig, updateResult, setTranslationResults])

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
  }, [availableServices, inputText, translateServices, setSelectedServices, setTranslationResults])

  // Auto-retranslate when language changes
  const languageKey = `${sourceLanguage}-${targetLanguage}`
  const prevLanguageKeyRef = useRef(languageKey)

  const onAutoTranslate = useEffectEvent(() => {
    if (inputText.trim() && selectedServices.length > 0 && !isTranslating && translationResults.length > 0) {
      void handleTranslate()
    }
  })

  useEffect(() => {
    // Only trigger logic if language key has changed
    if (prevLanguageKeyRef.current === languageKey) {
      return
    }
    prevLanguageKeyRef.current = languageKey

    onAutoTranslate()
  }, [languageKey])

  const handleInputChange = useCallback((value: string) => {
    setInputText(value)
    if (!value.trim()) {
      setTranslationResults([])
    }
  }, [setInputText, setTranslationResults])

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

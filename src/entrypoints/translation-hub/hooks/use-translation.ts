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
  const { services: defaultServices } = useAvailableServices()

  const [sourceLanguage, setSourceLanguage] = useState<LangCodeISO6393>(
    language.sourceCode === 'auto' ? 'eng' : language.sourceCode,
  )
  const [targetLanguage, setTargetLanguage] = useState<LangCodeISO6393>(language.targetCode)
  const [inputText, setInputText] = useState('')
  const [selectedServices, setSelectedServices] = useState<ServiceInfo[]>([])
  const [translationResults, setTranslationResults] = useState<TranslationResult[]>([])

  // Initialize services on first load
  const isInitializedRef = useRef(false)
  useEffect(() => {
    if (!isInitializedRef.current && selectedServices.length === 0 && defaultServices.length > 0) {
      setSelectedServices(defaultServices)
      isInitializedRef.current = true
    }
  }, [defaultServices, selectedServices.length])

  // Derive isTranslating from translationResults
  const isTranslating = translationResults.length > 0 && translationResults.some(r => r.isLoading)

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
          text: existing?.text,
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

    // Set a maximum timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setTranslationResults(prev =>
        prev.map(result =>
          result.isLoading && services.some(s => s.id === result.id)
            ? { ...result, isLoading: false, error: 'Translation timed out' }
            : result,
        ),
      )
    }, 30000)

    void Promise.allSettled(translationPromises).finally(() => {
      clearTimeout(timeoutId)
    })
  }, [inputText, sourceLanguage, targetLanguage, language.level, providersConfig, updateResult])

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim() || selectedServices.length === 0) {
      return
    }

    // Translate all selected services
    await translateServices(selectedServices)
  }, [inputText, selectedServices, translateServices])

  // Auto-retranslate when language changes if there's text and previous results exist
  const languageKey = `${sourceLanguage}-${targetLanguage}`
  useEffect(() => {
    if (inputText.trim() && selectedServices.length > 0 && !isTranslating && translationResults.length > 0) {
      void handleTranslate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only trigger on language change
  }, [languageKey])

  // Auto-translate when new services are added and there's text
  const prevServicesRef = useRef<ServiceInfo[]>([])
  useEffect(() => {
    const prevIds = new Set(prevServicesRef.current.map(s => s.id))
    const newServices = selectedServices.filter(s => !prevIds.has(s.id))

    // If there are new services and we have text, translate only those
    if (newServices.length > 0 && inputText.trim()) {
      void translateServices(newServices)
    }

    prevServicesRef.current = selectedServices
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only trigger on selectedServices change
  }, [selectedServices])

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
    setTranslationResults(prev => prev.filter(r => r.id !== id))
    setSelectedServices(prev => prev.filter(s => s.id !== id))
  }, [])

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
  }
}

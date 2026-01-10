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

  // Initialization Effects
  const isInitRef = useRef({ lang: false, services: false })

  useEffect(() => {
    if (!isInitRef.current.lang && language) {
      setSourceLanguage(language.sourceCode === 'auto' ? 'eng' : language.sourceCode)
      setTargetLanguage(language.targetCode)
      isInitRef.current.lang = true
    }
  }, [language, setSourceLanguage, setTargetLanguage])

  useEffect(() => {
    if (!isInitRef.current.services && availableServices.length > 0) {
      if (selectedServices.length === 0)
        setSelectedServices(availableServices)
      isInitRef.current.services = true
    }
  }, [availableServices, selectedServices.length, setSelectedServices])

  // Race condition handling
  const activeRequestIdsRef = useRef<Record<string, number>>({})
  const requestCounterRef = useRef(0)

  // Core Translation Logic
  const translateServices = useCallback(async (services: ServiceInfo[]) => {
    if (!inputText.trim() || services.length === 0)
      return

    // Optimistic UI update
    setTranslationResults((prev) => {
      const targetIds = new Set(services.map(s => s.id))
      const existing = prev.filter(r => !targetIds.has(r.id))
      const newEntries = services.map(s => ({
        id: s.id,
        name: s.name,
        provider: s.provider,
        isLoading: true,
        text: prev.find(r => r.id === s.id)?.text,
      }))
      return [...existing, ...newEntries]
    })

    const updateResult = (id: string, updates: Partial<TranslationResult>) => {
      setTranslationResults(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)))
    }

    const runTranslation = async (service: ServiceInfo) => {
      const requestId = ++requestCounterRef.current
      activeRequestIdsRef.current[service.id] = requestId

      try {
        const providerConfig = getProviderConfigById(providersConfig, service.id)
        if (!providerConfig)
          throw new Error(`Provider config not found for ${service.id}`)

        const text = await executeTranslate(inputText, {
          sourceCode: sourceLanguage,
          targetCode: targetLanguage,
          level: language.level,
        }, providerConfig)

        // if a newer request started for this service, ignore this result
        if (activeRequestIdsRef.current[service.id] !== requestId)
          return

        updateResult(service.id, { text, isLoading: false, error: undefined })
      }
      catch (error) {
        if (activeRequestIdsRef.current[service.id] !== requestId)
          return

        updateResult(service.id, {
          error: error instanceof Error ? error.message : 'Translation failed',
          isLoading: false,
          text: undefined,
        })
      }
    }

    await Promise.allSettled(services.map(runTranslation))
  }, [inputText, sourceLanguage, targetLanguage, language.level, providersConfig, setTranslationResults])

  // Handlers
  const handleTranslate = useCallback(async () => {
    await translateServices(selectedServices)
  }, [selectedServices, translateServices])

  const handleLanguageExchange = useCallback(() => {
    setSourceLanguage(targetLanguage)
    setTargetLanguage(sourceLanguage)
  }, [sourceLanguage, targetLanguage, setSourceLanguage, setTargetLanguage])

  const handleToggleService = useCallback((serviceId: string, enabled: boolean) => {
    if (enabled) {
      const service = availableServices.find(s => s.id === serviceId)
      if (service) {
        setSelectedServices(prev => [...prev, service])
        if (inputText.trim())
          void translateServices([service])
      }
    }
    else {
      setSelectedServices(prev => prev.filter(s => s.id !== serviceId))
      setTranslationResults(prev => prev.filter(r => r.id !== serviceId))
    }
  }, [availableServices, inputText, translateServices, setSelectedServices, setTranslationResults])

  const handleInputChange = useCallback((value: string) => {
    setInputText(value)
    if (!value.trim())
      setTranslationResults([])
  }, [setInputText, setTranslationResults])

  // Auto-translate Logic
  const languageKey = `${sourceLanguage}-${targetLanguage}`
  const prevLangKeyRef = useRef(languageKey)

  const onAutoTranslate = useEffectEvent(() => {
    if (inputText.trim() && selectedServices.length > 0 && translationResults.length > 0) {
      void handleTranslate()
    }
  })

  useEffect(() => {
    if (prevLangKeyRef.current !== languageKey) {
      prevLangKeyRef.current = languageKey
      onAutoTranslate()
    }
  }, [languageKey])

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
    handleCopyText: useCallback((text: string) => {
      void navigator.clipboard.writeText(text)
      toast.success('Translation copied to clipboard!')
    }, []),
    handleRemoveService: useCallback((id: string) => handleToggleService(id, false), [handleToggleService]),
    handleToggleService,
  }
}

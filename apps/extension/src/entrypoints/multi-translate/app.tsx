import type { TranslationService } from './components/translation-service-manager'
import type { LangCodeISO6393 } from '@/types/config/languages'
import type { TranslateProviderNames } from '@/types/config/provider'
import { browser } from '#imports'
import { Icon } from '@iconify/react'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedLanguageDetection } from '@/hooks/use-language-detection'
import { useMultiTranslate } from '@/hooks/use-multi-translate'
import { configFields } from '@/utils/atoms/config'
import LanguageConfig from './components/language-config'
import LanguageInput from './components/language-input'
import TranslationGrid from './components/translation-grid'
import { ALL_AVAILABLE_SERVICES, DEFAULT_SERVICES } from './components/translation-service-manager'

export default function App() {
  const [inputText, setInputText] = useState('')
  const languageConfig = useAtomValue(configFields.language)
  const { results, translateMultiple, reset, clearProvider } = useMultiTranslate()
  const { detectedLanguage, isDetecting, detectLanguage, reset: resetDetection } = useDebouncedLanguageDetection(150)

  // Local language state (independent from global config)
  const [sourceLanguage, setSourceLanguage] = useState<LangCodeISO6393 | 'auto'>(
    languageConfig.sourceCode === 'auto' ? 'auto' : languageConfig.sourceCode,
  )
  const [targetLanguage, setTargetLanguage] = useState<LangCodeISO6393>(
    languageConfig.targetCode,
  )

  // Translation services state
  const [translationServices, setTranslationServices] = useState<TranslationService[]>(DEFAULT_SERVICES)

  const handleServiceToggle = useCallback((serviceId: TranslateProviderNames) => {
    setTranslationServices((prev) => {
      const serviceExists = prev.find(s => s.id === serviceId)

      if (serviceExists) {
        if (serviceExists.enabled) {
          // Service is currently enabled, remove it from the array
          clearProvider(serviceId)
          return prev.filter(service => service.id !== serviceId)
        }
        else {
          // Service exists but is disabled, remove it and add to the end as enabled
          const newService = ALL_AVAILABLE_SERVICES.find(s => s.id === serviceId)
          if (newService) {
            const updated = [
              ...prev.filter(service => service.id !== serviceId),
              { ...newService, enabled: true },
            ]

            // Trigger translation for the newly enabled service
            if (inputText.trim()) {
              setTimeout(() => {
                translateMultiple(inputText.trim(), {
                  sourceLanguage,
                  targetLanguage,
                  providers: [serviceId] as any,
                }).catch(() => {
                  // Ignore errors for individual service translation
                })
              }, 100)
            }

            return updated
          }
        }
      }
      else {
        // Add new service to the end of the list
        const newService = ALL_AVAILABLE_SERVICES.find(s => s.id === serviceId)
        if (newService) {
          const updated = [...prev, { ...newService, enabled: true }]

          // Trigger translation for the newly added service
          if (inputText.trim()) {
            setTimeout(() => {
              translateMultiple(inputText.trim(), {
                sourceLanguage,
                targetLanguage,
                providers: [serviceId] as any,
              }).catch(() => {
                // Ignore errors for individual service translation
              })
            }, 100)
          }

          return updated
        }
      }

      return prev
    })
  }, [inputText, sourceLanguage, targetLanguage, translateMultiple, clearProvider])

  const handleServicesReorder = useCallback((reorderedServices: TranslationService[]) => {
    setTranslationServices(reorderedServices)
  }, [])

  const handleInputChange = useCallback((newText: string) => {
    setInputText(newText)
    // Always trigger language detection when source is set to auto and text changes
    if (sourceLanguage === 'auto') {
      // Immediately trigger detection for any text change (including single characters)
      detectLanguage(newText)
    }
  }, [sourceLanguage, detectLanguage])

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to translate')
      return
    }

    const enabledProviders = translationServices
      .filter(service => service.enabled)
      .map(service => service.id)

    if (enabledProviders.length === 0) {
      toast.error('Please enable at least one translation service')
      return
    }

    try {
      await translateMultiple(inputText.trim(), {
        sourceLanguage,
        targetLanguage,
        providers: enabledProviders as any, // Cast to avoid type issues for now
      })
    }
    catch {
      toast.error('Translation failed')
    }
  }, [inputText, translateMultiple, sourceLanguage, targetLanguage, translationServices])

  const handleClear = useCallback(() => {
    setInputText('')
    reset()
    // When clearing, trigger detection with empty text to reset state
    if (sourceLanguage === 'auto') {
      detectLanguage('')
    }
  }, [reset, sourceLanguage, detectLanguage])

  // Reset language detection when source language changes from/to auto
  useEffect(() => {
    if (sourceLanguage !== 'auto') {
      // Reset detection state when switching away from auto
      resetDetection()
    }
  }, [sourceLanguage, resetDetection])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleTranslate()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleTranslate])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Icon icon="ri:translate" className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Multi-Translate</h1>
              <p className="text-sm text-muted-foreground">
                Translate text using multiple providers simultaneously
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => browser.runtime.openOptionsPage()}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <Icon icon="tabler:settings" className="size-4" />
            Settings
          </button>
        </div>

        {/* Language Configuration */}
        <LanguageConfig
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onSourceLanguageChange={setSourceLanguage}
          onTargetLanguageChange={setTargetLanguage}
          detectedLanguage={detectedLanguage}
          isDetecting={isDetecting}
          services={translationServices}
          onServicesChange={setTranslationServices}
        />

        {/* Main Content - Left/Right Split Layout */}
        <div className="flex gap-6 mb-8 min-h-[600px]">
          {/* Left Panel - Input Section */}
          <div className="w-1/2">
            <LanguageInput
              value={inputText}
              onChange={handleInputChange}
              onTranslate={handleTranslate}
              onClear={handleClear}
            />
          </div>

          {/* Right Panel - Results Section */}
          <div className="w-1/2">
            {translationServices.some(s => s.enabled)
              ? (
                  <TranslationGrid
                    results={results}
                    services={translationServices}
                    onServiceToggle={handleServiceToggle}
                    onServicesReorder={handleServicesReorder}
                  />
                )
              : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Icon icon="tabler:settings" className="size-12 mx-auto mb-2 opacity-50" />
                      <p>Select translation services to get started</p>
                      <p className="text-xs mt-1">Use the Services button above to choose providers</p>
                    </div>
                  </div>
                )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            Use
            {' '}
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl/Cmd + Enter</kbd>
            {' '}
            to translate quickly
          </p>
        </div>
      </div>
    </div>
  )
}

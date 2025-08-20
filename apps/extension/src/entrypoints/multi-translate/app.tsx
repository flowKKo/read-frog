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
import { DEFAULT_SERVICES } from './components/translation-service-manager'

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

  // Auto-translate state (default enabled)
  const [autoTranslate, setAutoTranslate] = useState(true)

  const handleServicesReorder = useCallback((reorderedServices: TranslationService[]) => {
    setTranslationServices(reorderedServices)
  }, [])

  const handleServiceRemove = useCallback((serviceId: TranslateProviderNames) => {
    setTranslationServices(prev => prev.filter(service => service.id !== serviceId))
    clearProvider(serviceId)
  }, [clearProvider])

  const handleInputChange = useCallback((newText: string) => {
    setInputText(newText)
    // Always trigger language detection when source is set to auto and text changes
    if (sourceLanguage === 'auto') {
      // Immediately trigger detection for any text change (including single characters)
      detectLanguage(newText)
    }

    // Auto-translate if enabled and text is not empty
    if (autoTranslate && newText.trim()) {
      const enabledProviders = translationServices
        .filter(service => service.enabled)
        .map(service => service.id)

      if (enabledProviders.length > 0) {
        // Use setTimeout to debounce rapid typing
        setTimeout(() => {
          translateMultiple(newText.trim(), {
            sourceLanguage,
            targetLanguage,
            providers: enabledProviders as any,
          }).catch(() => {
            // Ignore errors for auto-translation
          })
        }, 500) // 500ms debounce
      }
    }
  }, [sourceLanguage, detectLanguage, autoTranslate, translationServices, targetLanguage, translateMultiple])

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
          onServicesChange={(newServices) => {
            // When services change via the manager, we need to detect which service was toggled
            const currentServiceIds = new Set(translationServices.map(s => s.id))
            const newServiceIds = new Set(newServices.map(s => s.id))

            // Find added services
            const addedServices = newServices.filter(s => !currentServiceIds.has(s.id) && s.enabled)

            // Find removed services
            const removedServiceIds = translationServices.filter(s => !newServiceIds.has(s.id)).map(s => s.id)

            // Find toggled services (existing services that changed enabled state)
            const toggledServices = newServices.filter((newService) => {
              const oldService = translationServices.find(s => s.id === newService.id)
              return oldService && oldService.enabled !== newService.enabled
            })

            // Update the services state
            setTranslationServices(newServices)

            // Trigger auto-translation for newly enabled services if auto-translate is on
            if (autoTranslate && inputText.trim()) {
              const servicesToTranslate = [
                ...addedServices.map(s => s.id),
                ...toggledServices.filter(s => s.enabled).map(s => s.id),
              ]

              if (servicesToTranslate.length > 0) {
                setTimeout(() => {
                  // Get all currently enabled services to preserve existing results
                  const allEnabledServices = newServices.filter(s => s.enabled).map(s => s.id)
                  translateMultiple(inputText.trim(), {
                    sourceLanguage,
                    targetLanguage,
                    providers: allEnabledServices as any,
                  }).catch((error) => {
                    console.error('❌ Translation failed for services:', servicesToTranslate, error)
                  })
                }, 200)
              }
            }

            // Clear results for removed services
            removedServiceIds.forEach((serviceId) => {
              clearProvider(serviceId)
            })
          }}
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
              autoTranslate={autoTranslate}
              onAutoTranslateChange={setAutoTranslate}
            />
          </div>

          {/* Right Panel - Results Section */}
          <div className="w-1/2">
            {translationServices.some(s => s.enabled)
              ? (
                  <TranslationGrid
                    results={results}
                    services={translationServices}
                    onServiceToggle={handleServiceRemove}
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

import type { LangCodeISO6393 } from '@read-frog/definitions'
import type { TranslationResult } from './components/translation-panel'
import type { SelectedService } from './components/translation-service-dropdown'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { filterEnabledProvidersConfig, getLLMTranslateProvidersConfig, getNonAPIProvidersConfig, getProviderConfigById, getPureAPIProvidersConfig } from '@/utils/config/helpers'
import { executeTranslate } from '@/utils/host/translate/execute-translate'
import { LanguageControlPanel } from './components/language-control-panel'
import { TextInput } from './components/text-input'
import { TranslationPanel } from './components/translation-panel'
import { TranslationServiceDropdown } from './components/translation-service-dropdown'

export default function App() {
  const language = useAtomValue(configFieldsAtomMap.language)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)

  const [sourceLanguage, setSourceLanguage] = useState<LangCodeISO6393>(language.sourceCode === 'auto' ? 'eng' : language.sourceCode)
  const [targetLanguage, setTargetLanguage] = useState<LangCodeISO6393>(language.targetCode)
  const [inputText, setInputText] = useState('')
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [translationResults, setTranslationResults] = useState<TranslationResult[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize default selected services
  const defaultServices = useMemo(() => {
    if (!providersConfig)
      return []

    const filteredProvidersConfig = filterEnabledProvidersConfig(providersConfig)
    return [
      ...getNonAPIProvidersConfig(filteredProvidersConfig),
      ...getPureAPIProvidersConfig(filteredProvidersConfig),
      ...getLLMTranslateProvidersConfig(filteredProvidersConfig),
    ].filter(p => p && p.id && p.name && p.provider).map(({ id, name, provider }) => ({
      id,
      name,
      provider,
      enabled: true,
    }))
  }, [providersConfig])

  // Initialize services on first load
  if (!isInitialized && selectedServices.length === 0 && defaultServices.length > 0) {
    setSelectedServices(defaultServices)
    setIsInitialized(true)
  }

  const handleLanguageExchange = () => {
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)
  }

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim() || selectedServices.length === 0)
      return

    setIsTranslating(true)

    // Create initial results with loading state
    const initialResults: TranslationResult[] = selectedServices.map(service => ({
      id: service.id,
      name: service.name,
      provider: service.provider,
      isLoading: true,
    }))

    setTranslationResults(initialResults)

    // Real translation API calls with async streaming results
    const translationPromises = selectedServices.map(async (service) => {
      try {
        const providerConfig = getProviderConfigById(providersConfig, service.id)
        if (!providerConfig) {
          throw new Error(`Provider config not found for ${service.id}`)
        }

        // Create language config object
        const langConfig = {
          sourceCode: sourceLanguage,
          targetCode: targetLanguage,
          level: language.level,
        }

        // Call the real translation function
        const translatedText = await executeTranslate(inputText, langConfig, providerConfig)

        // Update this specific result immediately when translation completes
        setTranslationResults(prev =>
          prev.map(result =>
            result.id === service.id
              ? {
                  ...result,
                  text: translatedText,
                  isLoading: false,
                  error: undefined,
                }
              : result,
          ),
        )
      }
      catch (error) {
        // Update this specific result with error immediately
        setTranslationResults(prev =>
          prev.map(result =>
            result.id === service.id
              ? {
                  ...result,
                  error: error instanceof Error ? error.message : 'Translation failed',
                  isLoading: false,
                  text: undefined,
                }
              : result,
          ),
        )
      }
      return undefined
    })

    // Wait for at least one translation to complete and handle cleanup
    void Promise.allSettled(translationPromises).finally(() => {
      // Final check to ensure isTranslating is set to false
      setTranslationResults((prev) => {
        const allCompleted = prev.every(result => !result.isLoading)
        if (allCompleted) {
          setIsTranslating(false)
        }
        return prev
      })
    })

    // Set a maximum timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsTranslating(false)
    }, 30000)

    // Cleanup timeout if all translations complete early
    void Promise.allSettled(translationPromises).finally(() => {
      clearTimeout(timeoutId)
    })
  }, [inputText, selectedServices, sourceLanguage, targetLanguage, language.level, providersConfig])

  // Auto-retranslate when language changes if there's text
  const prevLanguagesRef = useRef({ sourceLanguage, targetLanguage })

  useEffect(() => {
    const prevLanguages = prevLanguagesRef.current
    const languageChanged = prevLanguages.sourceLanguage !== sourceLanguage || prevLanguages.targetLanguage !== targetLanguage

    if (languageChanged && inputText.trim() && selectedServices.length > 0 && !isTranslating) {
      void handleTranslate()
    }

    prevLanguagesRef.current = { sourceLanguage, targetLanguage }
  }, [sourceLanguage, targetLanguage, inputText, selectedServices, isTranslating, handleTranslate])

  const handleInputChange = useCallback((value: string) => {
    setInputText(value)
    if (!value.trim()) {
      setTranslationResults([])
    }
  }, [])

  const handleCopyText = useCallback((text: string) => {
    void navigator.clipboard.writeText(text)
    // TODO: Add toast notification
  }, [])

  const handleDeleteCard = useCallback((id: string) => {
    setTranslationResults(prev => prev.filter(result => result.id !== id))
  }, [])

  const handleServiceRemove = useCallback((id: string) => {
    setSelectedServices(prev => prev.filter(service => service.id !== id))
  }, [])

  return (
    <div className="bg-background min-h-screen">
      <main className="flex-1 flex">
        <div className="flex flex-col lg:flex-row w-full">
          {/* Left Side - Language Settings & Text Input */}
          <div className="w-full lg:w-1/2 min-w-0 p-6 space-y-6">
            {/* Language Settings */}
            <div>
              <LanguageControlPanel
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceLanguageChange={setSourceLanguage}
                onTargetLanguageChange={setTargetLanguage}
                onLanguageExchange={handleLanguageExchange}
              />
            </div>

            {/* Text Input */}
            <div>
              <TextInput
                value={inputText}
                onChange={handleInputChange}
                onTranslate={handleTranslate}
                disabled={selectedServices.length === 0}
                isTranslating={isTranslating}
                placeholder="Enter the text you want to translate..."
              />
            </div>
          </div>

          {/* Right Side - Service Control & Results */}
          <div className="w-full lg:w-1/2 min-w-0 p-6 space-y-6">
            {/* Translation Service Control */}
            <div>
              <TranslationServiceDropdown
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
              />
            </div>

            {/* Translation Results */}
            <div>
              <TranslationPanel
                results={translationResults}
                selectedServices={selectedServices}
                onCopy={handleCopyText}
                onDeleteCard={handleDeleteCard}
                onServiceRemove={handleServiceRemove}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

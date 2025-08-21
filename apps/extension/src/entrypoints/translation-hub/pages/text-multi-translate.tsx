import type { TranslationService } from '../components/translation-service-manager'
import type { LangCodeISO6393 } from '@/types/config/languages'
import type { TranslateProviderNames } from '@/types/config/provider'
import { browser, i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Separator } from '@repo/ui/components/separator'
import { SidebarTrigger } from '@repo/ui/components/sidebar'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Container from '@/components/container'
import { useDebouncedLanguageDetection } from '@/hooks/use-language-detection'
import { useMultiTranslate } from '@/hooks/use-multi-translate'
import { configFields } from '@/utils/atoms/config'
import LanguageConfig from '../components/language-config'
import LanguageInput from '../components/language-input'
import TranslationGrid from '../components/translation-grid'
import TranslationServiceManager, { getDefaultServices } from '../components/translation-service-manager'

export function TextMultiTranslatePage() {
  const [inputText, setInputText] = useState('')
  const [translationServices, setTranslationServices] = useState<TranslationService[]>([])

  const languageConfig = useAtomValue(configFields.language)
  const providersConfig = useAtomValue(configFields.providersConfig)
  const { results, translateMultiple, reset, clearProvider } = useMultiTranslate()
  const { detectedLanguage, isDetecting, detectLanguage, reset: resetDetection } = useDebouncedLanguageDetection(150)

  // Local language state (independent from global config)
  const [sourceLanguage, setSourceLanguage] = useState<LangCodeISO6393 | 'auto'>(
    languageConfig.sourceCode === 'auto' ? 'auto' : languageConfig.sourceCode,
  )
  const [targetLanguage, setTargetLanguage] = useState<LangCodeISO6393>(
    languageConfig.targetCode,
  )

  // Initialize services based on API configuration
  useEffect(() => {
    setTranslationServices(getDefaultServices(providersConfig))
  }, [providersConfig])

  const handleServiceRemove = (serviceId: TranslateProviderNames) => {
    setTranslationServices(prev => prev.filter(service => service.id !== serviceId))
    clearProvider(serviceId)
  }

  const handleInputChange = (newText: string) => {
    setInputText(newText)
    if (sourceLanguage === 'auto')
      detectLanguage(newText)
  }

  const handleTranslate = async () => {
    const text = inputText.trim()
    if (!text)
      return toast.error(i18n.t('translationHub.errors.enterText'))
    const enabledProviders = translationServices.filter(s => s.enabled).map(s => s.id)

    try {
      await translateMultiple(text, { sourceLanguage, targetLanguage, providers: enabledProviders as any })
    }
    catch {
      toast.error(i18n.t('translationHub.errors.translationFailed'))
    }
  }

  const handleClear = () => {
    setInputText('')
    reset()
    if (sourceLanguage === 'auto')
      detectLanguage('')
  }

  const handleConfigAPIKeys = () => {
    browser.tabs.create({
      url: browser.runtime.getURL('/options.html#/api-providers'),
      active: true,
    })
  }

  // Reset language detection when source language changes from/to auto
  useEffect(() => {
    if (sourceLanguage !== 'auto')
      resetDetection()
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
    <div className="w-full">
      {/* Header */}
      <div className="border-b">
        <Container>
          <header className="flex h-14 -ml-1.5 shrink-0 items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-1.5 h-4!" />
            <h1 className="text-lg font-semibold">{i18n.t('translationHub.header.title')}</h1>
          </header>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-6">
        {/* Translation Interface - Two Panel Layout */}
        <div className="flex gap-6 min-h-[600px]">
          {/* Left Panel - Language Config + Input Section */}
          <div className="w-1/2 space-y-2">
            {/* Language Configuration */}
            <LanguageConfig
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onSourceLanguageChange={setSourceLanguage}
              onTargetLanguageChange={setTargetLanguage}
              detectedLanguage={detectedLanguage}
              isDetecting={isDetecting}
            />

            {/* Text Input */}
            <LanguageInput
              value={inputText}
              onChange={handleInputChange}
              onTranslate={handleTranslate}
              onClear={handleClear}
              hasEnabledServices={translationServices.some(s => s.enabled)}
            />
          </div>

          {/* Right Panel - Services + Results Section */}
          <div className="w-1/2 space-y-2">
            {/* Services Configuration */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleConfigAPIKeys}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                <Icon icon="tabler:key" className="size-4" />
                {i18n.t('translationHub.services.configAPIKeys')}
              </button>

              <TranslationServiceManager
                services={translationServices}
                onChange={setTranslationServices}
                onClearProvider={clearProvider}
              />
            </div>

            {/* Translation Results */}
            {translationServices.some(s => s.enabled)
              ? (
                  <TranslationGrid
                    results={results}
                    services={translationServices}
                    onServiceToggle={handleServiceRemove}
                  />
                )
              : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="flex items-center gap-2 text-center">
                      <Icon icon="tabler:settings" className="size-4" />
                      <p className="text-sm">{i18n.t('translationHub.services.selectServices')}</p>
                    </div>
                  </div>
                )}
          </div>
        </div>
      </Container>
    </div>
  )
}

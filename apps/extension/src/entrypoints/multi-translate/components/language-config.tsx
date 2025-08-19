import type { TranslationService } from './translation-service-manager'
import type { LangCodeISO6393 } from '@/types/config/languages'
import { Icon } from '@iconify/react'
import { useCallback } from 'react'
import LanguageSelector from './language-selector'
import TranslationServiceManager from './translation-service-manager'

interface LanguageConfigProps {
  sourceLanguage: LangCodeISO6393 | 'auto'
  targetLanguage: LangCodeISO6393
  onSourceLanguageChange: (language: LangCodeISO6393 | 'auto') => void
  onTargetLanguageChange: (language: LangCodeISO6393) => void
  detectedLanguage?: LangCodeISO6393 | null
  isDetecting?: boolean
  services: TranslationService[]
  onServicesChange: (services: TranslationService[]) => void
}

export default function LanguageConfig({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  detectedLanguage = null,
  isDetecting = false,
  services,
  onServicesChange,
}: LanguageConfigProps) {
  const handleSwapLanguages = useCallback(() => {
    // For auto mode, use detected language if available
    if (sourceLanguage === 'auto' && detectedLanguage) {
      onSourceLanguageChange(targetLanguage)
      onTargetLanguageChange(detectedLanguage)
    }
    else if (sourceLanguage !== 'auto') {
      // Normal swap for non-auto languages
      onSourceLanguageChange(targetLanguage)
      onTargetLanguageChange(sourceLanguage as LangCodeISO6393)
    }
  }, [sourceLanguage, targetLanguage, detectedLanguage, onSourceLanguageChange, onTargetLanguageChange])

  // Can swap if either:
  // 1. Source is not auto and different from target, OR
  // 2. Source is auto but we have a detected language different from target
  const effectiveSourceLanguage = sourceLanguage === 'auto' ? detectedLanguage : sourceLanguage
  const canSwap = effectiveSourceLanguage && effectiveSourceLanguage !== targetLanguage

  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-40">
          <LanguageSelector
            value={sourceLanguage}
            onChange={onSourceLanguageChange}
            allowAuto={true}
            placeholder="Source language"
            detectedLanguage={detectedLanguage}
            isDetecting={isDetecting}
          />
        </div>

        <button
          type="button"
          onClick={handleSwapLanguages}
          disabled={!canSwap}
          className={`p-2 rounded-full transition-all duration-200 ${
            canSwap
              ? 'hover:bg-accent hover:scale-110 text-muted-foreground hover:text-foreground cursor-pointer'
              : 'text-muted-foreground/50 cursor-not-allowed'
          }`}
          title={canSwap ? 'Swap languages' : !effectiveSourceLanguage ? 'Enter text to detect language' : 'Cannot swap same languages'}
        >
          <Icon
            icon="tabler:arrows-exchange"
            className={`size-5 transition-transform duration-200 ${
              canSwap ? 'hover:rotate-180' : ''
            }`}
          />
        </button>

        <div className="w-40">
          <LanguageSelector
            value={targetLanguage}
            onChange={(value) => {
              if (value !== 'auto') {
                onTargetLanguageChange(value)
              }
            }}
            allowAuto={false}
            placeholder="Target language"
          />
        </div>
      </div>

      <TranslationServiceManager
        services={services}
        onChange={onServicesChange}
      />
    </div>
  )
}

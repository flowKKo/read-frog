import type { LangCodeISO6393 } from '@/types/config/languages'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Button } from '@repo/ui/components/button'
import LanguageSelector from './language-selector'

interface LanguageConfigProps {
  sourceLanguage: LangCodeISO6393 | 'auto'
  targetLanguage: LangCodeISO6393
  onSourceLanguageChange: (language: LangCodeISO6393 | 'auto') => void
  onTargetLanguageChange: (language: LangCodeISO6393) => void
  detectedLanguage?: LangCodeISO6393 | null
  isDetecting?: boolean
}

export default function LanguageConfig({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  detectedLanguage = null,
  isDetecting = false,
}: LanguageConfigProps) {
  const effectiveSourceLanguage = sourceLanguage === 'auto' ? detectedLanguage : sourceLanguage
  const canSwap = effectiveSourceLanguage && effectiveSourceLanguage !== targetLanguage

  const handleSwapLanguages = () => {
    if (sourceLanguage === 'auto' && detectedLanguage) {
      onSourceLanguageChange(targetLanguage)
      onTargetLanguageChange(detectedLanguage)
    }
    else if (sourceLanguage !== 'auto') {
      onSourceLanguageChange(targetLanguage)
      onTargetLanguageChange(sourceLanguage)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-40">
        <LanguageSelector
          value={sourceLanguage}
          onChange={onSourceLanguageChange}
          allowAuto={true}
          placeholder={i18n.t('translationHub.language.sourceLanguage')}
          detectedLanguage={detectedLanguage}
          isDetecting={isDetecting}
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleSwapLanguages}
        disabled={!canSwap}
        title={canSwap ? i18n.t('translationHub.language.swapLanguages') : !effectiveSourceLanguage ? i18n.t('translationHub.language.enterTextToDetect') : i18n.t('translationHub.language.cannotSwapSame')}
        className={canSwap ? 'hover:scale-110' : ''}
      >
        <Icon
          icon="tabler:arrows-exchange"
          className={`size-5 transition-transform duration-200 ${canSwap ? 'hover:rotate-180' : ''}`}
        />
      </Button>

      <div className="w-40">
        <LanguageSelector
          value={targetLanguage}
          onChange={(value) => {
            if (value !== 'auto') {
              onTargetLanguageChange(value)
            }
          }}
          allowAuto={false}
          placeholder={i18n.t('translationHub.language.targetLanguage')}
        />
      </div>
    </div>
  )
}

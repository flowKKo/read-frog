import type { LangCodeISO6393 } from '@/types/config/languages'
import { franc } from 'franc-min'
import { useCallback, useEffect, useState } from 'react'
import { LANG_CODE_TO_LOCALE_NAME } from '@/types/config/languages'
import { logger } from '@/utils/logger'

// Map franc detection results to our language codes when needed
const FRANC_TO_LANG_CODE_MAP: Record<string, LangCodeISO6393> = {
  lin: 'spa', // Lingala is sometimes detected instead of Spanish
  sco: 'eng', // Scots is sometimes detected instead of English
}

export interface LanguageDetectionResult {
  detectedLanguage: LangCodeISO6393 | null
  confidence: 'high' | 'medium' | 'low' | null
  isDetecting: boolean
}

export function useLanguageDetection() {
  const [result, setResult] = useState<LanguageDetectionResult>({
    detectedLanguage: null,
    confidence: null,
    isDetecting: false,
  })

  const detectLanguage = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResult({
        detectedLanguage: null,
        confidence: null,
        isDetecting: false,
      })
      return
    }

    setResult(prev => ({ ...prev, isDetecting: true }))

    try {
      // Use setTimeout to make it non-blocking
      setTimeout(() => {
        const detected = franc(text.trim())
        logger.log('Language detection result:', { text: text.substring(0, 50), detected })

        if (detected === 'und') {
          // Undetermined language - reset to "检测源语言" state
          setResult({
            detectedLanguage: null,
            confidence: null,
            isDetecting: false,
          })
        }
        else {
          // Map franc ISO 639-3 codes to our language codes
          let languageCode = detected as LangCodeISO6393

          // Apply manual mapping if needed
          if (FRANC_TO_LANG_CODE_MAP[detected]) {
            languageCode = FRANC_TO_LANG_CODE_MAP[detected]
            logger.log('Mapped franc detection result:', { original: detected, mapped: languageCode })
          }

          // Validate that the detected language code exists in our mapping
          if (!LANG_CODE_TO_LOCALE_NAME[languageCode]) {
            logger.warn('Detected language code not found in mapping:', detected, 'Final code:', languageCode)
            // Reset to "检测源语言" state when detection fails
            setResult({
              detectedLanguage: null,
              confidence: null,
              isDetecting: false,
            })
            return
          }

          // Determine confidence based on text length
          let confidence: 'high' | 'medium' | 'low' = 'medium'
          const textLength = text.trim().length

          if (textLength > 100) {
            confidence = 'high'
          }
          else if (textLength > 50) {
            confidence = 'medium'
          }
          else {
            confidence = 'low'
          }

          setResult({
            detectedLanguage: languageCode,
            confidence,
            isDetecting: false,
          })
        }
      }, 50) // Small delay to prevent blocking
    }
    catch (error) {
      logger.error('Language detection failed:', error)
      setResult({
        detectedLanguage: null,
        confidence: null,
        isDetecting: false,
      })
    }
  }, [])

  const reset = useCallback(() => {
    setResult({
      detectedLanguage: null,
      confidence: null,
      isDetecting: false,
    })
  }, [])

  return {
    ...result,
    detectLanguage,
    reset,
  }
}

// Hook for debounced language detection
export function useDebouncedLanguageDetection(delay = 500) {
  const { detectLanguage, ...rest } = useLanguageDetection()
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const debouncedDetectLanguage = useCallback((text: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(() => {
      detectLanguage(text)
    }, delay)

    setDebounceTimer(timer)
  }, [detectLanguage, delay, debounceTimer])

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return {
    ...rest,
    detectLanguage: debouncedDetectLanguage,
  }
}

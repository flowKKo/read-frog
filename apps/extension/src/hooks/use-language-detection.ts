import type { LangCodeISO6393 } from '@/types/config/languages'
import { franc } from 'franc-min'
import { useEffect, useRef, useState } from 'react'
import { LANG_CODE_TO_LOCALE_NAME } from '@/types/config/languages'
import { logger } from '@/utils/logger'

export interface LanguageDetectionResult {
  detectedLanguage: LangCodeISO6393 | null
  confidence: 'high' | 'medium' | 'low' | null
  isDetecting: boolean
}

const INITIAL_STATE: LanguageDetectionResult = {
  detectedLanguage: null,
  confidence: null,
  isDetecting: false,
}

function getConfidence(textLength: number): 'high' | 'medium' | 'low' {
  if (textLength > 100)
    return 'high'
  if (textLength > 50)
    return 'medium'
  return 'low'
}

export function useLanguageDetection() {
  const [result, setResult] = useState<LanguageDetectionResult>(INITIAL_STATE)

  const detectLanguage = async (text: string) => {
    const trimmedText = text.trim()

    if (!trimmedText) {
      setResult(INITIAL_STATE)
      return
    }

    setResult(prev => ({ ...prev, isDetecting: true }))

    try {
      // Use setTimeout to make it non-blocking
      setTimeout(() => {
        const detected = franc(trimmedText)
        logger.log('Language detection result:', { text: trimmedText.substring(0, 50), detected })

        if (detected === 'und') {
          setResult(INITIAL_STATE)
          return
        }

        const languageCode = detected as LangCodeISO6393

        // Validate that the detected language code exists in our mapping
        if (!LANG_CODE_TO_LOCALE_NAME[languageCode]) {
          logger.warn('Detected language code not found in mapping:', detected, 'Final code:', languageCode)
          setResult(INITIAL_STATE)
          return
        }

        setResult({
          detectedLanguage: languageCode,
          confidence: getConfidence(trimmedText.length),
          isDetecting: false,
        })
      }, 50) // Small delay to prevent blocking
    }
    catch (error) {
      logger.error('Language detection failed:', error)
      setResult(INITIAL_STATE)
    }
  }

  const reset = () => setResult(INITIAL_STATE)

  return {
    ...result,
    detectLanguage,
    reset,
  }
}

// Hook for debounced language detection using useRef for timer management
export function useDebouncedLanguageDetection(delay = 500) {
  const { detectLanguage, ...rest } = useLanguageDetection()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedDetectLanguage = (text: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      detectLanguage(text)
    }, delay)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    ...rest,
    detectLanguage: debouncedDetectLanguage,
  }
}

import type { LangCodeISO6393 } from '@/types/config/languages'
import type { TranslateProviderNames } from '@/types/config/provider'
import { useCallback, useState } from 'react'
import { ISO6393_TO_6391, LANG_CODE_TO_EN_NAME } from '@/types/config/languages'
import { isLLMTranslateProvider, isPureTranslateProvider } from '@/types/config/provider'
import { globalConfig } from '@/utils/config/config'
import { aiTranslate, deeplxTranslate, googleTranslate, microsoftTranslate } from '@/utils/host/translate/api'
import { getTranslatePrompt } from '@/utils/prompts/translate'

export interface TranslationResult {
  provider: TranslateProviderNames
  text?: string
  error?: string
  loading: boolean
}

export interface MultiTranslateOptions {
  providers?: TranslateProviderNames[]
  timeout?: number
  sourceLanguage?: LangCodeISO6393 | 'auto'
  targetLanguage?: LangCodeISO6393
}

export function useMultiTranslate() {
  const [results, setResults] = useState<TranslationResult[]>([])

  const translateWithProvider = useCallback(async (
    text: string,
    provider: TranslateProviderNames,
    sourceLanguage: LangCodeISO6393 | 'auto',
    targetLanguage: LangCodeISO6393,
  ): Promise<string> => {
    if (!globalConfig) {
      throw new Error('Global config not loaded')
    }

    if (isPureTranslateProvider(provider)) {
      const sourceLang = sourceLanguage === 'auto' ? 'auto' : (ISO6393_TO_6391[sourceLanguage as LangCodeISO6393] ?? 'auto')
      const targetLang = ISO6393_TO_6391[targetLanguage as LangCodeISO6393]
      if (!targetLang) {
        throw new Error('Invalid target language code')
      }

      switch (provider) {
        case 'google':
          return await googleTranslate(text, sourceLang, targetLang)
        case 'microsoft':
          return await microsoftTranslate(text, sourceLang, targetLang)
        case 'deeplx':
          return await deeplxTranslate(text, sourceLang, targetLang, { backgroundFetch: true })
        default:
          throw new Error(`Unsupported pure translate provider: ${provider}`)
      }
    }
    else if (isLLMTranslateProvider(provider)) {
      const modelConfig = globalConfig.translate.models[provider]
      if (!modelConfig) {
        throw new Error(`No configuration found for provider: ${provider}`)
      }

      const modelString = modelConfig.isCustomModel ? modelConfig.customModel : modelConfig.model
      if (!modelString) {
        throw new Error(`No model configured for provider: ${provider}`)
      }

      const targetLangName = LANG_CODE_TO_EN_NAME[targetLanguage as LangCodeISO6393]
      if (!targetLangName) {
        throw new Error('Invalid target language code')
      }

      const prompt = getTranslatePrompt(targetLangName, text)
      return await aiTranslate(provider, modelString, prompt)
    }

    throw new Error(`Unsupported provider: ${provider}`)
  }, [])

  const translateMultiple = useCallback(async (
    text: string,
    options: MultiTranslateOptions = {},
  ) => {
    if (!globalConfig) {
      throw new Error('Global config not loaded')
    }

    const {
      providers = ['google', 'microsoft', 'deeplx', globalConfig.translate.provider],
      timeout = 10000,
      sourceLanguage = globalConfig.language.sourceCode === 'auto' ? 'auto' : globalConfig.language.sourceCode,
      targetLanguage = globalConfig.language.targetCode,
    } = options

    const uniqueProviders = Array.from(new Set(providers))

    // Initialize results with loading state, preserving existing text
    setResults((prevResults) => {
      const prevResultsMap = new Map(prevResults.map(result => [result.provider, result]))

      return uniqueProviders.map((provider) => {
        const existingResult = prevResultsMap.get(provider)
        return {
          provider,
          loading: true,
          text: existingResult?.text, // Preserve existing text
          error: undefined, // Clear previous errors
        }
      })
    })

    // Start all translations in parallel
    const translationPromises = uniqueProviders.map(async (provider, index) => {
      try {
        const translatedText = await Promise.race([
          translateWithProvider(text, provider, sourceLanguage, targetLanguage),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Translation timeout')), timeout),
          ),
        ])

        setResults(prev => prev.map((result, i) =>
          i === index ? { ...result, text: translatedText, loading: false } : result,
        ))
      }
      catch (error) {
        setResults(prev => prev.map((result, i) =>
          i === index
            ? {
                ...result,
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false,
              }
            : result,
        ))
      }
    })

    await Promise.allSettled(translationPromises)
  }, [translateWithProvider])

  const reset = useCallback(() => {
    setResults([])
  }, [])

  const clearProvider = useCallback((provider: TranslateProviderNames) => {
    setResults(prev => prev.filter(result => result.provider !== provider))
  }, [])

  return {
    results,
    translateMultiple,
    reset,
    clearProvider,
  }
}

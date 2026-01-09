export interface SelectedService {
  id: string
  name: string
  provider: string
  enabled: boolean
  type?: 'normal' | 'ai'
}

export interface TranslationResult {
  id: string
  name: string
  provider: string
  text?: string
  error?: string
  isLoading: boolean
}

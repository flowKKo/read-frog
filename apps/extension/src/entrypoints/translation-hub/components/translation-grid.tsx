import type { TranslationService } from './translation-service-manager'
import type { TranslationResult } from '@/hooks/use-multi-translate'
import type { TranslateProviderNames } from '@/types/config/provider'
import { useState } from 'react'
import TranslationCard from './translation-card'

interface TranslationGridProps {
  results: TranslationResult[]
  services: TranslationService[]
  onServiceToggle: (serviceId: TranslateProviderNames) => void
}

export default function TranslationGrid({ results, services, onServiceToggle }: TranslationGridProps) {
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(() => new Set())
  const resultsMap = new Map(results.map(result => [result.provider, result]))

  const handleToggleCollapse = (serviceId: TranslateProviderNames) => {
    setCollapsedCards((prev) => {
      const newSet = new Set(prev)
      newSet.has(serviceId) ? newSet.delete(serviceId) : newSet.add(serviceId)
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      {services
        .filter(s => s.enabled)
        .map(service => (
          <TranslationCard
            key={service.id}
            result={resultsMap.get(service.id) || {
              provider: service.id,
              loading: false,
              text: undefined,
              error: undefined,
            }}
            onClose={() => onServiceToggle(service.id)}
            isCollapsed={collapsedCards.has(service.id)}
            onToggleCollapse={() => handleToggleCollapse(service.id)}
          />
        ))}
    </div>
  )
}

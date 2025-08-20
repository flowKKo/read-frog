import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { TranslationService } from './translation-service-manager'
import type { TranslationResult } from '@/hooks/use-multi-translate'
import type { TranslateProviderNames } from '@/types/config/provider'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useState } from 'react'
import TranslationCard from './translation-card'

interface TranslationGridProps {
  results: TranslationResult[]
  services: TranslationService[]
  onServiceToggle: (serviceId: TranslateProviderNames) => void
  onServicesReorder?: (reorderedServices: TranslationService[]) => void
}

// Sortable card component
function SortableCard({
  service,
  result,
  onClose,
  isCollapsed,
  onToggleCollapse,
  justDropped,
}: {
  service: TranslationService
  result: TranslationResult
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  justDropped: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: service.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    transition: isDragging || justDropped ? 'none' : 'transform 200ms ease-out',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-4 last:mb-0"
      {...attributes}
    >
      <TranslationCard
        result={result}
        onClose={onClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          ...listeners,
        }}
      />
    </div>
  )
}

export default function TranslationGrid({ results, services, onServiceToggle, onServicesReorder }: TranslationGridProps) {
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(() => new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [justDropped, setJustDropped] = useState(false)
  const enabledServices = services.filter(s => s.enabled)
  const resultsMap = new Map(results.map(result => [result.provider, result]))

  // Clean up collapsed state when services are removed
  const cleanupCollapsedCards = useCallback(() => {
    const enabledServiceIds = new Set(enabledServices.map(s => s.id))
    setCollapsedCards((prev) => {
      const filteredIds = [...prev].filter(id => enabledServiceIds.has(id as any))
      return new Set(filteredIds)
    })
  }, [enabledServices])

  useEffect(() => {
    cleanupCollapsedCards()
  }, [cleanupCollapsedCards])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleToggleCollapse = (serviceId: TranslateProviderNames) => {
    setCollapsedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      }
      else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setJustDropped(true)

    // Reset justDropped after a short delay
    setTimeout(() => {
      setJustDropped(false)
    }, 150)

    if (!over || !onServicesReorder || active.id === over.id)
      return

    const oldIndex = enabledServices.findIndex(s => s.id === active.id)
    const newIndex = enabledServices.findIndex(s => s.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newEnabledServices = arrayMove(enabledServices, oldIndex, newIndex)
      const disabledServices = services.filter(s => !s.enabled)
      onServicesReorder([...newEnabledServices, ...disabledServices])
    }
  }

  const activeCard = activeId ? enabledServices.find(s => s.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={enabledServices.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div>
          {enabledServices.map((service) => {
            const result = resultsMap.get(service.id) || {
              provider: service.id,
              loading: false,
              text: undefined,
              error: undefined,
            }

            return (
              <SortableCard
                key={service.id}
                service={service}
                result={result}
                onClose={() => onServiceToggle(service.id)}
                isCollapsed={collapsedCards.has(service.id)}
                onToggleCollapse={() => handleToggleCollapse(service.id)}
                justDropped={justDropped}
              />
            )
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeCard
          ? (
              <div className="opacity-95 shadow-2xl">
                <TranslationCard
                  result={resultsMap.get(activeCard.id) || {
                    provider: activeCard.id,
                    loading: false,
                    text: undefined,
                    error: undefined,
                  }}
                  onClose={() => onServiceToggle(activeCard.id)}
                  isCollapsed={collapsedCards.has(activeCard.id)}
                  dragHandleProps={{
                    ref: () => {},
                  }}
                />
              </div>
            )
          : null}
      </DragOverlay>
    </DndContext>
  )
}

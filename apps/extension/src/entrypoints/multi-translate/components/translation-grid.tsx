import type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import type { TranslationService } from './translation-service-manager'
import type { TranslationResult } from '@/hooks/use-multi-translate'
import type { TranslateProviderNames } from '@/types/config/provider'
import {
  closestCenter,
  defaultDropAnimationSideEffects,
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
import { useEffect, useState } from 'react'
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
  isDraggingGlobally: _isDraggingGlobally,
  justDropped,
}: {
  service: TranslationService
  result: TranslationResult
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isDraggingGlobally: boolean
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
    animateLayoutChanges: (args) => {
      const { isSorting, isDragging } = args
      // Disable animation for the currently dragged item
      if (isDragging)
        return false
      // Enable smooth animation for all other items during sorting
      if (isSorting)
        return true
      // Enable animation when dropping
      return true
    },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-4 last:mb-0 ${isDragging || justDropped ? '' : 'transition-transform duration-200 ease-out'}`}
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
  const [activeId, setActiveId] = useState<string | null>(null)
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(() => new Set())
  const [justDropped, setJustDropped] = useState(false)
  const enabledServices = services.filter(s => s.enabled)
  const resultsMap = new Map(results.map(result => [result.provider, result]))

  // Clean up collapsed state when services are removed
  useEffect(() => {
    const enabledServiceIds = new Set(enabledServices.map(s => s.id))

    // Create update function
    const updateCollapsedCards = (prevCards: Set<string>) => {
      const newSet = new Set<string>()
      // Only keep collapsed state for services that are still enabled
      prevCards.forEach((serviceId) => {
        if (enabledServiceIds.has(serviceId as any)) {
          newSet.add(serviceId)
        }
      })
      return newSet
    }

    setCollapsedCards(updateCollapsedCards)
  }, [enabledServices])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Create card data
  const cardData = enabledServices.map((service) => {
    const result = resultsMap.get(service.id)
    return {
      service,
      result: result || {
        provider: service.id,
        loading: false,
        text: undefined,
        error: undefined,
      },
    }
  })

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

    // Reset justDropped after animation completes
    setTimeout(() => {
      setJustDropped(false)
    }, 250)

    if (!over || !onServicesReorder)
      return

    if (active.id !== over.id) {
      const oldIndex = enabledServices.findIndex(s => s.id === active.id)
      const newIndex = enabledServices.findIndex(s => s.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        // Create new order by moving item from oldIndex to newIndex
        const newEnabledServices = arrayMove(enabledServices, oldIndex, newIndex)

        // Combine with disabled services
        const disabledServices = services.filter(s => !s.enabled)
        const newServices = [...newEnabledServices, ...disabledServices]

        onServicesReorder(newServices)
      }
    }
  }

  // Find the active item for the overlay
  const activeCard = activeId ? cardData.find(({ service }) => service.id === activeId) : null

  const dropAnimation = {
    duration: 200,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  }

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
          {cardData.map(({ service, result }) => (
            <SortableCard
              key={service.id}
              service={service}
              result={result}
              onClose={() => onServiceToggle(service.id)}
              isCollapsed={collapsedCards.has(service.id)}
              onToggleCollapse={() => handleToggleCollapse(service.id)}
              isDraggingGlobally={activeId !== null}
              justDropped={justDropped}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeCard
          ? (
              <div className="w-full opacity-95 shadow-2xl">
                <TranslationCard
                  result={activeCard.result}
                  onClose={() => onServiceToggle(activeCard.service.id)}
                  isCollapsed={collapsedCards.has(activeCard.service.id)}
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

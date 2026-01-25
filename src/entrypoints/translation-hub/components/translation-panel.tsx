import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { useAtom } from 'jotai'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty'
import { SortableList } from '@/components/sortable-list'
import { selectedProviderIdsAtom } from '../atoms'
import { TranslationCard } from './translation-card'

export function TranslationPanel() {
  const [selectedProviderIds, setSelectedProviderIds] = useAtom(selectedProviderIdsAtom)
  const sortableItems = selectedProviderIds.map(id => ({ id }))

  if (selectedProviderIds.length === 0) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon icon="tabler:language-off" className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{i18n.t('translationHub.noServicesSelected')}</EmptyTitle>
          <EmptyDescription>
            {i18n.t('translationHub.noServicesDescription')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <SortableList
      list={sortableItems}
      setList={items => setSelectedProviderIds(items.map(item => item.id))}
      className="space-y-4"
      renderItem={item => <TranslationCard providerId={item.id} />}
    />
  )
}

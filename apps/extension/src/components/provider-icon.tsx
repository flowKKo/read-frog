import { cn } from '@repo/ui/lib/utils'

interface ProviderIconProps {
  logo: string
  name?: string
  className?: string
  size?: 'default' | 'large'
}

export default function ProviderIcon({ logo, name, className, size = 'default' }: ProviderIconProps) {
  const isLarge = size === 'large'

  return (
    <div className={cn('flex items-center', isLarge ? 'gap-2' : 'gap-1.5', className)}>
      <div className={cn(
        'rounded-full bg-white border border-border flex items-center justify-center',
        isLarge ? 'size-8' : 'size-5',
      )}
      >
        <img
          src={logo}
          alt={name}
          className={isLarge ? 'size-5' : 'size-[11px]'}
        />
      </div>
      {name && <span className={isLarge ? 'text-base font-medium' : ''}>{name}</span>}
    </div>
  )
}

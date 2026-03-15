import { useMemo } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { parseAttributeName } from '../store/attributes.store'
import { useAttributes } from '@/hooks/use-attributes'

interface AttributeBadgeProps {
  attributeId: number
  onRemove?: () => void
  className?: string
  /** Show only value part (default), or full "key: value" */
  showKey?: boolean
}

export function AttributeBadge({ attributeId, onRemove, className, showKey }: AttributeBadgeProps) {
  const { data: attributesData } = useAttributes({ limit: 200 })
  const name = attributesData?.items.find((a) => a.id === attributeId)?.name

  const display = useMemo(
    () => (name ? parseAttributeName(name) : null),
    [name],
  )

  if (!display) return null

  const label = showKey ? `${display.key}: ${display.value}` : display.value

  return (
    <Badge
      variant="secondary"
      className={`text-[10px] h-5 gap-0.5 px-1.5 ${className ?? ''}`}
      title={`${display.key}: ${display.value}`}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 hover:text-destructive"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </Badge>
  )
}

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAttributesStore } from '../store/attributes.store'

interface AttributeBadgeProps {
  attributeId: number
  onRemove?: () => void
  className?: string
}

export function AttributeBadge({ attributeId, onRemove, className }: AttributeBadgeProps) {
  const name = useAttributesStore((s) => s.getAttributeName(attributeId))

  if (!name) return null

  return (
    <Badge
      variant="secondary"
      className={`text-[10px] h-5 gap-0.5 px-1.5 ${className ?? ''}`}
    >
      {name}
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

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useEditorStore } from '../store/editor.store'
import { MOCK_OFFERS } from '../constants'
import { AttributeBadge } from '../components/AttributeBadge'
import { DroppableZone } from '../components/DroppableZone'
import type { OfferNodeData } from '../types'

type Props = NodeProps & { data: OfferNodeData }

type AttrZone = 'requires_all' | 'requires_optional' | 'excludes'

const ZONE_CONFIG: { key: AttrZone; label: string; color: string }[] = [
  { key: 'requires_all', label: 'Requires All', color: 'text-red-600' },
  { key: 'requires_optional', label: 'Requires Optional', color: 'text-blue-600' },
  { key: 'excludes', label: 'Excludes', color: 'text-amber-600' },
]

export function OfferNode({ id, data, selected }: Props) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData)
  const removeNode = useEditorStore((s) => s.removeNode)

  const selectedOffer = MOCK_OFFERS.find((o) => String(o.id) === data.offerId)

  const handleRemoveAttribute = (zone: AttrZone, attrId: number) => {
    const current = data[zone]
    updateNodeData(id, { [zone]: current.filter((a) => a !== attrId) })
  }

  return (
    <div className={cn('w-[320px]', selected && 'ring-2 ring-primary rounded-lg')}>
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />

      <Card className="border-t-[3px] border-t-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2">
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
            Offer
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="nodrag h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => removeNode(id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-2 px-3 pb-3">
          <Select
            value={data.offerId}
            onValueChange={(v) => {
              const offer = MOCK_OFFERS.find((o) => String(o.id) === v)
              updateNodeData(id, {
                offerId: v,
                label: offer?.name ?? '',
                requires_all: offer?.requires_all ?? [],
                requires_optional: offer?.requires_optional ?? [],
                excludes: offer?.excludes ?? [],
              })
            }}
          >
            <SelectTrigger className="nodrag nowheel h-8 text-xs">
              <SelectValue placeholder="Select an offer..." />
            </SelectTrigger>
            <SelectContent>
              {MOCK_OFFERS.map((offer) => (
                <SelectItem key={offer.id} value={String(offer.id)}>
                  {offer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedOffer && (
            <p className="text-[11px] text-muted-foreground">{selectedOffer.description}</p>
          )}

          <Input
            className="nodrag nowheel h-8 text-sm"
            placeholder="Display label..."
            defaultValue={data.label}
            onBlur={(e) => updateNodeData(id, { label: e.target.value })}
          />

          {ZONE_CONFIG.map(({ key, label, color }) => (
            <div key={key} className="space-y-1">
              <p className={`text-[10px] font-medium uppercase tracking-wider ${color}`}>
                {label}
              </p>
              <DroppableZone
                id={`offer-zone-${id}-${key}`}
                data={{ type: 'offer-zone', nodeId: id, zone: key }}
              >
                {data[key].map((attrId) => (
                  <AttributeBadge
                    key={attrId}
                    attributeId={attrId}
                    onRemove={() => handleRemoveAttribute(key, attrId)}
                  />
                ))}
              </DroppableZone>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

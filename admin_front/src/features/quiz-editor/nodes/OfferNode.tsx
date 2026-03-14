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
import type { OfferNodeData } from '../types'

type Props = NodeProps & { data: OfferNodeData }

export function OfferNode({ id, data, selected }: Props) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData)
  const removeNode = useEditorStore((s) => s.removeNode)

  const selectedOffer = MOCK_OFFERS.find((o) => o.id === data.offerId)

  return (
    <div className={cn('w-[280px]', selected && 'ring-2 ring-primary rounded-lg')}>
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
              const offer = MOCK_OFFERS.find((o) => o.id === v)
              updateNodeData(id, { offerId: v, label: offer?.name ?? '' })
            }}
          >
            <SelectTrigger className="nodrag nowheel h-8 text-xs">
              <SelectValue placeholder="Select an offer..." />
            </SelectTrigger>
            <SelectContent>
              {MOCK_OFFERS.map((offer) => (
                <SelectItem key={offer.id} value={offer.id}>
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
        </CardContent>
      </Card>
    </div>
  )
}

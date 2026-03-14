import { useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEditorStore } from '../store/editor.store'
import { TRANSITION_CONDITION_TYPES } from '../constants'
import type { TransitionEdgeData, FlowTransitionConditionType } from '../types'

type Props = EdgeProps & { data?: TransitionEdgeData }

function conditionLabel(data?: TransitionEdgeData): string {
  if (!data || data.conditionType === 'always') return ''
  const count = data.answerIds.length
  if (data.conditionType === 'answer_any') return `any [${count}]`
  if (data.conditionType === 'answer_all') return `all [${count}]`
  return ''
}

export function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: Props) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const updateEdgeData = useEditorStore((s) => s.updateEdgeData)
  const removeEdge = useEditorStore((s) => s.removeEdge)

  const label = conditionLabel(data)

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          strokeWidth: selected ? 2 : 1.5,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute flex items-center gap-1"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <Popover>
            <PopoverTrigger asChild>
              {label ? (
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-[10px] hover:bg-secondary/80"
                >
                  {label}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="cursor-pointer text-[10px] border-dashed hover:bg-accent"
                >
                  {data?.conditionType === 'always' ? 'always' : '+'}
                </Badge>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="center">
              <TransitionEditor
                data={data}
                onChange={(d) => updateEdgeData(id, d)}
              />
            </PopoverContent>
          </Popover>

          {selected && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-destructive"
              onClick={() => removeEdge(id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

function TransitionEditor({
  data,
  onChange,
}: {
  data?: TransitionEdgeData
  onChange: (data: Partial<TransitionEdgeData>) => void
}) {
  const [conditionType, setConditionType] = useState<FlowTransitionConditionType>(
    data?.conditionType ?? 'always',
  )

  const handleTypeChange = (v: string) => {
    const newType = v as FlowTransitionConditionType
    setConditionType(newType)
    onChange({
      conditionType: newType,
      ...(newType === 'always' ? { answerIds: [] } : {}),
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">Transition type</p>
      <Select value={conditionType} onValueChange={handleTypeChange}>
        <SelectTrigger className="h-7 text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TRANSITION_CONDITION_TYPES.map((ct) => (
            <SelectItem key={ct.value} value={ct.value}>
              {ct.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {conditionType !== 'always' && (
        <p className="text-[10px] text-muted-foreground">
          Answer-based conditions are resolved automatically from connected answer handles.
        </p>
      )}
    </div>
  )
}

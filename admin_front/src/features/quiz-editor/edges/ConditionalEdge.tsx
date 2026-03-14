import { useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import { Plus, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { CONDITION_OPERATORS, USER_ATTRIBUTES } from '../constants'
import type { ConditionalEdgeData, EdgeCondition, ConditionOperator } from '../types'

type Props = EdgeProps & { data?: ConditionalEdgeData }

function conditionSummary(conditions: EdgeCondition[]): string {
  if (conditions.length === 0) return ''
  if (conditions.length === 1) {
    const c = conditions[0]
    const op = CONDITION_OPERATORS.find((o) => o.value === c.operator)
    return `${c.attribute} ${op?.label ?? c.operator} ${Array.isArray(c.value) ? c.value.join(', ') : c.value}`
  }
  return `${conditions.length} conditions`
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

  const conditions = data?.conditions ?? []
  const updateEdgeConditions = useEditorStore((s) => s.updateEdgeConditions)
  const removeEdge = useEditorStore((s) => s.removeEdge)

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
              {conditions.length > 0 ? (
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-[10px] hover:bg-secondary/80 max-w-[160px] truncate"
                >
                  {conditionSummary(conditions)}
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-5 w-5 rounded-full border-dashed"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="center">
              <ConditionEditor
                edgeId={id}
                conditions={conditions}
                onChange={(c) => updateEdgeConditions(id, c)}
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

function ConditionEditor({
  edgeId,
  conditions,
  onChange,
}: {
  edgeId: string
  conditions: EdgeCondition[]
  onChange: (conditions: EdgeCondition[]) => void
}) {
  const [local, setLocal] = useState<EdgeCondition[]>(conditions)

  const update = (index: number, patch: Partial<EdgeCondition>) => {
    const next = local.map((c, i) => (i === index ? { ...c, ...patch } : c))
    setLocal(next)
    onChange(next)
  }

  const add = () => {
    const next = [...local, { attribute: '', operator: 'eq' as ConditionOperator, value: '' }]
    setLocal(next)
    onChange(next)
  }

  const remove = (index: number) => {
    const next = local.filter((_, i) => i !== index)
    setLocal(next)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">Conditions</p>
      {local.map((condition, i) => (
        <div key={i} className="flex items-center gap-1">
          <Select
            value={condition.attribute}
            onValueChange={(v) => update(i, { attribute: v })}
          >
            <SelectTrigger className="h-7 text-[11px] flex-1">
              <SelectValue placeholder="attr" />
            </SelectTrigger>
            <SelectContent>
              {USER_ATTRIBUTES.map((attr) => (
                <SelectItem key={attr} value={attr}>
                  {attr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={condition.operator}
            onValueChange={(v) => update(i, { operator: v as ConditionOperator })}
          >
            <SelectTrigger className="h-7 text-[11px] w-14">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            className="h-7 text-[11px] w-20"
            value={typeof condition.value === 'string' ? condition.value : String(condition.value)}
            placeholder="value"
            onChange={(e) => update(i, { value: e.target.value })}
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(i)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 w-full text-xs" onClick={add}>
        <Plus className="h-3 w-3 mr-1" />
        Add condition
      </Button>
    </div>
  )
}

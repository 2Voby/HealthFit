import { useState, useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { parseAttributeName } from '../store/attributes.store'
import { useAttributes, useCreateAttribute, useDeleteAttribute } from '@/hooks/use-attributes'
import type { AttributeResponse } from '@/types/api'

function DraggableAttributeValue({ attribute, onRemove }: { attribute: AttributeResponse; onRemove: (id: number) => void }) {
  const { value } = parseAttributeName(attribute.name)
  const { attributes: dragAttrs, listeners, setNodeRef, isDragging } = useDraggable({
    id: `attr-${attribute.id}`,
    data: { type: 'attribute', attributeId: attribute.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors',
        'hover:bg-accent cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
      {...listeners}
      {...dragAttrs}
    >
      <GripVertical className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
      <span className="flex-1 truncate text-muted-foreground">{value}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(attribute.id)
        }}
      >
        <Trash2 className="h-2.5 w-2.5" />
      </Button>
    </div>
  )
}

function AttributeGroup({
  groupKey,
  items,
  onAddValue,
  onRemove,
}: {
  groupKey: string
  items: AttributeResponse[]
  onAddValue: (key: string, value: string) => void
  onRemove: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [addingValue, setAddingValue] = useState(false)
  const [newValue, setNewValue] = useState('')

  const handleAddValue = () => {
    if (newValue.trim()) {
      onAddValue(groupKey, newValue.trim())
      setNewValue('')
      setAddingValue(false)
    }
  }

  const handleRemoveGroup = () => {
    for (const item of items) onRemove(item.id)
  }

  return (
    <div className="space-y-0.5">
      <div className="group flex items-center gap-1 px-2 py-1">
        <button
          className="flex items-center gap-1 flex-1 min-w-0 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <span className="text-xs font-medium truncate">{groupKey}</span>
          <span className="text-[10px] text-muted-foreground">({items.length})</span>
        </button>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={() => setAddingValue(true)}
          >
            <Plus className="h-2.5 w-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 hover:text-destructive"
            onClick={handleRemoveGroup}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="pl-3 space-y-0.5">
          {items.map((attr) => (
            <DraggableAttributeValue key={attr.id} attribute={attr} onRemove={onRemove} />
          ))}
          {addingValue && (
            <div className="flex items-center gap-1 px-1 py-0.5">
              <Input
                className="h-5 text-[11px] flex-1"
                placeholder="value..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddValue()
                  if (e.key === 'Escape') { setAddingValue(false); setNewValue('') }
                }}
                autoFocus
              />
              <Button variant="ghost" size="icon" className="h-4 w-4" onClick={handleAddValue}>
                <Plus className="h-2.5 w-2.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AttributesPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [addingKey, setAddingKey] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newFirstValue, setNewFirstValue] = useState('')

  const { data: attributesData } = useAttributes({ limit: 200 })
  const attributes = attributesData?.items ?? []
  const createAttribute = useCreateAttribute()
  const deleteAttribute = useDeleteAttribute()

  const grouped = useMemo(() => {
    const groups = new Map<string, AttributeResponse[]>()
    for (const attr of attributes) {
      const { key } = parseAttributeName(attr.name)
      const group = groups.get(key) ?? []
      group.push(attr)
      groups.set(key, group)
    }
    return groups
  }, [attributes])

  const handleAddValue = (key: string, value: string) => {
    createAttribute.mutate({ name: `${key}-${value}` })
  }

  const handleRemove = (id: number) => {
    deleteAttribute.mutate(id)
  }

  const handleAddKey = () => {
    if (newKey.trim() && newFirstValue.trim()) {
      createAttribute.mutate({ name: `${newKey.trim()}-${newFirstValue.trim()}` })
      setNewKey('')
      setNewFirstValue('')
      setAddingKey(false)
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-col border-l bg-background transition-[width] duration-200',
        collapsed ? 'w-12' : 'w-60',
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold"
            >
              Attributes
            </motion.span>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1">
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setAddingKey(!addingKey)}
              title="Add new attribute key"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {!collapsed && addingKey && (
        <div className="px-2 py-2 space-y-1">
          <Input
            className="h-6 text-xs"
            placeholder="Key (e.g. age)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setAddingKey(false); setNewKey(''); setNewFirstValue('') }
            }}
            autoFocus
          />
          <Input
            className="h-6 text-xs"
            placeholder="First value (e.g. 11-20)"
            value={newFirstValue}
            onChange={(e) => setNewFirstValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddKey()
              if (e.key === 'Escape') { setAddingKey(false); setNewKey(''); setNewFirstValue('') }
            }}
          />
          <div className="flex gap-1">
            <Button variant="default" size="sm" className="h-5 flex-1 text-[11px]" onClick={handleAddKey}>
              Add
            </Button>
            <Button variant="ghost" size="sm" className="h-5 text-[11px]" onClick={() => { setAddingKey(false); setNewKey(''); setNewFirstValue('') }}>
              Cancel
            </Button>
          </div>
          <Separator />
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-1 space-y-1">
          {!collapsed && Array.from(grouped.entries()).map(([key, items]) => (
            <AttributeGroup
              key={key}
              groupKey={key}
              items={items}
              onAddValue={handleAddValue}
              onRemove={handleRemove}
            />
          ))}
          {collapsed && (
            <div className="flex flex-col items-center gap-1 pt-1">
              {Array.from(grouped.keys()).slice(0, 8).map((key) => (
                <span
                  key={key}
                  className="text-[9px] text-muted-foreground truncate w-8 text-center"
                  title={key}
                >
                  {key.slice(0, 4)}
                </span>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

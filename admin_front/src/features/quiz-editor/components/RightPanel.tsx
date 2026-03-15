import { useState, useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  ChevronLeft, ChevronRight, Plus, Trash2, GripVertical,
  ChevronDown, ChevronUp, Pencil, Check, X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { parseAttributeName } from '../store/attributes.store'
import { useAttributes, useCreateAttribute, useDeleteAttribute } from '@/hooks/use-attributes'
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from '@/hooks/use-offers'
import { AttributeBadge } from './AttributeBadge'
import type { AttributeResponse, OfferResponse } from '@/types/api'

// ─── Attributes section ──────────────────────────────────────

function DraggableAttributeValue({
  attribute,
  onRemove,
}: {
  attribute: AttributeResponse
  onRemove: (id: number) => void
}) {
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
        onClick={(e) => { e.stopPropagation(); onRemove(attribute.id) }}
      >
        <Trash2 className="h-2.5 w-2.5" />
      </Button>
    </div>
  )
}

function AttributeGroup({
  groupKey, items, onAddValue, onRemove,
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

  return (
    <div className="space-y-0.5">
      <div className="group flex items-center gap-1 px-2 py-1">
        <button
          className="flex items-center gap-1 flex-1 min-w-0 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            : <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-medium truncate">{groupKey}</span>
          <span className="text-[10px] text-muted-foreground">({items.length})</span>
        </button>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setAddingValue(true)}>
            <Plus className="h-2.5 w-2.5" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-4 w-4 hover:text-destructive"
            onClick={() => { for (const item of items) onRemove(item.id) }}
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

// ─── Offers section ──────────────────────────────────────────

function AttributeMultiSelect({
  label,
  selectedIds,
  onChange,
}: {
  label: string
  selectedIds: number[]
  onChange: (ids: number[]) => void
}) {
  const { data } = useAttributes({ limit: 200 })
  const attributes = data?.items ?? []

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    )
  }

  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1 min-h-[22px] rounded border p-1">
        {selectedIds.map((id) => (
          <AttributeBadge key={id} attributeId={id} showKey onRemove={() => toggle(id)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {attributes
          .filter((a) => !selectedIds.includes(a.id))
          .map((a) => {
            const { value } = parseAttributeName(a.name)
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                title={a.name}
                className="text-[10px] px-1.5 py-0.5 rounded border border-dashed hover:bg-accent transition-colors"
              >
                {value}
              </button>
            )
          })}
      </div>
    </div>
  )
}

function OfferForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: OfferResponse
  onSave: (data: {
    name: string; description: string; price: number; priority: number
    requires_all: number[]; requires_optional: number[]; excludes: number[]
  }) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(String(initial?.price ?? 0))
  const [priority, setPriority] = useState(String(initial?.priority ?? 0))
  const [requiresAll, setRequiresAll] = useState<number[]>(initial?.requires_all ?? [])
  const [requiresOptional, setRequiresOptional] = useState<number[]>(initial?.requires_optional ?? [])
  const [excludes, setExcludes] = useState<number[]>(initial?.excludes ?? [])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          name: name.trim(), description: description.trim(),
          price: parseFloat(price) || 0, priority: parseInt(priority) || 0,
          requires_all: requiresAll, requires_optional: requiresOptional, excludes,
        })
      }}
      className="space-y-2 p-2 border rounded-md bg-muted/30"
    >
      <Input
        className="h-7 text-xs"
        placeholder="Назва"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        className="h-7 text-xs"
        placeholder="Опис"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-1">
        <Input
          className="h-7 text-xs"
          type="number" min={0} step={0.01}
          placeholder="Ціна"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Input
          className="h-7 text-xs"
          type="number"
          placeholder="Пріоритет"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
      </div>
      <AttributeMultiSelect label="Requires All" selectedIds={requiresAll} onChange={setRequiresAll} />
      <AttributeMultiSelect label="Requires Optional" selectedIds={requiresOptional} onChange={setRequiresOptional} />
      <AttributeMultiSelect label="Excludes" selectedIds={excludes} onChange={setExcludes} />
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-6 flex-1 text-[11px]" disabled={isSaving}>
          <Check className="h-3 w-3 mr-1" />
          {isSaving ? '...' : 'Зберегти'}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px]" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </form>
  )
}

function OfferItem({ offer }: { offer: OfferResponse }) {
  const [editing, setEditing] = useState(false)
  const updateOffer = useUpdateOffer()
  const deleteOffer = useDeleteOffer()

  if (editing) {
    return (
      <OfferForm
        initial={offer}
        onSave={(data) => updateOffer.mutate({ id: offer.id, data }, { onSuccess: () => setEditing(false) })}
        onCancel={() => setEditing(false)}
        isSaving={updateOffer.isPending}
      />
    )
  }

  return (
    <div className="group flex items-start gap-1 rounded px-2 py-1 hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{offer.name}</p>
        {offer.description && (
          <p className="text-[10px] text-muted-foreground truncate">{offer.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground">${offer.price} · p{offer.priority}</p>
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditing(true)}>
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost" size="icon" className="h-5 w-5 hover:text-destructive"
          onClick={() => deleteOffer.mutate(offer.id)}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Combined panel ──────────────────────────────────────────

export function RightPanel() {
  const [collapsed, setCollapsed] = useState(false)

  // Attributes state
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
  const handleAddKey = () => {
    if (newKey.trim() && newFirstValue.trim()) {
      createAttribute.mutate({ name: `${newKey.trim()}-${newFirstValue.trim()}` })
      setNewKey(''); setNewFirstValue(''); setAddingKey(false)
    }
  }

  // Offers state
  const [creatingOffer, setCreatingOffer] = useState(false)
  const { data: offersData } = useOffers({ limit: 200 })
  const offers = offersData?.items ?? []
  const createOffer = useCreateOffer()

  return (
    <div
      className={cn(
        'relative flex flex-col border-l bg-background transition-[width] duration-200',
        collapsed ? 'w-12' : 'w-72',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold"
            >
              Панель
            </motion.span>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed && (
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* ── Attributes ── */}
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-3 py-1.5 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Атрибути
              </span>
              <Button
                variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => setAddingKey(!addingKey)}
                title="Додати групу атрибутів"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {addingKey && (
              <div className="px-2 pb-2 space-y-1 shrink-0">
                <Input
                  className="h-6 text-xs"
                  placeholder="Ключ (наприклад age)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setAddingKey(false); setNewKey(''); setNewFirstValue('') }
                  }}
                  autoFocus
                />
                <Input
                  className="h-6 text-xs"
                  placeholder="Перше значення (наприклад 11-20)"
                  value={newFirstValue}
                  onChange={(e) => setNewFirstValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddKey()
                    if (e.key === 'Escape') { setAddingKey(false); setNewKey(''); setNewFirstValue('') }
                  }}
                />
                <div className="flex gap-1">
                  <Button variant="default" size="sm" className="h-5 flex-1 text-[11px]" onClick={handleAddKey}>
                    Додати
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-5 text-[11px]"
                    onClick={() => { setAddingKey(false); setNewKey(''); setNewFirstValue('') }}
                  >
                    Скасувати
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-y-auto flex-1 p-1 space-y-1">
              {Array.from(grouped.entries()).map(([key, items]) => (
                <AttributeGroup
                  key={key}
                  groupKey={key}
                  items={items}
                  onAddValue={handleAddValue}
                  onRemove={(id) => deleteAttribute.mutate(id)}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Offers ── */}
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-3 py-1.5 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Офери
              </span>
              <Button
                variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => setCreatingOffer(true)}
                title="Додати офер"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 p-1 space-y-1">
              {creatingOffer && (
                <OfferForm
                  onSave={(data) => createOffer.mutate(data, { onSuccess: () => setCreatingOffer(false) })}
                  onCancel={() => setCreatingOffer(false)}
                  isSaving={createOffer.isPending}
                />
              )}
              {offers.length === 0 && !creatingOffer && (
                <p className="text-xs text-muted-foreground text-center py-4">Немає офферів</p>
              )}
              {offers.map((offer) => (
                <OfferItem key={offer.id} offer={offer} />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

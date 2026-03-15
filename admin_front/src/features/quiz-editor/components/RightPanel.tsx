import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  ChevronLeft, ChevronRight, Plus, Trash2, GripVertical,
  Pencil, Check, X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAttributes, useCreateAttribute, useDeleteAttribute } from '@/hooks/use-attributes'
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from '@/hooks/use-offers'
import { AttributeBadge } from './AttributeBadge'
import { useDraggable } from '@dnd-kit/core'
import type { AttributeResponse, OfferResponse } from '@/types/api'

// ─── Attributes section ──────────────────────────────────────

function DraggableAttribute({ attribute, onRemove }: { attribute: AttributeResponse; onRemove: (id: number) => void }) {
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
      <span className="flex-1 truncate text-muted-foreground">{attribute.name}</span>
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

// ─── Offer form drop zone ─────────────────────────────────────

// Registry: maps droppable zone ID → setter fn, so DndContext can call it on drop
export const offerFieldRegistry = new Map<string, (id: number) => void>()

function DroppableAttributeField({
  zoneId,
  label,
  selectedIds,
  onChange,
}: {
  zoneId: string
  label: string
  selectedIds: number[]
  onChange: (ids: number[]) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: zoneId,
    data: { type: 'offer-field', zoneId },
  })

  // Register setter so DndContext can push into this field
  offerFieldRegistry.set(zoneId, (attrId: number) => {
    if (!selectedIds.includes(attrId)) {
      onChange([...selectedIds, attrId])
    }
  })

  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-wrap gap-1 min-h-[28px] rounded border p-1 transition-colors',
          isOver ? 'border-primary bg-primary/5' : 'border-input',
        )}
      >
        {selectedIds.map((id) => (
          <AttributeBadge
            key={id}
            attributeId={id}
            showKey
            onRemove={() => onChange(selectedIds.filter((x) => x !== id))}
          />
        ))}
        {selectedIds.length === 0 && (
          <span className="text-[10px] text-muted-foreground/50 self-center px-1">
            перетягніть атрибут сюди
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Offer form ───────────────────────────────────────────────

interface OfferFormData {
  name: string; description: string; price: number; priority: number
  default: boolean
  wellness_kit_name: string; wellness_kit_image_url: string; wellness_kit_description: string
  requires_all: number[]; requires_optional: number[]; excludes: number[]
}

function OfferForm({
  formId,
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  formId: string
  initial?: OfferResponse
  onSave: (data: OfferFormData) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '')
  const [priority, setPriority] = useState(initial?.priority != null ? String(initial.priority) : '')
  const [isDefault, setIsDefault] = useState(initial?.default ?? false)
  const [wkName, setWkName] = useState(initial?.wellness_kit_name ?? '')
  const [wkImageUrl, setWkImageUrl] = useState(initial?.wellness_kit_image_url ?? '')
  const [wkDescription, setWkDescription] = useState(initial?.wellness_kit_description ?? '')
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
          default: isDefault,
          wellness_kit_name: wkName.trim(),
          wellness_kit_image_url: wkImageUrl.trim(),
          wellness_kit_description: wkDescription.trim(),
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
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-3.5 w-3.5 rounded"
        />
        За замовчуванням
      </label>

      <Separator />
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Wellness Kit</Label>
      <Input
        className="h-7 text-xs"
        placeholder="Назва кіту"
        value={wkName}
        onChange={(e) => setWkName(e.target.value)}
      />
      <Input
        className="h-7 text-xs"
        placeholder="URL зображення"
        value={wkImageUrl}
        onChange={(e) => setWkImageUrl(e.target.value)}
      />
      <Input
        className="h-7 text-xs"
        placeholder="Опис кіту"
        value={wkDescription}
        onChange={(e) => setWkDescription(e.target.value)}
      />

      <Separator />
      <DroppableAttributeField
        zoneId={`${formId}-requires_all`}
        label="Requires All"
        selectedIds={requiresAll}
        onChange={setRequiresAll}
      />
      <DroppableAttributeField
        zoneId={`${formId}-requires_optional`}
        label="Requires Optional"
        selectedIds={requiresOptional}
        onChange={setRequiresOptional}
      />
      <DroppableAttributeField
        zoneId={`${formId}-excludes`}
        label="Excludes"
        selectedIds={excludes}
        onChange={setExcludes}
      />
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

// ─── Offer item ───────────────────────────────────────────────

function OfferItem({ offer }: { offer: OfferResponse }) {
  const [editing, setEditing] = useState(false)
  const updateOffer = useUpdateOffer()
  const deleteOffer = useDeleteOffer()

  if (editing) {
    return (
      <OfferForm
        formId={`edit-${offer.id}`}
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

// ─── Combined panel ───────────────────────────────────────────

export function RightPanel() {
  const [collapsed, setCollapsed] = useState(false)

  // Attributes
  const [addingAttr, setAddingAttr] = useState(false)
  const [newAttrName, setNewAttrName] = useState('')
  const { data: attributesData } = useAttributes({ limit: 200 })
  const attributes = attributesData?.items ?? []
  const createAttribute = useCreateAttribute()
  const deleteAttribute = useDeleteAttribute()

  const handleAddAttribute = () => {
    const trimmed = newAttrName.trim()
    if (!trimmed) return
    createAttribute.mutate({ name: trimmed })
    setNewAttrName('')
    setAddingAttr(false)
  }

  // Offers
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
                onClick={() => setAddingAttr(!addingAttr)}
                title="Додати атрибут"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {addingAttr && (
              <div className="px-2 pb-2 flex gap-1 shrink-0">
                <Input
                  className="h-6 text-xs flex-1"
                  placeholder="наприклад age-18-25"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddAttribute()
                    if (e.key === 'Escape') { setAddingAttr(false); setNewAttrName('') }
                  }}
                  autoFocus
                />
                <Button variant="default" size="icon" className="h-6 w-6 shrink-0" onClick={handleAddAttribute}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                  onClick={() => { setAddingAttr(false); setNewAttrName('') }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
              {attributes.map((attr) => (
                <DraggableAttribute
                  key={attr.id}
                  attribute={attr}
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
                  formId="create"
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

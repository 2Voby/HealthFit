import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from '@/hooks/use-offers'
import { useAttributes } from '@/hooks/use-attributes'
import { AttributeBadge } from './AttributeBadge'
import { parseAttributeName } from '../store/attributes.store'
import type { OfferResponse } from '@/types/api'

function AttributeSelector({
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
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1 min-h-[24px] rounded border p-1">
        {selectedIds.map((id) => (
          <AttributeBadge
            key={id}
            attributeId={id}
            showKey
            onRemove={() => toggle(id)}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {attributes
          .filter((a) => !selectedIds.includes(a.id))
          .map((a) => {
            const { key, value } = parseAttributeName(a.name)
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-dashed hover:bg-accent transition-colors"
                title={`${key}: ${value}`}
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
    name: string
    description: string
    price: number
    priority: number
    requires_all: number[]
    requires_optional: number[]
    excludes: number[]
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      priority: parseInt(priority) || 0,
      requires_all: requiresAll,
      requires_optional: requiresOptional,
      excludes,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3">
      <div className="space-y-1">
        <Label className="text-xs">Назва</Label>
        <Input
          className="h-7 text-xs"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Назва оферу"
          required
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Опис</Label>
        <Input
          className="h-7 text-xs"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Короткий опис"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Ціна</Label>
          <Input
            className="h-7 text-xs"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Пріоритет</Label>
          <Input
            className="h-7 text-xs"
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>
      </div>
      <AttributeSelector
        label="Requires All"
        selectedIds={requiresAll}
        onChange={setRequiresAll}
      />
      <AttributeSelector
        label="Requires Optional"
        selectedIds={requiresOptional}
        onChange={setRequiresOptional}
      />
      <AttributeSelector
        label="Excludes"
        selectedIds={excludes}
        onChange={setExcludes}
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="h-7 flex-1 text-xs" disabled={isSaving}>
          <Check className="h-3 w-3 mr-1" />
          {isSaving ? 'Збереження...' : 'Зберегти'}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
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
      <div className="border rounded-md mb-1 bg-muted/30">
        <OfferForm
          initial={offer}
          onSave={(data) =>
            updateOffer.mutate(
              { id: offer.id, data },
              { onSuccess: () => setEditing(false) },
            )
          }
          onCancel={() => setEditing(false)}
          isSaving={updateOffer.isPending}
        />
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-1 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{offer.name}</p>
        {offer.description && (
          <p className="text-[10px] text-muted-foreground truncate">{offer.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground">${offer.price} · prior: {offer.priority}</p>
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:text-destructive"
          onClick={() => deleteOffer.mutate(offer.id)}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  )
}

export function OffersPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [creating, setCreating] = useState(false)
  const { data } = useOffers({ limit: 200 })
  const offers = data?.items ?? []
  const createOffer = useCreateOffer()

  return (
    <div
      className={cn(
        'relative flex flex-col border-l bg-background transition-[width] duration-200',
        collapsed ? 'w-12' : 'w-64',
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
              Офери
            </motion.span>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1">
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setCreating(true)}
              title="Додати офер"
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

      {!collapsed && (
        <ScrollArea className="flex-1">
          <div className="p-1">
            {creating && (
              <div className="border rounded-md mb-2 bg-muted/30">
                <OfferForm
                  onSave={(data) =>
                    createOffer.mutate(data, { onSuccess: () => setCreating(false) })
                  }
                  onCancel={() => setCreating(false)}
                  isSaving={createOffer.isPending}
                />
              </div>
            )}
            {offers.length === 0 && !creating && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Немає офферів
              </p>
            )}
            {offers.map((offer) => (
              <OfferItem key={offer.id} offer={offer} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

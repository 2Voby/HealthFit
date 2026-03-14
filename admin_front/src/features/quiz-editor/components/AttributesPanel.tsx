import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, GripVertical, Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAttributesStore } from '../store/attributes.store'
import type { AttributeResponse } from '@/types/api'

function DraggableAttribute({ attribute }: { attribute: AttributeResponse }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `attr-${attribute.id}`,
    data: { type: 'attribute', attributeId: attribute.id },
  })
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(attribute.name)
  const updateAttribute = useAttributesStore((s) => s.updateAttribute)
  const removeAttribute = useAttributesStore((s) => s.removeAttribute)

  const handleSave = () => {
    if (editName.trim()) {
      updateAttribute(attribute.id, editName.trim())
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1">
        <Input
          className="h-6 text-xs flex-1"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setEditing(false)
          }}
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleSave}>
          <Check className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditing(false)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
        'hover:bg-accent cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/50" />
      <span className="flex-1 truncate">{attribute.name}</span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation()
            setEditName(attribute.name)
            setEditing(true)
          }}
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            removeAttribute(attribute.id)
          }}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  )
}

export function AttributesPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const attributes = useAttributesStore((s) => s.attributes)
  const addAttribute = useAttributesStore((s) => s.addAttribute)

  const handleAdd = () => {
    if (newName.trim()) {
      addAttribute(newName.trim())
      setNewName('')
      setAdding(false)
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-col border-l bg-background transition-[width] duration-200',
        collapsed ? 'w-12' : 'w-56',
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
              onClick={() => setAdding(!adding)}
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

      {!collapsed && adding && (
        <div className="px-2 py-2 space-y-1">
          <Input
            className="h-7 text-xs"
            placeholder="Attribute name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
            autoFocus
          />
          <div className="flex gap-1">
            <Button variant="default" size="sm" className="h-6 flex-1 text-xs" onClick={handleAdd}>
              Add
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setAdding(false); setNewName('') }}>
              Cancel
            </Button>
          </div>
          <Separator />
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-1 space-y-0.5">
          {!collapsed && attributes.map((attr) => (
            <DraggableAttribute key={attr.id} attribute={attr} />
          ))}
          {collapsed && (
            <div className="flex flex-col items-center gap-1 pt-1">
              {attributes.slice(0, 8).map((attr) => (
                <span
                  key={attr.id}
                  className="text-[9px] text-muted-foreground truncate w-8 text-center"
                  title={attr.name}
                >
                  {attr.name.slice(0, 3)}
                </span>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

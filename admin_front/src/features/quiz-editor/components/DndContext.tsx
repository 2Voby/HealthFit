import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { useEditorStore } from '../store/editor.store'
import { parseAttributeName } from '../store/attributes.store'
import { useQueryClient } from '@tanstack/react-query'
import type { AttributesListResponse } from '@/types/api'

interface DragData {
  type: 'attribute'
  attributeId: number
}

interface DropAnswerData {
  type: 'answer-attributes'
  nodeId: string
  answerId: string
}

interface DropOfferZoneData {
  type: 'offer-zone'
  nodeId: string
  zone: 'requires_all' | 'requires_optional' | 'excludes'
}

type DropData = DropAnswerData | DropOfferZoneData

export function DndContextWrapper({ children }: { children: React.ReactNode }) {
  const [activeAttribute, setActiveAttribute] = useState<{ id: number; name: string } | null>(null)
  const qc = useQueryClient()

  const getAttributeName = (id: number): string => {
    // Read from the TanStack Query cache
    const cached = qc.getQueryData<AttributesListResponse>(['attributes', 'list', { limit: 200 }])
    const attr = cached?.items.find((a) => a.id === id)
    if (!attr) return String(id)
    const { key, value } = parseAttributeName(attr.name)
    return `${key}: ${value}`
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined
    if (data?.type === 'attribute') {
      setActiveAttribute({ id: data.attributeId, name: getAttributeName(data.attributeId) })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveAttribute(null)

    const { active, over } = event
    if (!over) return

    const dragData = active.data.current as DragData | undefined
    const dropData = over.data.current as DropData | undefined

    if (dragData?.type !== 'attribute' || !dropData) return

    const attrId = dragData.attributeId
    const store = useEditorStore.getState()

    if (dropData.type === 'answer-attributes') {
      const node = store.nodes.find((n) => n.id === dropData.nodeId)
      if (node?.data.kind !== 'question') return
      const answer = node.data.answers.find((a) => a.id === dropData.answerId)
      if (!answer || answer.attributes.includes(attrId)) return
      store.updateAnswer(dropData.nodeId, dropData.answerId, {
        attributes: [...answer.attributes, attrId],
      })
    } else if (dropData.type === 'offer-zone') {
      const node = store.nodes.find((n) => n.id === dropData.nodeId)
      if (node?.data.kind !== 'offer') return
      const currentArray = node.data[dropData.zone] as number[]
      if (currentArray.includes(attrId)) return
      store.updateNodeData(dropData.nodeId, {
        [dropData.zone]: [...currentArray, attrId],
      })
    }
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay>
        {activeAttribute && (
          <Badge
            variant="secondary"
            className="text-xs shadow-lg cursor-grabbing"
          >
            {activeAttribute.name}
          </Badge>
        )}
      </DragOverlay>
    </DndContext>
  )
}

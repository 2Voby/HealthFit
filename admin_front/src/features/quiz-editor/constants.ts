import { HelpCircle, FileText, Gift, type LucideIcon } from 'lucide-react'
import type { NodeKind, QuizNodeData, QuestionType, FlowTransitionConditionType } from './types'
import type { AttributeResponse, OfferResponse } from '@/types/api'

interface NodeKindMeta {
  kind: NodeKind
  label: string
  icon: LucideIcon
  color: string
  defaultData: QuizNodeData
}

export const NODE_KINDS: NodeKindMeta[] = [
  {
    kind: 'question',
    label: 'Question',
    icon: HelpCircle,
    color: 'border-blue-500',
    defaultData: {
      kind: 'question',
      text: 'New question',
      questionType: 'single_choice',
      requires: false,
      answers: [
        { id: crypto.randomUUID(), text: 'Option 1', attributes: [] },
        { id: crypto.randomUUID(), text: 'Option 2', attributes: [] },
      ],
    },
  },
  {
    kind: 'info_page',
    label: 'Info Page',
    icon: FileText,
    color: 'border-green-500',
    defaultData: {
      kind: 'info_page',
      title: 'Info page',
      message: 'Your motivational message here...',
    },
  },
  {
    kind: 'offer',
    label: 'Offer',
    icon: Gift,
    color: 'border-amber-500',
    defaultData: {
      kind: 'offer',
      offerId: '',
      label: 'New offer',
      requires_all: [],
      requires_optional: [],
      excludes: [],
    },
  },
]

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multi_choice', label: 'Multi Choice' },
  { value: 'input_number', label: 'Number Input' },
  { value: 'input_text', label: 'Text Input' },
]

export const TRANSITION_CONDITION_TYPES: { value: FlowTransitionConditionType; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'answer_any', label: 'Any answer' },
  { value: 'answer_all', label: 'All answers' },
]

const ts = '2025-01-01T00:00:00Z'

export const MOCK_ATTRIBUTES: AttributeResponse[] = [
  { id: 1, name: 'age', created_at: ts, updated_at: ts },
  { id: 2, name: 'gender', created_at: ts, updated_at: ts },
  { id: 3, name: 'goal', created_at: ts, updated_at: ts },
  { id: 4, name: 'context', created_at: ts, updated_at: ts },
  { id: 5, name: 'constraints', created_at: ts, updated_at: ts },
  { id: 6, name: 'level', created_at: ts, updated_at: ts },
  { id: 7, name: 'motivation', created_at: ts, updated_at: ts },
  { id: 8, name: 'preferences', created_at: ts, updated_at: ts },
  { id: 9, name: 'wellbeing', created_at: ts, updated_at: ts },
]

export const MOCK_OFFERS: OfferResponse[] = [
  { id: 1, name: 'Weight Loss Starter', description: '4-week home fat-burn plan (20–30 min)', price: 29.99, requires_all: [3], requires_optional: [1, 4], excludes: [], priority: 10, created_at: ts, updated_at: ts },
  { id: 2, name: 'Lean Strength Builder', description: 'Gym strength + progression program', price: 39.99, requires_all: [3, 4], requires_optional: [6], excludes: [], priority: 8, created_at: ts, updated_at: ts },
  { id: 3, name: 'Low-Impact Fat Burn', description: 'Joint-friendly plan (knees/back safe)', price: 24.99, requires_all: [3], requires_optional: [5], excludes: [], priority: 7, created_at: ts, updated_at: ts },
  { id: 4, name: 'Run Your First 5K', description: 'Outdoor running program (3x/week)', price: 19.99, requires_all: [4], requires_optional: [6], excludes: [5], priority: 6, created_at: ts, updated_at: ts },
  { id: 5, name: 'Yoga & Mobility', description: 'Flexibility + posture (10–25 min)', price: 22.99, requires_all: [], requires_optional: [3, 9], excludes: [], priority: 5, created_at: ts, updated_at: ts },
  { id: 6, name: 'Stress Reset', description: 'Breathing, meditation & anti-stress routines', price: 17.99, requires_all: [9], requires_optional: [7], excludes: [], priority: 4, created_at: ts, updated_at: ts },
  { id: 7, name: 'Quick Fit Micro-Workouts', description: 'Daily 10–15 min workouts', price: 14.99, requires_all: [], requires_optional: [4, 7], excludes: [], priority: 3, created_at: ts, updated_at: ts },
]

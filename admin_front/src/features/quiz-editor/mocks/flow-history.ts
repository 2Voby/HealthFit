import type { FlowHistoryEntryResponse } from '@/types/api'

const ts = '2025-01-15T10:00:00Z'

export const MOCK_FLOW_HISTORY: Record<number, FlowHistoryEntryResponse[]> = {
  1: [
    {
      id: 1,
      flow_id: 1,
      revision: 1,
      action: 'create',
      source_revision: null,
      changed_by_user_id: 1,
      snapshot: {
        name: 'Wellness Journey Quiz',
        is_active: false,
        question_ids: [1],
        transitions: [],
      },
      created_at: ts,
      updated_at: ts,
    },
    {
      id: 2,
      flow_id: 1,
      revision: 2,
      action: 'update',
      source_revision: null,
      changed_by_user_id: 1,
      snapshot: {
        name: 'Wellness Journey Quiz',
        is_active: false,
        question_ids: [1, 2],
        transitions: [
          { from_question_id: 1, to_question_id: 2, condition_type: 'answer_any', answer_ids: [1], priority: 100 },
        ],
      },
      created_at: '2025-01-16T09:00:00Z',
      updated_at: '2025-01-16T09:00:00Z',
    },
    {
      id: 3,
      flow_id: 1,
      revision: 3,
      action: 'update',
      source_revision: null,
      changed_by_user_id: 1,
      snapshot: {
        name: 'Wellness Journey Quiz',
        is_active: true,
        question_ids: [1, 2, 3],
        transitions: [
          { from_question_id: 1, to_question_id: 2, condition_type: 'answer_any', answer_ids: [1], priority: 100 },
          { from_question_id: 1, to_question_id: 3, condition_type: 'answer_any', answer_ids: [2, 3], priority: 90 },
          { from_question_id: 2, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100 },
          { from_question_id: 3, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100 },
        ],
      },
      created_at: '2025-01-17T11:30:00Z',
      updated_at: '2025-01-17T11:30:00Z',
    },
    {
      id: 4,
      flow_id: 1,
      revision: 4,
      action: 'dependency_update',
      source_revision: null,
      changed_by_user_id: null,
      snapshot: {
        name: 'Wellness Journey Quiz',
        is_active: true,
        question_ids: [1, 2, 3],
        transitions: [
          { from_question_id: 1, to_question_id: 2, condition_type: 'answer_any', answer_ids: [1], priority: 100 },
          { from_question_id: 1, to_question_id: 3, condition_type: 'answer_any', answer_ids: [2, 3], priority: 90 },
          { from_question_id: 2, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100 },
          { from_question_id: 3, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100 },
        ],
      },
      created_at: '2025-01-20T08:00:00Z',
      updated_at: '2025-01-20T08:00:00Z',
    },
  ],
  2: [
    {
      id: 10,
      flow_id: 2,
      revision: 1,
      action: 'create',
      source_revision: null,
      changed_by_user_id: 1,
      snapshot: {
        name: 'Fitness Assessment',
        is_active: false,
        question_ids: [10, 11],
        transitions: [
          { from_question_id: 10, to_question_id: 11, condition_type: 'always', answer_ids: [], priority: 100 },
          { from_question_id: 11, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100 },
        ],
      },
      created_at: '2025-02-01T14:30:00Z',
      updated_at: '2025-02-01T14:30:00Z',
    },
  ],
  3: [
    {
      id: 20,
      flow_id: 3,
      revision: 1,
      action: 'create',
      source_revision: null,
      changed_by_user_id: 1,
      snapshot: {
        name: 'Nutrition Survey',
        is_active: false,
        question_ids: [30],
        transitions: [
          { from_question_id: 30, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100 },
        ],
      },
      created_at: '2025-02-01T14:30:00Z',
      updated_at: '2025-02-01T14:30:00Z',
    },
  ],
}

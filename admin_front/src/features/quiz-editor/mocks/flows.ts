import type { FlowResponse } from '@/types/api'

const ts = '2025-01-15T10:00:00Z'
const ts2 = '2025-02-01T14:30:00Z'

export const MOCK_FLOWS: FlowResponse[] = [
  {
    id: 1,
    name: 'Wellness Journey Quiz',
    is_active: true,
    start_question_id: 1,
    questions: [
      {
        question_id: 1,
        position: 0,
        question: {
          id: 1,
          text: 'What is your main goal?',
          type: 'singe_choise',
          requires: true,
          answers: [
            { id: 1, text: 'Weight loss', attributes: [7], created_at: ts, updated_at: ts },
            { id: 2, text: 'Build strength', attributes: [8], created_at: ts, updated_at: ts },
            { id: 3, text: 'Flexibility', attributes: [9], created_at: ts, updated_at: ts },
          ],
          created_at: ts,
          updated_at: ts,
        },
      },
      {
        question_id: 2,
        position: 1,
        question: {
          id: 2,
          text: 'Where do you prefer to exercise?',
          type: 'singe_choise',
          requires: false,
          answers: [
            { id: 4, text: 'At home', attributes: [11], created_at: ts, updated_at: ts },
            { id: 5, text: 'At the gym', attributes: [12], created_at: ts, updated_at: ts },
          ],
          created_at: ts,
          updated_at: ts,
        },
      },
      {
        question_id: 3,
        position: 2,
        question: {
          id: 3,
          text: 'How often do you exercise per week?',
          type: 'singe_choise',
          requires: true,
          answers: [
            { id: 6, text: '1-2 times', attributes: [14], created_at: ts, updated_at: ts },
            { id: 7, text: '3-4 times', attributes: [15], created_at: ts, updated_at: ts },
            { id: 8, text: '5+ times', attributes: [16], created_at: ts, updated_at: ts },
          ],
          created_at: ts,
          updated_at: ts,
        },
      },
    ],
    transitions: [
      { id: 1, from_question_id: 1, to_question_id: 2, condition_type: 'answer_any', answer_ids: [1], priority: 100, created_at: ts, updated_at: ts },
      { id: 2, from_question_id: 1, to_question_id: 3, condition_type: 'answer_any', answer_ids: [2, 3], priority: 90, created_at: ts, updated_at: ts },
      { id: 3, from_question_id: 2, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100, created_at: ts, updated_at: ts },
      { id: 4, from_question_id: 3, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100, created_at: ts, updated_at: ts },
    ],
    created_at: ts,
    updated_at: ts,
  },
  {
    id: 2,
    name: 'Fitness Assessment',
    is_active: false,
    start_question_id: 10,
    questions: [
      {
        question_id: 10,
        position: 0,
        question: {
          id: 10,
          text: 'What is your current fitness level?',
          type: 'singe_choise',
          requires: true,
          answers: [
            { id: 20, text: 'Beginner', attributes: [14], created_at: ts2, updated_at: ts2 },
            { id: 21, text: 'Intermediate', attributes: [15], created_at: ts2, updated_at: ts2 },
            { id: 22, text: 'Advanced', attributes: [16], created_at: ts2, updated_at: ts2 },
          ],
          created_at: ts2,
          updated_at: ts2,
        },
      },
      {
        question_id: 11,
        position: 1,
        question: {
          id: 11,
          text: 'Do you have any health constraints?',
          type: 'multiple_choise',
          requires: false,
          answers: [
            { id: 23, text: 'Knee issues', attributes: [17], created_at: ts2, updated_at: ts2 },
            { id: 24, text: 'Back pain', attributes: [18], created_at: ts2, updated_at: ts2 },
            { id: 25, text: 'None', attributes: [19], created_at: ts2, updated_at: ts2 },
          ],
          created_at: ts2,
          updated_at: ts2,
        },
      },
    ],
    transitions: [
      { id: 10, from_question_id: 10, to_question_id: 11, condition_type: 'always', answer_ids: [], priority: 100, created_at: ts2, updated_at: ts2 },
      { id: 11, from_question_id: 11, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100, created_at: ts2, updated_at: ts2 },
    ],
    created_at: ts2,
    updated_at: ts2,
  },
  {
    id: 3,
    name: 'Nutrition Survey',
    is_active: false,
    start_question_id: 30,
    questions: [
      {
        question_id: 30,
        position: 0,
        question: {
          id: 30,
          text: 'What are your dietary preferences?',
          type: 'multiple_choise',
          requires: true,
          answers: [
            { id: 40, text: 'Vegetarian', attributes: [], created_at: ts2, updated_at: ts2 },
            { id: 41, text: 'Vegan', attributes: [], created_at: ts2, updated_at: ts2 },
            { id: 42, text: 'No restrictions', attributes: [], created_at: ts2, updated_at: ts2 },
          ],
          created_at: ts2,
          updated_at: ts2,
        },
      },
    ],
    transitions: [
      { id: 20, from_question_id: 30, to_question_id: null, condition_type: 'always', answer_ids: [], priority: 100, created_at: ts2, updated_at: ts2 },
    ],
    created_at: ts2,
    updated_at: ts2,
  },
]

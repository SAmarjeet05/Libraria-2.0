import { Note } from '../types';

export const mockNotes: Note[] = [
  {
    id: '1',
    title: 'React Performance Optimization',
    content: 'Key strategies for optimizing React applications: use React.memo, useMemo, useCallback, and proper component structure.',
    category: 'Development',
    tags: ['react', 'performance', 'optimization'],
    createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Meeting Notes - Q4 Planning',
    content: 'Discussed upcoming features, resource allocation, and timeline for Q4 deliverables.',
    category: 'Meetings',
    tags: ['planning', 'q4', 'team'],
    createdAt: '2024-12-14T14:15:00Z',
    updatedAt: '2024-12-14T14:15:00Z'
  },
  {
    id: '3',
    title: 'UX Design Principles',
    content: 'Core principles: consistency, feedback, affordances, and user control. Always consider accessibility.',
    category: 'Design',
    tags: ['ux', 'design', 'principles'],
    createdAt: '2024-12-13T09:20:00Z',
    updatedAt: '2024-12-13T09:20:00Z'
  }
];
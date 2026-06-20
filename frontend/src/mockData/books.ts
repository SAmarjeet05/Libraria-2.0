import { Book } from '../types';

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Art of Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Technology',
    status: 'Available'
  },
  {
    id: '2',
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '978-0735211292',
    category: 'Self-Help',
    status: 'Issued',
    issuedTo: 'john.doe@example.com',
    dueDate: '2025-01-15'
  },
  {
    id: '3',
    title: 'The Psychology of Computer Programming',
    author: 'Gerald M. Weinberg',
    isbn: '978-0932633422',
    category: 'Technology',
    status: 'Available'
  },
  {
    id: '4',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    isbn: '978-0374533557',
    category: 'Psychology',
    status: 'Reserved'
  },
  {
    id: '5',
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    isbn: '978-0465050659',
    category: 'Design',
    status: 'Available'
  }
];
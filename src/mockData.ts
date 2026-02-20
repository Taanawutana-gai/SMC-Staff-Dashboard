import { StaffMember, Task, Announcement } from './types';

export const MOCK_STAFF: StaffMember[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    role: 'Department Head',
    department: 'Computer Science',
    email: 'chen.s@smc.edu',
    status: 'active',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    lastActive: 'Now',
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    role: 'Senior Administrator',
    department: 'Operations',
    email: 'rodriguez.m@smc.edu',
    status: 'remote',
    avatar: 'https://picsum.photos/seed/marcus/100/100',
    lastActive: '10m ago',
  },
  {
    id: '3',
    name: 'Elena Gilbert',
    role: 'Student Coordinator',
    department: 'Admissions',
    email: 'gilbert.e@smc.edu',
    status: 'on-leave',
    avatar: 'https://picsum.photos/seed/elena/100/100',
    lastActive: '2d ago',
  },
  {
    id: '4',
    name: 'James Wilson',
    role: 'IT Specialist',
    department: 'Technology',
    email: 'wilson.j@smc.edu',
    status: 'active',
    avatar: 'https://picsum.photos/seed/james/100/100',
    lastActive: 'Now',
  },
  {
    id: '5',
    name: 'Aisha Khan',
    role: 'Faculty Liaison',
    department: 'Academic Affairs',
    email: 'khan.a@smc.edu',
    status: 'offline',
    avatar: 'https://picsum.photos/seed/aisha/100/100',
    lastActive: '1h ago',
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Review Q1 Budget Proposals',
    priority: 'high',
    status: 'in-progress',
    assigneeId: '1',
    dueDate: '2024-03-25',
  },
  {
    id: 't2',
    title: 'Update Staff Handbook',
    priority: 'medium',
    status: 'todo',
    assigneeId: '2',
    dueDate: '2024-04-01',
  },
  {
    id: 't3',
    title: 'Schedule Faculty Meeting',
    priority: 'low',
    status: 'completed',
    assigneeId: '4',
    dueDate: '2024-03-20',
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: 'Campus-wide Network Maintenance',
    content: 'Expect intermittent connectivity issues this Saturday between 8 AM and 12 PM.',
    date: '2024-03-22',
    author: 'IT Department',
    category: 'urgent',
  },
  {
    id: 'a2',
    title: 'Spring Faculty Mixer',
    content: 'Join us for refreshments and networking at the Student Union garden.',
    date: '2024-03-28',
    author: 'Events Committee',
    category: 'event',
  },
];

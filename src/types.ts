export type StaffStatus = 'active' | 'on-leave' | 'remote' | 'offline';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  status: StaffStatus;
  avatar: string;
  lastActive: string;
}

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  assigneeId: string;
  dueDate: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: 'urgent' | 'general' | 'event';
}

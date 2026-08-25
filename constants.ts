import { DayOfWeek, Category, ScheduleEvent, WeeklyHabit, WeeklyGoal, MonthlyEvent, MonthlyGoal } from './types';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const CATEGORIES: { value: Category; label: string; color: string; bgClass: string; textClass: string; borderClass: string }[] = [
  {
    value: 'work',
    label: 'Work',
    color: '#6366f1', // Indigo
    bgClass: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-400'
  },
  {
    value: 'health',
    label: 'Health & Fitness',
    color: '#10b981', // Emerald
    bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-400'
  },
  {
    value: 'personal',
    label: 'Personal Admin',
    color: '#f59e0b', // Amber
    bgClass: 'bg-amber-50 border-amber-200 text-amber-700',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-400'
  },
  {
    value: 'leisure',
    label: 'Leisure & Fun',
    color: '#f43f5e', // Rose
    bgClass: 'bg-rose-50 border-rose-200 text-rose-700',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-400'
  },
  {
    value: 'study',
    label: 'Study & Learning',
    color: '#0ea5e9', // Sky
    bgClass: 'bg-sky-50 border-sky-200 text-sky-700',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-400'
  },
  {
    value: 'focus',
    label: 'Deep Focus',
    color: '#8b5cf6', // Violet
    bgClass: 'bg-violet-50 border-violet-200 text-violet-700',
    textClass: 'text-violet-700',
    borderClass: 'border-violet-400'
  }
];

export const DEFAULT_GOALS: WeeklyGoal[] = [
  { id: 'g1', title: 'Complete weekly planning and set daily focus sessions', completed: true },
  { id: 'g2', title: 'Exercise at least 4 times for 45+ minutes', completed: false },
  { id: 'g3', title: 'Read 50 pages of my current book', completed: false }
];

export const DEFAULT_HABITS: WeeklyHabit[] = [
  { id: 'h1', name: 'Drink 3L of water', daysCompleted: ['Monday', 'Tuesday'] },
  { id: 'h2', name: '8 Hours Sleep', daysCompleted: ['Monday'] },
  { id: 'h3', name: 'No Social Media before 12 PM', daysCompleted: ['Monday', 'Tuesday'] },
  { id: 'h4', name: '10 Minutes Stretching', daysCompleted: ['Tuesday'] }
];

export const INITIAL_EVENTS: ScheduleEvent[] = [
  // Monday
  {
    id: 'e1',
    title: 'Weekly Standup & Kickoff',
    description: 'Review project status and align team priorities for the week.',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    category: 'work',
    priority: 'high',
    completed: true
  },
  {
    id: 'e2',
    title: 'Deep Work: Feature Coding',
    description: 'Implement key UI sections of the application.',
    day: 'Monday',
    startTime: '10:30',
    endTime: '12:30',
    category: 'focus',
    priority: 'high',
    completed: true
  },
  {
    id: 'e3',
    title: 'Gym Session (Upper Body)',
    description: 'Strength training and a quick 15-minute cardio finisher.',
    day: 'Monday',
    startTime: '17:30',
    endTime: '19:00',
    category: 'health',
    priority: 'medium',
    completed: true
  },
  
  // Tuesday
  {
    id: 'e4',
    title: 'Product Review Call',
    description: 'Walk through designs with the stakeholders.',
    day: 'Tuesday',
    startTime: '11:00',
    endTime: '12:00',
    category: 'work',
    priority: 'medium',
    completed: false
  },
  {
    id: 'e5',
    title: 'React Performance Course',
    description: 'Watch module 3 on memoization and virtualization.',
    day: 'Tuesday',
    startTime: '14:00',
    endTime: '15:30',
    category: 'study',
    priority: 'low',
    completed: false
  },
  {
    id: 'e6',
    title: 'Grocery Run & Meal Prep',
    description: 'Stock up on healthy greens and prep lunches for Wed-Fri.',
    day: 'Tuesday',
    startTime: '18:00',
    endTime: '19:30',
    category: 'personal',
    priority: 'medium',
    completed: false
  },

  // Wednesday
  {
    id: 'e7',
    title: 'Deep Work: Database Schema',
    description: 'Optimizing Firestore indices and rules.',
    day: 'Wednesday',
    startTime: '09:00',
    endTime: '11:30',
    category: 'focus',
    priority: 'high',
    completed: false
  },
  {
    id: 'e8',
    title: 'Mid-Week Run (5K)',
    description: 'Outdoor jog at a moderate pace.',
    day: 'Wednesday',
    startTime: '17:00',
    endTime: '17:45',
    category: 'health',
    priority: 'medium',
    completed: false
  },

  // Thursday
  {
    id: 'e9',
    title: 'One-on-One Syncs',
    description: 'Regular feedback sessions.',
    day: 'Thursday',
    startTime: '10:00',
    endTime: '11:30',
    category: 'work',
    priority: 'medium',
    completed: false
  },
  {
    id: 'e10',
    title: 'Tech Tech Talk: Next.js',
    description: 'Join virtual engineering talk on Server Actions.',
    day: 'Thursday',
    startTime: '15:00',
    endTime: '16:00',
    category: 'study',
    priority: 'low',
    completed: false
  },

  // Friday
  {
    id: 'e11',
    title: 'Sprint Retrospective',
    description: 'Reflect on successes and blockers.',
    day: 'Friday',
    startTime: '14:00',
    endTime: '15:00',
    category: 'work',
    priority: 'medium',
    completed: false
  },
  {
    id: 'e12',
    title: 'Movie Night & Pizza',
    description: 'Unwind and watch a movie with friends.',
    day: 'Friday',
    startTime: '19:00',
    endTime: '22:00',
    category: 'leisure',
    priority: 'low',
    completed: false
  },

  // Saturday
  {
    id: 'e13',
    title: 'Morning Hike',
    description: 'Nature walk at the state park.',
    day: 'Saturday',
    startTime: '08:00',
    endTime: '11:30',
    category: 'health',
    priority: 'medium',
    completed: false
  },
  
  // Sunday
  {
    id: 'e14',
    title: 'Weekly Review & Prep',
    description: 'Reflect on the past week and plan for the next one.',
    day: 'Sunday',
    startTime: '16:00',
    endTime: '17:00',
    category: 'personal',
    priority: 'high',
    completed: false
  }
];

export const DEFAULT_MONTHLY_GOALS: MonthlyGoal[] = [
  { id: 'mg1', title: 'Deliver first iteration of React/Vite dashboard', completed: true, month: '2026-07' },
  { id: 'mg2', title: 'Complete deep work study sprint on database rules', completed: false, month: '2026-07' },
  { id: 'mg3', title: 'Perform 4 weekend cardio treks and fitness runs', completed: false, month: '2026-07' }
];

export const DEFAULT_MONTHLY_EVENTS: MonthlyEvent[] = [
  { id: 'me1', title: 'Monthly Kickoff Meeting', description: 'Align milestones for July core roadmap', date: '2026-07-01', category: 'work', completed: true },
  { id: 'me2', title: 'Milestone 1 Demo Release', description: 'Complete alpha wireframes', date: '2026-07-10', category: 'focus', completed: true },
  { id: 'me3', title: 'Mid-month Fitness Review', description: 'Log bio-metrics and run times', date: '2026-07-15', category: 'health', completed: true },
  { id: 'me4', title: 'Workspace Design Optimization', description: 'Clean up layout and visual accents', date: '2026-07-21', category: 'focus', completed: false },
  { id: 'me5', title: 'React Course Assignments Due', description: 'Submit memoization project tasks', date: '2026-07-25', category: 'study', completed: false },
  { id: 'me6', title: 'Monthly Review & Team Retrospective', description: 'Reflection and pizza celebration', date: '2026-07-31', category: 'leisure', completed: false }
];


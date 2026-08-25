export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type Category = 'work' | 'health' | 'personal' | 'leisure' | 'study' | 'focus';

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  day: DayOfWeek;
  startTime: string; // "HH:MM" format (24h)
  endTime: string;   // "HH:MM" format (24h)
  category: Category;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface WeeklyHabit {
  id: string;
  name: string;
  daysCompleted: DayOfWeek[]; // e.g. ['Monday', 'Wednesday']
}

export interface WeeklyGoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface AISchedulingResponse {
  events: {
    title: string;
    description?: string;
    day: DayOfWeek;
    startTime: string; // "HH:MM"
    endTime: string;   // "HH:MM"
    category: Category;
    priority: 'low' | 'medium' | 'high';
  }[];
  habits?: string[];
  goals?: string[];
  explanation: string;
}

export interface MonthlyEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // "YYYY-MM-DD" format
  category: Category;
  completed: boolean;
}

export interface MonthlyGoal {
  id: string;
  title: string;
  completed: boolean;
  month: string; // "YYYY-MM" format
}

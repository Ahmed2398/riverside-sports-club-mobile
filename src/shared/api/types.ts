export type Bilingual = { ar: string; en: string };

export type User = {
  id: number;
  name: Bilingual;
  email: string;
  role: 'admin' | 'member';
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type Progress = {
  name: Bilingual;
  memberNumber: string;
  tier: 'basic' | 'standard' | 'premium';
  sessionsThisMonth: number;
  monthlyGoal: number;
  totalSessions: number;
  currentStreakDays: number;
  nextClass: { name: Bilingual; startsAt: string } | null;
};

export type Session = {
  id: string;
  date: string;
  className: Bilingual;
  durationMinutes: number;
  coach: string;
  status: 'attended' | 'upcoming';
};

export type ClassItem = {
  id: string;
  name: Bilingual;
  startsAt: string;
  durationMinutes: number;
  coach: string;
  capacity: number;
  spotsLeft: number;
};

export type Booking = {
  id: string;
  classId: string;
  className: Bilingual;
  startsAt: string;
  coach: string;
  status: 'confirmed';
  bookedAt: string;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type ApiError = {
  message: string;
  code: string;
  errors?: Record<string, string[]>;
};

'use client';
/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Flame,
  Dumbbell,
  Brain,
  Calendar,
  Trophy,
  Users,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  Target,
  Award,
  Zap,
  Heart,
  BarChart3,
  UserPlus,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Info,
  MessageSquare,
  Send,
  Utensils,
  Scale,
  ArrowDownRight,
  X,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

type NavSection =
  | 'dashboard'
  | 'coach'
  | 'workout-plan'
  | 'body-metrics'
  | 'daily-stats'
  | 'streaks'
  | 'groups'
  | 'onboarding';

type FitnessGoalId =
  | 'lose_weight'
  | 'build_muscle'
  | 'endurance'
  | 'maintain'
  | 'overall_health';

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type IntensityLevel = 'low' | 'moderate' | 'high' | 'hiit';
type BudgetTier = 'economy' | 'standard' | 'premium';

interface UserProfile {
  name: string;
  goal: FitnessGoalId;
  experience: ExperienceLevel;
  availableTimeMin: number;
  daysPerWeek: number;
  preferredTimeSlot: string;
  equipment: string[];
  limitations: string;
  budgetTier: BudgetTier;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  waistCm?: number;
  onboarded: boolean;
}

interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSec: number;
  completedSets: number;
  caloriesEst: number;
  equipment: string;
}

interface DayPlan {
  dayCode: string; // 'T2'..'CN'
  dayLabel: string;
  title: string;
  focus: string;
  durationMin: number;
  intensity: IntensityLevel;
  isRestDay: boolean;
  completed: boolean;
  exercises: ExerciseItem[];
}

interface AIRecommendation {
  id: string;
  title: string;
  suitabilityReason: string;
  durationMin: number;
  difficulty: ExperienceLevel;
  intensity: IntensityLevel;
  targetMuscles: string[];
  recoveryNote: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    restSec: number;
    muscle: string;
  }[];
  mealPlan: {
    breakfast: string;
    lunch: string;
    dinner: string;
    budgetLabel: string;
  };
}

interface BodyMetricEntry {
  id: string;
  date: string;
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  waistCm?: number;
  note?: string;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  recommendationSnapshot?: AIRecommendation;
}

interface LeaderboardMember {
  id: string;
  name: string;
  handle: string;
  avatarBg: string;
  initials: string;
  isCurrentUser?: boolean;
  completedWorkouts: number;
  totalMinutes: number;
  streakDays: number;
  points: number;
  weeklyDelta: string;
}

interface FitnessGroup {
  id: string;
  name: string;
  code: string;
  slogan: string;
  groupStreakDays: number;
  weeklyChallengeTitle: string;
  weeklyChallengeTargetMin: number;
  weeklyChallengeCurrentMin: number;
  members: LeaderboardMember[];
}

// ---------------------------------------------------------------------------
// Constants & Default Data (Preserving AI Fitness Pro DNA)
// ---------------------------------------------------------------------------

const GOAL_META: Record<
  FitnessGoalId,
  { label: string; shortLabel: string; desc: string; targetCal: number }
> = {
  lose_weight: {
    label: 'Giảm mỡ & Thon gọn (Lose Weight)',
    shortLabel: 'Giảm mỡ',
    desc: 'Tối ưu đốt calo, HIIT kết hợp kháng lực giữ cơ',
    targetCal: 520
  },
  build_muscle: {
    label: 'Tăng cơ & Sức mạnh (Build Muscle)',
    shortLabel: 'Tăng cơ',
    desc: 'Tập trung Hypertrophy, quá tải lũy tiến & phục hồi',
    targetCal: 480
  },
  endurance: {
    label: 'Tăng sức bền tim mạch (Improve Endurance)',
    shortLabel: 'Sức bền',
    desc: 'Nâng ngưỡng VO2 Max, nhịp tim bền bỉ và dẻo dai',
    targetCal: 550
  },
  maintain: {
    label: 'Duy trì vóc dáng (Maintain Fitness)',
    shortLabel: 'Duy trì',
    desc: 'Cân bằng vận động hàng ngày, giữ năng lượng ổn định',
    targetCal: 400
  },
  overall_health: {
    label: 'Tăng cường sức khỏe tổng thể (Overall Health)',
    shortLabel: 'Sức khỏe',
    desc: 'Vận động linh hoạt, giảm căng thẳng, cải thiện giấc ngủ',
    targetCal: 380
  }
};

const EXPERIENCE_META: Record<ExperienceLevel, { label: string; badge: string }> = {
  beginner: { label: 'Người mới (Beginner)', badge: 'Beginner' },
  intermediate: { label: 'Trung cấp (Intermediate)', badge: 'Intermediate' },
  advanced: { label: 'Nâng cao (Advanced)', badge: 'Advanced' }
};

const BUDGET_META: Record<
  BudgetTier,
  {
    label: string;
    meals: { breakfast: string; lunch: string; dinner: string };
  }
> = {
  economy: {
    label: 'Tiết kiệm (Tự nấu ăn sinh viên)',
    meals: {
      breakfast: 'Trứng luộc 2 quả + 1 củ khoai lang mật hấp',
      lunch: 'Ức gà áp chảo xào rau cải + 1 chén cơm trắng vừa đủ',
      dinner: 'Đậu phụ sốt cà chua + canh rau ngót thịt băm nạc'
    }
  },
  standard: {
    label: 'Trung bình (Tập gym cơ bản)',
    meals: {
      breakfast: 'Yến mạch qua đêm với sữa tươi không đường + 2 quả trứng ốp la',
      lunch: '180g ức gà/thăn bò + bông cải xanh luộc + cơm gạo lứt',
      dinner: 'Cá rô phi/cá basa áp chảo + salad dầu giấm + khoai lang'
    }
  },
  premium: {
    label: 'Cao cấp (Đầy đủ thực phẩm bổ sung)',
    meals: {
      breakfast: '1 muỗng Whey Isolate + bánh mì nguyên cám bơ đậu phộng & quả mọng',
      lunch: '200g cá hồi/thăn bò Mỹ áp chảo + măng tây + hạt diêm mạch (Quinoa)',
      dinner: 'Ức gà hữu cơ nướng thảo mộc + salad bơ hạt óc chó + Casein trước ngủ'
    }
  }
};

const EQUIPMENT_OPTIONS = [
  { id: 'bodyweight', label: 'Không dụng cụ (Bodyweight)' },
  { id: 'dumbbells', label: 'Tạ đơn (Dumbbells)' },
  { id: 'bands', label: 'Dây kháng lực (Resistance Bands)' },
  { id: 'pullup_bar', label: 'Xà đơn (Pull-up Bar)' },
  { id: 'full_gym', label: 'Phòng Gym đầy đủ (Full Gym)' }
];

const INITIAL_PROFILE: UserProfile = {
  name: 'Bạn (Tôi)',
  goal: 'maintain',
  experience: 'intermediate',
  availableTimeMin: 30,
  daysPerWeek: 5,
  preferredTimeSlot: '19:30',
  equipment: ['bodyweight', 'dumbbells'],
  limitations: 'Không có chấn thương; ngồi làm việc máy tính nhiều 8h/ngày',
  budgetTier: 'economy',
  heightCm: 170,
  weightKg: 65.0,
  targetWeightKg: 63.0,
  bodyFatPct: 16.8,
  muscleMassKg: 31.4,
  waistCm: 76,
  onboarded: true
};

const INITIAL_WEEKLY_PLAN: DayPlan[] = [
  {
    dayCode: 'T2',
    dayLabel: 'Thứ 2',
    title: 'Toàn thân & Kích hoạt Trao đổi chất',
    focus: 'Full Body & Core',
    durationMin: 30,
    intensity: 'moderate',
    isRestDay: false,
    completed: true,
    exercises: [
      {
        id: 'ex-1',
        name: 'Jumping Jacks (Khởi động)',
        muscleGroup: 'Cardio / Toàn thân',
        sets: 3,
        reps: '45 giây',
        restSec: 30,
        completedSets: 3,
        caloriesEst: 65,
        equipment: 'Bodyweight'
      },
      {
        id: 'ex-2',
        name: 'Bodyweight Squat (Thân dưới)',
        muscleGroup: 'Đùi trước & Mông',
        sets: 4,
        reps: '15 lần',
        restSec: 45,
        completedSets: 4,
        caloriesEst: 95,
        equipment: 'Bodyweight'
      },
      {
        id: 'ex-3',
        name: 'Push-up / Chống đẩy chuẩn',
        muscleGroup: 'Ngực & Tay sau',
        sets: 3,
        reps: '12 lần',
        restSec: 45,
        completedSets: 3,
        caloriesEst: 70,
        equipment: 'Bodyweight'
      },
      {
        id: 'ex-4',
        name: 'Plank siết cơ lõi (Core)',
        muscleGroup: 'Bụng & Lưng dưới',
        sets: 3,
        reps: '45 giây',
        restSec: 30,
        completedSets: 3,
        caloriesEst: 50,
        equipment: 'Bodyweight'
      }
    ]
  },
  {
    dayCode: 'T3',
    dayLabel: 'Thứ 3',
    title: 'Thân trên & Kiểm soát Tư thế',
    focus: 'Upper Body Push/Pull',
    durationMin: 35,
    intensity: 'high',
    isRestDay: false,
    completed: true,
    exercises: [
      {
        id: 'ex-201',
        name: 'Dumbbell Shoulder Press',
        muscleGroup: 'Vai',
        sets: 4,
        reps: '12 lần',
        restSec: 60,
        completedSets: 4,
        caloriesEst: 90,
        equipment: 'Dumbbells'
      },
      {
        id: 'ex-202',
        name: 'Bent-over Dumbbell Row',
        muscleGroup: 'Lưng xô',
        sets: 4,
        reps: '12 lần',
        restSec: 60,
        completedSets: 4,
        caloriesEst: 100,
        equipment: 'Dumbbells'
      },
      {
        id: 'ex-203',
        name: 'Diamond Push-ups',
        muscleGroup: 'Tay sau & Ngực trong',
        sets: 3,
        reps: '10 lần',
        restSec: 45,
        completedSets: 3,
        caloriesEst: 75,
        equipment: 'Bodyweight'
      }
    ]
  },
  {
    dayCode: 'T4',
    dayLabel: 'Thứ 4',
    title: 'Phục hồi Chủ động & Linh hoạt Khớp',
    focus: 'Mobility & Active Recovery',
    durationMin: 20,
    intensity: 'low',
    isRestDay: true,
    completed: true,
    exercises: [
      {
        id: 'ex-301',
        name: 'Cat-Cow & Thoracic Opener',
        muscleGroup: 'Cột sống & Vai',
        sets: 3,
        reps: '60 giây',
        restSec: 20,
        completedSets: 3,
        caloriesEst: 45,
        equipment: 'Bodyweight'
      },
      {
        id: 'ex-302',
        name: 'Đi bộ nhanh (Brisk Walk)',
        muscleGroup: 'Tim mạch nhẹ',
        sets: 1,
        reps: '15 phút',
        restSec: 0,
        completedSets: 1,
        caloriesEst: 95,
        equipment: 'Bodyweight'
      }
    ]
  },
  {
    dayCode: 'T5',
    dayLabel: 'Thứ 5 (Hôm nay)',
    title: 'Lộ trình AI: Toàn thân & Đốt mỡ 19:30',
    focus: 'Full Body Conditioning',
    durationMin: 30,
    intensity: 'moderate',
    isRestDay: false,
    completed: false,
    exercises: [
      {
        id: 'ex-401',
        name: 'Jumping Jacks (Khởi động)',
        muscleGroup: 'Khởi động tim mạch',
        sets: 3,
        reps: '45 giây',
        restSec: 30,
        completedSets: 0,
        caloriesEst: 70,
        equipment: 'Bodyweight'
      },
      {
        id: 'ex-402',
        name: 'Bodyweight Squat (Thân dưới)',
        muscleGroup: 'Đùi & Mông',
        sets: 4,
        reps: '15 lần',
        restSec: 45,
        completedSets: 0,
        caloriesEst: 110,
        equipment: 'Bodyweight'
      },
      {
        id: 'ex-403',
        name: 'Push-up / Chống đẩy quỳ',
        muscleGroup: 'Ngực & Vai trước',
        sets: 3,
        reps: '10–12 lần',
        restSec: 45,
        completedSets: 0,
        caloriesEst: 80,
        equipment: 'Bodyweight'
      },
      {
        id: 'ex-404',
        name: 'Plank siết bụng',
        muscleGroup: 'Cơ lõi (Core)',
        sets: 3,
        reps: '30 giây',
        restSec: 30,
        completedSets: 0,
        caloriesEst: 60,
        equipment: 'Bodyweight'
      }
    ]
  },
  {
    dayCode: 'T6',
    dayLabel: 'Thứ 6',
    title: 'Thân dưới & Sức mạnh Cơ lõi',
    focus: 'Lower Body & Glutes',
    durationMin: 35,
    intensity: 'high',
    isRestDay: false,
    completed: false,
    exercises: [
      {
        id: 'ex-501',
        name: 'Bulgarian Split Squat',
        muscleGroup: 'Đùi trước & Mông',
        sets: 3,
        reps: '10 lần/chân',
        restSec: 60,
        completedSets: 0,
        caloriesEst: 115,
        equipment: 'Dumbbells'
      },
      {
        id: 'ex-502',
        name: 'Romanian Deadlift (Tạ đơn)',
        muscleGroup: 'Đùi sau & Lưng dưới',
        sets: 4,
        reps: '12 lần',
        restSec: 60,
        completedSets: 0,
        caloriesEst: 120,
        equipment: 'Dumbbells'
      },
      {
        id: 'ex-503',
        name: 'Mountain Climbers',
        muscleGroup: 'Core & Cardio',
        sets: 3,
        reps: '40 giây',
        restSec: 30,
        completedSets: 0,
        caloriesEst: 85,
        equipment: 'Bodyweight'
      }
    ]
  },
  {
    dayCode: 'T7',
    dayLabel: 'Thứ 7',
    title: 'HIIT Đốt Calo & Sức bền Nhóm',
    focus: 'HIIT Metabolic Conditioning',
    durationMin: 30,
    intensity: 'hiit',
    isRestDay: false,
    completed: false,
    exercises: [
      {
        id: 'ex-601',
        name: 'Burpees kiểm soát nhịp',
        muscleGroup: 'Toàn thân',
        sets: 4,
        reps: '10 lần',
        restSec: 45,
        completedSets: 0,
        caloriesEst: 130,
        equipment: 'Bodyweight'
      },
      {
        id: 'ex-602',
        name: 'High Knees chạy nâng cao đùi',
        muscleGroup: 'Tim mạch',
        sets: 4,
        reps: '40 giây',
        restSec: 30,
        completedSets: 0,
        caloriesEst: 95,
        equipment: 'Bodyweight'
      },
      {
        id: 'ex-603',
        name: 'Russian Twists',
        muscleGroup: 'Cơ liên sườn',
        sets: 3,
        reps: '20 lần',
        restSec: 30,
        completedSets: 0,
        caloriesEst: 65,
        equipment: 'Bodyweight'
      }
    ]
  },
  {
    dayCode: 'CN',
    dayLabel: 'Chủ Nhật',
    title: 'Nghỉ ngơi & Tái tạo Năng lượng',
    focus: 'Full Recovery & Sleep',
    durationMin: 15,
    intensity: 'low',
    isRestDay: true,
    completed: false,
    exercises: [
      {
        id: 'ex-701',
        name: 'Giãn cơ toàn thân (Full Body Stretch)',
        muscleGroup: 'Phục hồi cơ bắp',
        sets: 1,
        reps: '15 phút',
        restSec: 0,
        completedSets: 0,
        caloriesEst: 45,
        equipment: 'Bodyweight'
      }
    ]
  }
];

const INITIAL_METRICS_HISTORY: BodyMetricEntry[] = [
  {
    id: 'bm-1',
    date: '2026-09-15',
    weightKg: 67.4,
    heightCm: 170,
    bodyFatPct: 18.5,
    muscleMassKg: 30.6,
    waistCm: 79,
    note: 'Bắt đầu chu kỳ tập luyện mới'
  },
  {
    id: 'bm-2',
    date: '2026-09-29',
    weightKg: 66.8,
    heightCm: 170,
    bodyFatPct: 18.0,
    muscleMassKg: 30.8,
    waistCm: 78,
    note: 'Giữ chuỗi 2 tuần liên tục'
  },
  {
    id: 'bm-3',
    date: '2026-10-12',
    weightKg: 66.1,
    heightCm: 170,
    bodyFatPct: 17.4,
    muscleMassKg: 31.1,
    waistCm: 77,
    note: 'Tăng mức tạ bài Squat & Row'
  },
  {
    id: 'bm-4',
    date: '2026-10-25',
    weightKg: 65.5,
    heightCm: 170,
    bodyFatPct: 17.1,
    muscleMassKg: 31.2,
    waistCm: 76.5,
    note: 'Cải thiện giấc ngủ 7.5h/đêm'
  },
  {
    id: 'bm-5',
    date: '2026-11-05',
    weightKg: 65.0,
    heightCm: 170,
    bodyFatPct: 16.8,
    muscleMassKg: 31.4,
    waistCm: 76,
    note: 'Đo sáng sớm trước bữa ăn'
  }
];

const INITIAL_GROUPS: FitnessGroup[] = [
  {
    id: 'grp-cung-tien',
    name: 'Nhóm "Cùng Tiến"',
    code: 'CUNGTIEN26',
    slogan: 'Kỷ luật mỗi ngày — Không ai bị bỏ lại phía sau',
    groupStreakDays: 12,
    weeklyChallengeTitle: 'Thử thách 600 phút vận động toàn đội',
    weeklyChallengeTargetMin: 600,
    weeklyChallengeCurrentMin: 485,
    members: [
      {
        id: 'mem-1',
        name: 'Bạn (Tôi)',
        handle: '@ban_fitness',
        avatarBg: 'bg-[#C8FF00] text-zinc-950',
        initials: 'BT',
        isCurrentUser: true,
        completedWorkouts: 14,
        totalMinutes: 165,
        streakDays: 5,
        points: 450,
        weeklyDelta: '+50 pts hôm nay'
      },
      {
        id: 'mem-2',
        name: 'Minh Tuấn',
        handle: '@minhtuan_run',
        avatarBg: 'bg-emerald-500 text-zinc-950',
        initials: 'MT',
        completedWorkouts: 13,
        totalMinutes: 140,
        streakDays: 4,
        points: 420,
        weeklyDelta: '+40 pts hôm qua'
      },
      {
        id: 'mem-3',
        name: 'Hoàng Nam',
        handle: '@nam_lifting',
        avatarBg: 'bg-sky-500 text-zinc-950',
        initials: 'HN',
        completedWorkouts: 11,
        totalMinutes: 110,
        streakDays: 3,
        points: 380,
        weeklyDelta: '+35 pts'
      },
      {
        id: 'mem-4',
        name: 'Thu Thảo',
        handle: '@thuthao_fit',
        avatarBg: 'bg-amber-400 text-zinc-950',
        initials: 'TT',
        completedWorkouts: 9,
        totalMinutes: 70,
        streakDays: 2,
        points: 290,
        weeklyDelta: '+30 pts'
      }
    ]
  },
  {
    id: 'grp-saigon-runners',
    name: 'Vietnam Morning Sweat Club',
    code: 'VNSWEAT5AM',
    slogan: 'Dậy sớm 5:30 sáng & hoàn thành mục tiêu calo',
    groupStreakDays: 19,
    weeklyChallengeTitle: '10,000 Calo đốt cháy trong tuần',
    weeklyChallengeTargetMin: 900,
    weeklyChallengeCurrentMin: 740,
    members: [
      {
        id: 'mem-101',
        name: 'Khánh Linh',
        handle: '@linh_cardio',
        avatarBg: 'bg-lime-400 text-zinc-950',
        initials: 'KL',
        completedWorkouts: 18,
        totalMinutes: 240,
        streakDays: 9,
        points: 610,
        weeklyDelta: '+90 pts'
      },
      {
        id: 'mem-1',
        name: 'Bạn (Tôi)',
        handle: '@ban_fitness',
        avatarBg: 'bg-[#C8FF00] text-zinc-950',
        initials: 'BT',
        isCurrentUser: true,
        completedWorkouts: 14,
        totalMinutes: 165,
        streakDays: 5,
        points: 450,
        weeklyDelta: '+50 pts'
      },
      {
        id: 'mem-102',
        name: 'Đức Anh',
        handle: '@ducanh_hiit',
        avatarBg: 'bg-violet-400 text-zinc-950',
        initials: 'ĐA',
        completedWorkouts: 12,
        totalMinutes: 150,
        streakDays: 4,
        points: 410,
        weeklyDelta: '+45 pts'
      }
    ]
  }
];

const WEEKLY_ACTIVITY_DATA = [
  { day: 'T2', calories: 320, targetCalories: 350, duration: 30, steps: 7800 },
  { day: 'T3', calories: 410, targetCalories: 350, duration: 35, steps: 8400 },
  { day: 'T4', calories: 210, targetCalories: 250, duration: 20, steps: 6900 },
  { day: 'T5', calories: 320, targetCalories: 350, duration: 30, steps: 7450 },
  { day: 'T6', calories: 0, targetCalories: 380, duration: 0, steps: 4200 },
  { day: 'T7', calories: 0, targetCalories: 420, duration: 0, steps: 0 },
  { day: 'CN', calories: 0, targetCalories: 200, duration: 0, steps: 0 }
];

const MONTHLY_ACTIVITY_DATA = [
  { label: 'Tuần 1', calories: 1890, duration: 145, workouts: 4, completion: 85 },
  { label: 'Tuần 2', calories: 2140, duration: 165, workouts: 5, completion: 92 },
  { label: 'Tuần 3', calories: 1980, duration: 150, workouts: 4, completion: 88 },
  { label: 'Tuần 4', calories: 2260, duration: 175, workouts: 5, completion: 96 }
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function calculateBMI(weightKg: number, heightCm: number): number {
  if (!heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

function getBMICategory(bmi: number): { label: string; colorClass: string } {
  if (bmi < 18.5) {
    return { label: 'Thiếu cân (Underweight)', colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
  }
  if (bmi < 23.0) {
    return { label: 'Chuẩn lý tưởng (Normal)', colorClass: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' };
  }
  if (bmi < 25.0) {
    return { label: 'Thừa cân nhẹ (Overweight)', colorClass: 'text-amber-600 bg-amber-500/10 border-amber-500/30' };
  }
  return { label: 'Thừa cân (Obese)', colorClass: 'text-rose-600 bg-rose-500/10 border-rose-500/30' };
}

function buildPersonalizedRecommendation(profile: UserProfile): AIRecommendation {
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const goalInfo = GOAL_META[profile.goal];
  const budgetInfo = BUDGET_META[profile.budgetTier];
  const hasDumbbells = profile.equipment.includes('dumbbells') || profile.equipment.includes('full_gym');

  const exercises =
    profile.goal === 'build_muscle'
      ? [
          {
            name: hasDumbbells ? 'Goblet Squat với Tạ đơn' : 'Tempo Bodyweight Squat (3s hạ)',
            sets: 4,
            reps: '12 lần',
            restSec: 60,
            muscle: 'Đùi trước & Cơ mông'
          },
          {
            name: hasDumbbells ? 'Dumbbell Floor/Bench Press' : 'Push-up Chống đẩy chuẩn',
            sets: 4,
            reps: '10–12 lần',
            restSec: 60,
            muscle: 'Ngực & Tay sau'
          },
          {
            name: hasDumbbells ? 'One-Arm Dumbbell Row' : 'Prone Y-T-W Back Extensions',
            sets: 3,
            reps: '12 lần',
            restSec: 45,
            muscle: 'Lưng xô & Vai sau'
          },
          {
            name: 'Plank siết cơ lõi (Core Brace)',
            sets: 3,
            reps: '45 giây',
            restSec: 30,
            muscle: 'Cơ bụng trung tâm'
          }
        ]
      : profile.goal === 'lose_weight'
      ? [
          {
            name: 'Jumping Jacks (Khởi động tăng nhịp tim)',
            sets: 3,
            reps: '45 giây',
            restSec: 25,
            muscle: 'Toàn thân & Tim mạch'
          },
          {
            name: 'Bodyweight Squat kết hợp Knee Drive',
            sets: 4,
            reps: '15 lần',
            restSec: 40,
            muscle: 'Đùi, Mông & Core'
          },
          {
            name: 'Push-up / Mountain Climbers Superset',
            sets: 3,
            reps: '12 lần + 30 giây',
            restSec: 45,
            muscle: 'Ngực, Vai & Đốt mỡ'
          },
          {
            name: 'Plank siết bụng tĩnh',
            sets: 3,
            reps: '40 giây',
            restSec: 30,
            muscle: 'Bụng & Lưng dưới'
          }
        ]
      : [
          {
            name: 'Jumping Jacks (Khởi động)',
            sets: 3,
            reps: '45 giây',
            restSec: 30,
            muscle: 'Khởi động toàn thân'
          },
          {
            name: 'Bodyweight Squat (Thân dưới)',
            sets: 4,
            reps: '15 lần',
            restSec: 45,
            muscle: 'Đùi trước & Mông'
          },
          {
            name: 'Push-up / Chống đẩy quỳ',
            sets: 3,
            reps: '10–12 lần',
            restSec: 45,
            muscle: 'Ngực & Tay sau'
          },
          {
            name: 'Plank siết bụng',
            sets: 3,
            reps: '30 giây',
            restSec: 30,
            muscle: 'Cơ lõi (Core)'
          }
        ];

  return {
    id: `rec-${profile.goal}-${profile.availableTimeMin}`,
    title: `Lộ trình ${goalInfo.shortLabel} Tối ưu ${profile.availableTimeMin} Phút (${profile.preferredTimeSlot})`,
    suitabilityReason: `Thiết kế dựa trên thông số bạn cung cấp (${profile.heightCm}cm, ${profile.weightKg}kg — BMI ước tính ${bmi}), quỹ thời gian ${profile.availableTimeMin} phút/ngày ở trình độ ${EXPERIENCE_META[profile.experience].badge}${
      profile.limitations ? ` và lưu ý "${profile.limitations}"` : ''
    }.`,
    durationMin: profile.availableTimeMin,
    difficulty: profile.experience,
    intensity: profile.goal === 'lose_weight' ? 'hiit' : 'moderate',
    targetMuscles: ['Đùi & Mông', 'Ngực & Vai', 'Cơ lõi (Core)', 'Tim mạch'],
    recoveryNote:
      'Ngủ đủ 7–8 tiếng đêm nay, bổ sung 500ml nước điện giải hoặc nước lọc trong buổi tập và giãn cơ cột sống 5 phút sau khi kết thúc.',
    exercises,
    mealPlan: {
      ...budgetInfo.meals,
      budgetLabel: budgetInfo.label
    }
  };
}

// ---------------------------------------------------------------------------
// Main Application Component
// ---------------------------------------------------------------------------

export default function App() {
  // Navigation & UI state
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string; type?: 'success' | 'info' | 'warning' } | null>(null);

  // User Profile & Persistent State
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [streakDays, setStreakDays] = useState<number>(5);
  const [longestStreak, setLongestStreak] = useState<number>(14);
  const [totalActiveDays, setTotalActiveDays] = useState<number>(42);
  const [userPoints, setUserPoints] = useState<number>(450);
  const [todayCompleted, setTodayCompleted] = useState<boolean>(false);

  // Workout Plan State
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>(INITIAL_WEEKLY_PLAN);
  const [selectedDayCode, setSelectedDayCode] = useState<string>('T5');

  // AI Recommendation & Chat State
  const [currentRecommendation, setCurrentRecommendation] = useState<AIRecommendation>(() =>
    buildPersonalizedRecommendation(INITIAL_PROFILE)
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      timestamp: '19:00',
      text: 'Chào bạn! Tôi là AI Fitness Coach. Dựa trên thông số bạn đã nhập (170cm, 65kg, 30 phút rảnh lúc 19:30), tôi đã chuẩn bị lộ trình tập luyện kết hợp thực đơn phù hợp ngân sách của bạn. Bạn muốn điều chỉnh bài tập hôm nay hay cần tư vấn phục hồi cơ?'
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Live Workout Timer State
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Body Metrics State
  const [metricsHistory, setMetricsHistory] = useState<BodyMetricEntry[]>(INITIAL_METRICS_HISTORY);
  const [newMetricForm, setNewMetricForm] = useState({
    weightKg: '65.0',
    heightCm: '170',
    bodyFatPct: '16.8',
    muscleMassKg: '31.4',
    waistCm: '76',
    note: ''
  });
  const [metricFormError, setMetricFormError] = useState<string>('');
  const [metricDeleteTargetId, setMetricDeleteTargetId] = useState<string | null>(null);

  // Exercise Modal / Edit State
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState<boolean>(false);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscleGroup: 'Đùi & Mông',
    sets: '3',
    reps: '12 lần',
    restSec: '45',
    equipment: 'Bodyweight'
  });
  const [exerciseFormError, setExerciseFormError] = useState<string>('');
  const [exerciseDeleteConfirm, setExerciseDeleteConfirm] = useState<{ dayCode: string; exId: string; exName: string } | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

  // Daily Statistics Period Filter
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Groups & Leaderboard State
  const [groups, setGroups] = useState<FitnessGroup[]>(INITIAL_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string>('grp-cung-tien');
  const [rankingScope, setRankingScope] = useState<'group' | 'personal'>('group');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState<boolean>(false);
  const [newGroupForm, setNewGroupForm] = useState({ name: '', slogan: '', targetMin: '600' });
  const [newGroupError, setNewGroupError] = useState<string>('');
  const [joinGroupCode, setJoinGroupCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Weekly Challenges State
  const [challenges, setChallenges] = useState([
    {
      id: 'ch-1',
      title: 'Hoàn thành 4 buổi tập đúng khung giờ 19:30',
      progress: 3,
      target: 4,
      rewardPts: 100,
      claimed: false
    },
    {
      id: 'ch-2',
      title: 'Đạt chuỗi Streak 7 ngày liên tiếp',
      progress: 5,
      target: 7,
      rewardPts: 150,
      claimed: false
    },
    {
      id: 'ch-3',
      title: 'Đốt tổng cộng 1,500 kcal trong tuần',
      progress: 1260,
      target: 1500,
      rewardPts: 120,
      claimed: false
    }
  ]);

  // Onboarding Wizard Step State
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [onboardingDraft, setOnboardingDraft] = useState<UserProfile>(INITIAL_PROFILE);
  const [onboardingError, setOnboardingError] = useState<string>('');

  // Load saved state safely from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_fitness_pro_v2_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) setProfile(parsed.profile);
        if (typeof parsed.streakDays === 'number') setStreakDays(parsed.streakDays);
        if (typeof parsed.userPoints === 'number') setUserPoints(parsed.userPoints);
        if (typeof parsed.todayCompleted === 'boolean') setTodayCompleted(parsed.todayCompleted);
      }
    } catch {
      // Ignore storage access errors in restricted iframe
    }
  }, []);

  // Save state changes safely
  useEffect(() => {
    try {
      localStorage.setItem(
        'ai_fitness_pro_v2_state',
        JSON.stringify({
          profile,
          streakDays,
          userPoints,
          todayCompleted
        })
      );
    } catch {
      // Ignore storage access errors
    }
  }, [profile, streakDays, userPoints, todayCompleted]);

  // Live Workout Timer Effect
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Auto-hide toast notification
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const triggerToast = (title: string, subtitle?: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ title, subtitle, type });
  };

  // Computed metrics
  const currentBMI = useMemo(
    () => calculateBMI(profile.weightKg, profile.heightCm),
    [profile.weightKg, profile.heightCm]
  );
  const bmiMeta = useMemo(() => getBMICategory(currentBMI), [currentBMI]);

  const selectedDayPlan = useMemo(
    () => weeklyPlan.find((d) => d.dayCode === selectedDayCode) || weeklyPlan[3],
    [weeklyPlan, selectedDayCode]
  );

  const todayPlan = useMemo(
    () => weeklyPlan.find((d) => d.dayCode === 'T5') || weeklyPlan[3],
    [weeklyPlan]
  );

  const todayCaloriesBurned = useMemo(() => {
    const base = todayPlan.exercises.reduce(
      (acc, ex) => acc + Math.round((ex.completedSets / Math.max(1, ex.sets)) * ex.caloriesEst),
      0
    );
    return todayCompleted ? Math.max(base, 320) : base + 145;
  }, [todayPlan, todayCompleted]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) || groups[0],
    [groups, activeGroupId]
  );

  // Format seconds as MM:SS
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // -------------------------------------------------------------------------
  // Handlers & Interactive Actions
  // -------------------------------------------------------------------------

  // Complete Today's Workout (+50 points & +1 Streak — preserving original app core feature)
  const handleCompleteTodayWorkout = () => {
    if (todayCompleted) {
      triggerToast('Bạn đã hoàn thành bài tập hôm nay!', 'Hãy nghỉ ngơi và giữ sức cho lịch tập ngày mai.', 'info');
      return;
    }

    const nextStreak = streakDays + 1;
    const nextPoints = userPoints + 50;
    setTodayCompleted(true);
    setStreakDays(nextStreak);
    if (nextStreak > longestStreak) setLongestStreak(nextStreak);
    setTotalActiveDays((d) => d + 1);
    setUserPoints(nextPoints);

    // Mark T5 exercises completed
    setWeeklyPlan((prev) =>
      prev.map((day) =>
        day.dayCode === 'T5'
          ? {
              ...day,
              completed: true,
              exercises: day.exercises.map((ex) => ({ ...ex, completedSets: ex.sets }))
            }
          : day
      )
    );

    // Sync user's streak & points in all groups
    setGroups((prev) =>
      prev.map((grp) => ({
        ...grp,
        weeklyChallengeCurrentMin: grp.weeklyChallengeCurrentMin + profile.availableTimeMin,
        members: grp.members
          .map((m) =>
            m.isCurrentUser
              ? {
                  ...m,
                  streakDays: nextStreak,
                  points: nextPoints,
                  completedWorkouts: m.completedWorkouts + 1,
                  totalMinutes: m.totalMinutes + profile.availableTimeMin,
                  weeklyDelta: '+50 pts vừa xong'
                }
              : m
          )
          .sort((a, b) => b.points - a.points)
      }))
    );

    // Update challenge progress
    setChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id === 'ch-1') return { ...ch, progress: Math.min(ch.target, ch.progress + 1) };
        if (ch.id === 'ch-2') return { ...ch, progress: Math.min(ch.target, nextStreak) };
        if (ch.id === 'ch-3') return { ...ch, progress: Math.min(ch.target, ch.progress + 320) };
        return ch;
      })
    );

    triggerToast(
      '🎯 Hoàn thành bài tập xuất sắc! (+50 điểm & +1 Streak)',
      `Chuỗi hiện tại: 🔥 ${nextStreak} ngày liên tiếp | Tổng điểm: ${nextPoints} pts`,
      'success'
    );
  };

  // Generate AI Workout & Meal Plan based on current user inputs
  const handleGenerateAIPlan = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const rec = buildPersonalizedRecommendation(profile);
      setCurrentRecommendation(rec);
      setIsGeneratingAI(false);
      triggerToast(
        '⚡ Đã cập nhật Lộ trình AI cá nhân hóa',
        `Tối ưu cho mục tiêu ${GOAL_META[profile.goal].shortLabel} (${profile.availableTimeMin} phút/ngày)`,
        'success'
      );
    }, 450);
  };

  // Apply AI Recommendation to Today's Workout Plan
  const handleApplyRecommendationToPlan = (rec: AIRecommendation) => {
    const mappedExercises: ExerciseItem[] = rec.exercises.map((ex, idx) => ({
      id: `ai-ex-${Date.now()}-${idx}`,
      name: ex.name,
      muscleGroup: ex.muscle,
      sets: ex.sets,
      reps: ex.reps,
      restSec: ex.restSec,
      completedSets: 0,
      caloriesEst: 75,
      equipment: profile.equipment.includes('dumbbells') ? 'Dumbbells' : 'Bodyweight'
    }));

    setWeeklyPlan((prev) =>
      prev.map((day) =>
        day.dayCode === selectedDayCode
          ? {
              ...day,
              title: rec.title,
              durationMin: rec.durationMin,
              intensity: rec.intensity,
              isRestDay: false,
              exercises: mappedExercises
            }
          : day
      )
    );

    triggerToast(
      `Đã áp dụng lộ trình AI vào ${selectedDayPlan.dayLabel}`,
      `${mappedExercises.length} bài tập đã được đồng bộ vào lịch tập của bạn.`,
      'success'
    );
  };

  // Send message to AI Fitness Coach
  const handleSendChat = (customPrompt?: string) => {
    const promptText = (customPrompt ?? chatInput).trim();
    if (!promptText) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');

    setTimeout(() => {
      const lower = promptText.toLowerCase();
      let replyText = '';
      let attachRec: AIRecommendation | undefined;

      if (lower.includes('mỏi') || lower.includes('đau') || lower.includes('phục hồi') || lower.includes('recovery')) {
        replyText = `Dựa trên ghi chú thể trạng của bạn (${profile.limitations || 'không có chấn thương đặc biệt'}) và chuỗi tập ${streakDays} ngày liên tiếp, hôm nay bạn nên giảm 25% khối lượng tạ, ưu tiên bài giãn cơ cột sống ngực (Thoracic Mobility) và đi bộ nhẹ 20 phút. Tôi không tự suy diễn nhịp tim hay HRV khi bạn chưa nhập thiết bị đo — hãy lắng nghe cảm giác cơ bắp ở mức RPE 5–6/10 nhé!`;
      } else if (lower.includes('ăn') || lower.includes('thực đơn') || lower.includes('calo') || lower.includes('tiết kiệm')) {
        const meals = BUDGET_META[profile.budgetTier].meals;
        replyText = `Với gói chi tiêu "${BUDGET_META[profile.budgetTier].label}" và cân nặng ${profile.weightKg}kg (BMI ước tính ${currentBMI}), bạn nên duy trì khoảng ${
           Math.round(profile.weightKg * 1.6)
        }g Protein/ngày. Gợi ý hôm nay:\n• Sáng: ${meals.breakfast}\n• Trưa: ${meals.lunch}\n• Tối: ${meals.dinner}`;
      } else if (lower.includes('15 phút') || lower.includes('nhanh') || lower.includes('bận')) {
        const quickProfile = { ...profile, availableTimeMin: 15 };
        attachRec = buildPersonalizedRecommendation(quickProfile);
        replyText = `Không sao cả! Duy trì thói quen quan trọng hơn thời lượng. Tôi vừa thiết kế phiên bản Express 15 phút (EMOM không cần dụng cụ) để bạn giữ vững chuỗi Streak 🔥 ${streakDays} ngày mà không bị quá tải.`;
      } else {
        attachRec = buildPersonalizedRecommendation(profile);
        replyText = `Tôi đã phân tích hồ sơ hiện tại của bạn (${profile.heightCm}cm, ${profile.weightKg}kg, mục tiêu ${GOAL_META[profile.goal].shortLabel}, ${profile.availableTimeMin} phút/buổi). Dưới đây là lộ trình tập luyện tối ưu kèm thời gian nghỉ giữa hiệp cụ thể:`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendationSnapshot: attachRec
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    }, 350);
  };

  // Toggle completed set on an exercise
  const handleToggleExerciseSet = (dayCode: string, exId: string) => {
    setWeeklyPlan((prev) =>
      prev.map((day) => {
        if (day.dayCode !== dayCode) return day;
        const updatedExercises = day.exercises.map((ex) => {
          if (ex.id !== exId) return ex;
          const nextSets = ex.completedSets >= ex.sets ? 0 : ex.completedSets + 1;
          return { ...ex, completedSets: nextSets };
        });
        const allDone =
          updatedExercises.length > 0 && updatedExercises.every((ex) => ex.completedSets >= ex.sets);
        return { ...day, exercises: updatedExercises, completed: allDone };
      })
    );
  };

  // Add new exercise to selected day
  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = exerciseForm.name.trim();
    const setsNum = parseInt(exerciseForm.sets, 10);
    const restNum = parseInt(exerciseForm.restSec, 10);

    if (!trimmedName) {
      setExerciseFormError('Vui lòng nhập tên bài tập.');
      return;
    }
    if (isNaN(setsNum) || setsNum < 1 || setsNum > 15) {
      setExerciseFormError('Số hiệp (Sets) phải từ 1 đến 15.');
      return;
    }
    if (isNaN(restNum) || restNum < 0 || restNum > 600) {
      setExerciseFormError('Thời gian nghỉ phải từ 0 đến 600 giây.');
      return;
    }

    const newEx: ExerciseItem = {
      id: `ex-custom-${Date.now()}`,
      name: trimmedName,
      muscleGroup: exerciseForm.muscleGroup,
      sets: setsNum,
      reps: exerciseForm.reps.trim() || '12 lần',
      restSec: restNum,
      completedSets: 0,
      caloriesEst: setsNum * 22,
      equipment: exerciseForm.equipment
    };

    setWeeklyPlan((prev) =>
      prev.map((d) =>
        d.dayCode === selectedDayCode
          ? { ...d, isRestDay: false, exercises: [...d.exercises, newEx] }
          : d
      )
    );

    setExerciseForm({
      name: '',
      muscleGroup: 'Đùi & Mông',
      sets: '3',
      reps: '12 lần',
      restSec: '45',
      equipment: 'Bodyweight'
    });
    setExerciseFormError('');
    setIsAddExerciseOpen(false);
    triggerToast('Đã thêm bài tập mới', `${newEx.name} (${newEx.sets} hiệp x ${newEx.reps})`);
  };

  // Confirm delete exercise
  const handleConfirmDeleteExercise = () => {
    if (!exerciseDeleteConfirm) return;
    const { dayCode, exId, exName } = exerciseDeleteConfirm;
    setWeeklyPlan((prev) =>
      prev.map((d) =>
        d.dayCode === dayCode
          ? { ...d, exercises: d.exercises.filter((ex) => ex.id !== exId) }
          : d
      )
    );
    setExerciseDeleteConfirm(null);
    triggerToast('Đã xóa bài tập', `Đã gỡ "${exName}" khỏi lịch tập.`, 'info');
  };

  // Log new body metric measurement
  const handleAddMetricEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newMetricForm.weightKg);
    const h = parseFloat(newMetricForm.heightCm);
    const bf = newMetricForm.bodyFatPct ? parseFloat(newMetricForm.bodyFatPct) : undefined;
    const mm = newMetricForm.muscleMassKg ? parseFloat(newMetricForm.muscleMassKg) : undefined;
    const waist = newMetricForm.waistCm ? parseFloat(newMetricForm.waistCm) : undefined;

    if (isNaN(w) || w < 25 || w > 250) {
      setMetricFormError('Cân nặng hợp lệ phải nằm trong khoảng 25kg – 250kg.');
      return;
    }
    if (isNaN(h) || h < 100 || h > 240) {
      setMetricFormError('Chiều cao hợp lệ phải nằm trong khoảng 100cm – 240cm.');
      return;
    }

    const entry: BodyMetricEntry = {
      id: `bm-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      weightKg: Number(w.toFixed(1)),
      heightCm: Math.round(h),
      bodyFatPct: bf && !isNaN(bf) ? Number(bf.toFixed(1)) : undefined,
      muscleMassKg: mm && !isNaN(mm) ? Number(mm.toFixed(1)) : undefined,
      waistCm: waist && !isNaN(waist) ? Number(waist.toFixed(1)) : undefined,
      note: newMetricForm.note.trim() || 'Cập nhật chỉ số định kỳ'
    };

    setMetricsHistory((prev) => [...prev, entry]);
    setProfile((prev) => ({
      ...prev,
      weightKg: entry.weightKg,
      heightCm: entry.heightCm,
      bodyFatPct: entry.bodyFatPct ?? prev.bodyFatPct,
      muscleMassKg: entry.muscleMassKg ?? prev.muscleMassKg,
      waistCm: entry.waistCm ?? prev.waistCm
    }));
    setMetricFormError('');
    setNewMetricForm((prev) => ({ ...prev, note: '' }));
    triggerToast(
      'Đã lưu chỉ số cơ thể mới',
      `Cân nặng: ${entry.weightKg}kg | BMI ước tính: ${calculateBMI(entry.weightKg, entry.heightCm)}`
    );
  };

  // Delete metric entry with confirmation
  const handleConfirmDeleteMetric = () => {
    if (!metricDeleteTargetId) return;
    setMetricsHistory((prev) => prev.filter((item) => item.id !== metricDeleteTargetId));
    setMetricDeleteTargetId(null);
    triggerToast('Đã xóa bản ghi đo lường', undefined, 'info');
  };

  // Copy Group Invite Code
  const handleCopyInviteCode = (code: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      // Fallback
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    triggerToast('Đã sao chép mã mời nhóm!', `Gửi mã "${code}" cho bạn bè để cùng đua Top tuần này.`);
  };

  // Create New Fitness Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newGroupForm.name.trim();
    if (!trimmedName) {
      setNewGroupError('Vui lòng nhập tên nhóm tập luyện.');
      return;
    }
    const newCode = trimmedName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6) + '99';

    const created: FitnessGroup = {
      id: `grp-${Date.now()}`,
      name: trimmedName,
      code: newCode,
      slogan: newGroupForm.slogan.trim() || 'Cùng nhau duy trì kỷ luật mỗi ngày!',
      groupStreakDays: 1,
      weeklyChallengeTitle: `Thử thách ${newGroupForm.targetMin || 600} phút tập luyện nhóm`,
      weeklyChallengeTargetMin: parseInt(newGroupForm.targetMin, 10) || 600,
      weeklyChallengeCurrentMin: 165,
      members: [
        {
          id: 'mem-1',
          name: profile.name,
          handle: '@ban_fitness',
          avatarBg: 'bg-[#C8FF00] text-zinc-950',
          initials: 'BT',
          isCurrentUser: true,
          completedWorkouts: 14,
          totalMinutes: 165,
          streakDays,
          points: userPoints,
          weeklyDelta: 'Trưởng nhóm'
        }
      ]
    };

    setGroups((prev) => [created, ...prev]);
    setActiveGroupId(created.id);
    setIsCreateGroupOpen(false);
    setNewGroupForm({ name: '', slogan: '', targetMin: '600' });
    setNewGroupError('');
    triggerToast('Đã tạo nhóm tập luyện mới!', `Mã mời nhóm của bạn là ${created.code}`);
  };

  // Join Group by Code
  const handleJoinGroupByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinGroupCode.trim().toUpperCase();
    if (!clean) {
      triggerToast('Vui lòng nhập mã nhóm để tham gia', undefined, 'warning');
      return;
    }
    const existing = groups.find((g) => g.code.toUpperCase() === clean);
    if (existing) {
      setActiveGroupId(existing.id);
      setJoinGroupCode('');
      triggerToast(`Đã chuyển tới ${existing.name}`, `Chuỗi nhóm hiện tại: 🔥 ${existing.groupStreakDays} ngày`);
      return;
    }

    // Create joined community group
    const joined: FitnessGroup = {
      id: `grp-join-${Date.now()}`,
      name: `Cộng đồng Fitness (${clean})`,
      code: clean,
      slogan: 'Bứt phá giới hạn thể lực cùng đồng đội',
      groupStreakDays: 8,
      weeklyChallengeTitle: 'Thử thách 500 phút Cardio & Core',
      weeklyChallengeTargetMin: 500,
      weeklyChallengeCurrentMin: 390,
      members: [
        {
          id: 'mem-j1',
          name: 'Quốc Bảo',
          handle: '@baofit_vn',
          avatarBg: 'bg-emerald-400 text-zinc-950',
          initials: 'QB',
          completedWorkouts: 15,
          totalMinutes: 190,
          streakDays: 7,
          points: 490,
          weeklyDelta: '+60 pts'
        },
        {
          id: 'mem-1',
          name: profile.name,
          handle: '@ban_fitness',
          avatarBg: 'bg-[#C8FF00] text-zinc-950',
          initials: 'BT',
          isCurrentUser: true,
          completedWorkouts: 14,
          totalMinutes: 165,
          streakDays,
          points: userPoints,
          weeklyDelta: 'Mới tham gia'
        }
      ]
    };

    setGroups((prev) => [...prev, joined]);
    setActiveGroupId(joined.id);
    setJoinGroupCode('');
    triggerToast('Tham gia nhóm thành công!', `Bạn đã gia nhập "${joined.name}"`);
  };

  // Complete Onboarding Wizard
  const handleCompleteOnboarding = () => {
    if (!onboardingDraft.name.trim()) {
      setOnboardingError('Vui lòng nhập tên hiển thị của bạn.');
      return;
    }
    if (onboardingDraft.heightCm < 100 || onboardingDraft.heightCm > 240) {
      setOnboardingError('Chiều cao phải nằm trong khoảng 100cm – 240cm.');
      return;
    }
    if (onboardingDraft.weightKg < 25 || onboardingDraft.weightKg > 250) {
      setOnboardingError('Cân nặng phải nằm trong khoảng 25kg – 250kg.');
      return;
    }

    const updatedProfile: UserProfile = {
      ...onboardingDraft,
      onboarded: true
    };
    setProfile(updatedProfile);
    const newRec = buildPersonalizedRecommendation(updatedProfile);
    setCurrentRecommendation(newRec);
    setOnboardingError('');
    setActiveNav('dashboard');
    triggerToast(
      'Hoàn tất thiết lập Hồ sơ AI Fitness Pro!',
      `Đã tạo lộ trình "${GOAL_META[updatedProfile.goal].shortLabel}" ${updatedProfile.availableTimeMin} phút/ngày cho ${updatedProfile.name}.`
    );
  };

  // -------------------------------------------------------------------------
  // Navigation Config
  // -------------------------------------------------------------------------

  const navItems: { id: NavSection; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Tổng quan (Dashboard)', shortLabel: 'Tổng quan', icon: Activity },
    { id: 'coach', label: 'AI Fitness Coach', shortLabel: 'AI Coach', icon: Brain, badge: 'AI' },
    { id: 'workout-plan', label: 'Lịch tập cá nhân', shortLabel: 'Lịch tập', icon: Calendar },
    { id: 'body-metrics', label: 'Chỉ số Cơ thể & BMI', shortLabel: 'Chỉ số', icon: Scale },
    { id: 'daily-stats', label: 'Thống kê Hoạt động', shortLabel: 'Thống kê', icon: BarChart3 },
    { id: 'streaks', label: 'Chuỗi Streak & Huy hiệu', shortLabel: 'Streak', icon: Flame, badge: `${streakDays}d` },
    { id: 'groups', label: 'Nhóm & Bảng xếp hạng', shortLabel: 'Nhóm BXH', icon: Trophy },
    { id: 'onboarding', label: 'Thiết lập Hồ sơ (Onboarding)', shortLabel: 'Hồ sơ', icon: Sliders }
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-zinc-900 font-sans antialiased selection:bg-[#C8FF00] selection:text-zinc-950 pb-20 lg:pb-0">
      {/* Top Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-zinc-950 text-white border border-[#C8FF00]/40 rounded-xl shadow-2xl px-4 py-3.5 flex items-start gap-3 transition-all">
          <div className="w-8 h-8 rounded-lg bg-[#C8FF00] text-zinc-950 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{toastMessage.title}</p>
            {toastMessage.subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{toastMessage.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white p-1"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout Shell: Sidebar (Desktop) + Content + Contextual Right Panel */}
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col bg-[#09090B] text-white border-r border-zinc-800/80 shrink-0 select-none">
          {/* Brand Header */}
          <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C8FF00] text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-[#C8FF00]/20">
                <Flame className="w-6 h-6 fill-zinc-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-lg text-white">AI Fitness Pro</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30">
                    2.0
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Trợ lý tập luyện & Cùng tiến</p>
              </div>
            </div>
          </div>

          {/* User Quick Summary Pill */}
          <div className="px-4 pt-5 pb-2">
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#C8FF00] text-zinc-950 font-bold text-sm flex items-center justify-center shrink-0">
                  BT
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
                  <p className="text-xs text-zinc-400 truncate">
                    {GOAL_META[profile.goal].shortLabel} • {profile.weightKg}kg
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                <Flame className="w-3.5 h-3.5 text-[#C8FF00] fill-[#C8FF00]" />
                <span className="text-xs font-bold tabular-nums text-white">{streakDays}d</span>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Links */}
          <nav className="flex-1 px-3 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#C8FF00] text-zinc-950 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums ${
                        isActive
                          ? 'bg-zinc-950 text-[#C8FF00]'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Live Workout Timer Mini Box inside Sidebar */}
          <div className="p-4 m-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C8FF00]" />
                Đồng hồ bấm giờ tập
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C8FF00]">
                {timerActive ? 'Đang chạy' : 'Sẵn sàng'}
              </span>
            </div>
            <div className="text-2xl font-black tabular-nums text-white tracking-tight mb-3">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerActive((prev) => !prev)}
                className="flex-1 py-2 px-3 rounded-lg bg-[#C8FF00] text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#d4ff33] transition"
              >
                {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {timerActive ? 'Tạm dừng' : 'Bắt đầu'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerActive(false);
                  setTimerSeconds(0);
                }}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition"
                aria-label="Đặt lại đồng hồ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Center Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Sticky Header */}
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="lg:hidden w-9 h-9 rounded-xl bg-zinc-950 text-[#C8FF00] flex items-center justify-center font-black shrink-0">
                <Flame className="w-5 h-5 fill-[#C8FF00]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-zinc-950 truncate">
                  {navItems.find((n) => n.id === activeNav)?.label}
                </h1>
                <p className="text-xs text-zinc-500 hidden sm:block">
                  Thứ Năm, 05/11/2026 • Mục tiêu: {GOAL_META[profile.goal].label}
                </p>
              </div>
            </div>

            {/* Right Status Pills */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Smart 19:30 Reminder Pill */}
              <button
                type="button"
                onClick={() => setActiveNav('workout-plan')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/70 text-zinc-800 text-xs font-medium transition"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lịch hôm nay: <strong>{profile.preferredTimeSlot}</strong> ({profile.availableTimeMin}p)</span>
              </button>

              {/* Points Pill */}
              <button
                type="button"
                onClick={() => setActiveNav('groups')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold tabular-nums transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{userPoints} pts</span>
              </button>

              {/* Streak Badge */}
              <button
                type="button"
                onClick={() => setActiveNav('streaks')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-bold tabular-nums shadow-sm hover:bg-zinc-800 transition"
              >
                <Flame className="w-3.5 h-3.5 text-[#C8FF00] fill-[#C8FF00]" />
                <span>{streakDays} ngày</span>
              </button>
            </div>
          </header>

          {/* Smart Schedule Notification Banner (Preserved & Upgraded from original app) */}
          <div className="bg-zinc-950 text-white px-4 sm:px-6 lg:px-8 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#C8FF00] text-zinc-950 font-bold text-[11px] uppercase tracking-wider">
                Nhắc lịch AI
              </span>
              <span className="text-zinc-200">
                ⏰ Thông báo hôm nay: Bạn có <strong>{profile.availableTimeMin} phút</strong> rảnh lúc{' '}
                <strong className="text-[#C8FF00]">{profile.preferredTimeSlot}</strong>, sẵn sàng tập để nâng chuỗi lên{' '}
                <strong>{todayCompleted ? streakDays : streakDays + 1} ngày</strong> nhé!
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!todayCompleted ? (
                <button
                  type="button"
                  onClick={handleCompleteTodayWorkout}
                  className="text-xs font-bold px-3 py-1 rounded-md bg-[#C8FF00] text-zinc-950 hover:bg-[#d4ff33] transition"
                >
                  🎯 Hoàn thành ngay (+50 pts)
                </button>
              ) : (
                <span className="text-xs font-semibold text-[#C8FF00] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành hôm nay
                </span>
              )}
            </div>
          </div>

          {/* Page Content Switcher */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* ===============================================================
                SECTION A: DASHBOARD / OVERVIEW
               =============================================================== */}
            {activeNav === 'dashboard' && (
              <div className="space-y-6">
                {/* Top Hero Card with Generated Architectural Studio Image */}
                <div className="relative rounded-2xl overflow-hidden bg-zinc-950 text-white border border-zinc-800 shadow-lg">
                  <div
                    className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_20%,#C8FF00_0%,transparent_45%)]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/40" />

                  <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-[#C8FF00]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Trợ lý AI Cá nhân hóa • {EXPERIENCE_META[profile.experience].label}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        Chào buổi chiều, {profile.name}! Sẵn sàng cho ca tập {profile.preferredTimeSlot}?
                      </h2>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        Mục tiêu hiện tại: <strong className="text-white">{GOAL_META[profile.goal].label}</strong>. Hôm nay bạn có lộ trình{' '}
                        <strong className="text-[#C8FF00]">{todayPlan.title}</strong> ({todayPlan.durationMin} phút) và thực đơn{' '}
                        <strong className="text-white">{BUDGET_META[profile.budgetTier].label}</strong>.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCompleteTodayWorkout}
                          disabled={todayCompleted}
                          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                            todayCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-[#C8FF00] text-zinc-950 hover:bg-[#d4ff33] shadow-lg shadow-[#C8FF00]/20'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {todayCompleted
                            ? 'Đã hoàn thành & Cộng +50 điểm hôm nay'
                            : '🎯 Hoàn thành bài tập hôm nay (+50 điểm & +1 Streak)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveNav('coach')}
                          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-semibold text-sm flex items-center gap-2 transition"
                        >
                          <Brain className="w-4 h-4 text-[#C8FF00]" />
                          <span>Hỏi AI Fitness Coach</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOnboardingDraft(profile);
                            setOnboardingStep(1);
                            setActiveNav('onboarding');
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700 transition"
                        >
                          Chỉnh sửa mục tiêu
                        </button>
                      </div>
                    </div>

                    {/* Quick Streak & Rank Snapshot Box */}
                    <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl p-5 min-w-[240px] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Chuỗi tập luyện</span>
                        <span className="text-xs font-semibold text-[#C8FF00]">Kỷ lục: {longestStreak}d</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tabular-nums text-white">{streakDays}</span>
                        <span className="text-sm font-semibold text-zinc-400">ngày liên tiếp 🔥</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Hạng Nhóm "Cùng Tiến"</span>
                        <span className="font-bold text-[#C8FF00]">#1 ({userPoints} pts)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Key KPI Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Calories Burned */}
                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Calo tiêu hao hôm nay</span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 text-[#C8FF00] flex items-center justify-center">
                        <Flame className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="my-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold tabular-nums text-zinc-950">{todayCaloriesBurned}</span>
                        <span className="text-xs font-semibold text-zinc-500">/ {GOAL_META[profile.goal].targetCal} kcal</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full bg-zinc-950 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((todayCaloriesBurned / GOAL_META[profile.goal].targetCal) * 100))}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500">
                        Đạt {Math.min(100, Math.round((todayCaloriesBurned / GOAL_META[profile.goal].targetCal) * 100))}% mục tiêu ngày
                      </p>
                    </div>
                  </div>

                  {/* Workout Duration */}
                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Thời lượng vận động</span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="my-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold tabular-nums text-zinc-950">
                          {todayCompleted ? profile.availableTimeMin : Math.round(timerSeconds / 60)}
                        </span>
                        <span className="text-xs font-semibold text-zinc-500">/ {profile.availableTimeMin} phút</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Tuần này: <strong>115 phút</strong></span>
                      <span className="text-emerald-600 font-semibold">+18% vs tuần trước</span>
                    </div>
                  </div>

                  {/* Body Weight & BMI */}
                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cân nặng & BMI</span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
                        <Scale className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="my-3 flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-extrabold tabular-nums text-zinc-950">{profile.weightKg}</span>
                        <span className="text-xs font-semibold text-zinc-500 ml-1">kg</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${bmiMeta.colorClass}`}>
                        BMI {currentBMI}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Mục tiêu: {profile.targetWeightKg}kg</span>
                      <button
                        type="button"
                        onClick={() => setActiveNav('body-metrics')}
                        className="font-semibold text-zinc-900 hover:underline flex items-center gap-0.5"
                      >
                        <span>Cập nhật</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Steps & Daily Activity */}
                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Bước chân & Điểm</span>
                      <div className="w-8 h-8 rounded-lg bg-[#C8FF00] text-zinc-950 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="my-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold tabular-nums text-zinc-950">7,450</span>
                        <span className="text-xs font-semibold text-zinc-500">/ 8,000 bước</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Chuỗi nhóm Cùng Tiến</span>
                      <span className="font-bold text-zinc-950">🔥 {activeGroup.groupStreakDays} ngày</span>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Quick Parameter Adjuster (Original Section 1) + Today's AI Plan & Nutrition (Original Section 2) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left 5 cols: Personal Parameters & Quick AI Generator (Preserved & Upgraded from original app) */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 flex flex-col justify-between space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          1. Thông số & Nhu cầu cá nhân
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Đồng bộ thời gian thực
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-950">Cấu hình Thể trạng & Ngân sách</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Điều chỉnh thông số để Trợ lý AI cập nhật ngay bài tập và thực đơn trong ngày.
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">
                            Chiều cao (cm)
                          </label>
                          <input
                            type="number"
                            min={100}
                            max={240}
                            value={profile.heightCm}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                heightCm: Math.max(100, parseInt(e.target.value, 10) || 170)
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">
                            Cân nặng (kg)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={25}
                            max={250}
                            value={profile.weightKg}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                weightKg: Math.max(25, parseFloat(e.target.value) || 65)
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          />
                        </div>
                      </div>

                      <div className="mt-3.5 grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">
                            Mục tiêu chính
                          </label>
                          <select
                            value={profile.goal}
                            onChange={(e) =>
                              setProfile((prev) => ({ ...prev, goal: e.target.value as FitnessGoalId }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          >
                            {Object.entries(GOAL_META).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.shortLabel}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">
                            Thời gian mỗi ngày (phút)
                          </label>
                          <input
                            type="number"
                            step={5}
                            min={10}
                            max={120}
                            value={profile.availableTimeMin}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                availableTimeMin: Math.max(10, parseInt(e.target.value, 10) || 30)
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          />
                        </div>
                      </div>

                      <div className="mt-3.5">
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Điều kiện Tài chính (Chi tiêu ăn uống / tập luyện)
                        </label>
                        <select
                          value={profile.budgetTier}
                          onChange={(e) =>
                            setProfile((prev) => ({ ...prev, budgetTier: e.target.value as BudgetTier }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                        >
                          <option value="economy">Tiết kiệm (tự nấu ăn sinh viên)</option>
                          <option value="standard">Trung bình (tập gym cơ bản)</option>
                          <option value="premium">Cao cấp (đầy đủ thực phẩm bổ sung)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateAIPlan}
                      disabled={isGeneratingAI}
                      className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-[#C8FF00] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Zap className="w-4 h-4 fill-[#C8FF00]" />
                      <span>
                        {isGeneratingAI ? 'Đang phân tích thông số...' : '⚡ Trợ lý AI gợi ý kế hoạch'}
                      </span>
                    </button>
                  </div>

                  {/* Right 7 cols: AI Recommended Plan + Budget Meal Plan (Section 2 from original app, elevated) */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 flex flex-col justify-between space-y-5">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          2. Lộ trình gợi ý từ AI hôm nay
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800">
                            BMI ước tính: <strong>{currentBMI}</strong>
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#C8FF00]/30 text-zinc-950">
                            {currentRecommendation.durationMin} phút
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-zinc-950">{currentRecommendation.title}</h3>
                      <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                        {currentRecommendation.suitabilityReason}
                      </p>

                      {/* Exercises & Nutrition Split */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Daily Exercises */}
                        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                              <Dumbbell className="w-3.5 h-3.5 text-zinc-900" />
                              Bài tập trong ngày
                            </h4>
                            <button
                              type="button"
                              onClick={() => setActiveNav('workout-plan')}
                              className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-950 underline"
                            >
                              Chi tiết
                            </button>
                          </div>
                          <ul className="space-y-2">
                            {currentRecommendation.exercises.map((ex, i) => (
                              <li
                                key={i}
                                className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-zinc-200/60"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-semibold text-zinc-900 truncate">{ex.name}</p>
                                  <p className="text-[11px] text-zinc-500">
                                    {ex.muscle} • Nghỉ {ex.restSec}s
                                  </p>
                                </div>
                                <span className="font-bold tabular-nums text-zinc-900 bg-zinc-100 px-2 py-1 rounded shrink-0">
                                  {ex.sets} x {ex.reps}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Budget-Matched Nutrition Menu */}
                        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                              Thực đơn theo tài chính
                            </h4>
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {profile.budgetTier === 'economy'
                                ? 'Tiết kiệm'
                                : profile.budgetTier === 'standard'
                                ? 'Trung bình'
                                : 'Cao cấp'}
                            </span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="bg-white p-2.5 rounded-lg border border-zinc-200/60">
                              <span className="font-bold text-zinc-900 block">🌅 Bữa sáng:</span>
                              <span className="text-zinc-600">{currentRecommendation.mealPlan.breakfast}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-zinc-200/60">
                              <span className="font-bold text-zinc-900 block">☀️ Bữa trưa:</span>
                              <span className="text-zinc-600">{currentRecommendation.mealPlan.lunch}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-zinc-200/60">
                              <span className="font-bold text-zinc-900 block">🌙 Bữa tối:</span>
                              <span className="text-zinc-600">{currentRecommendation.mealPlan.dinner}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => handleApplyRecommendationToPlan(currentRecommendation)}
                        className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
                      >
                        + Đồng bộ vào Lịch tập Thứ 5
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteTodayWorkout}
                        disabled={todayCompleted}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                          todayCompleted
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'bg-[#C8FF00] text-zinc-950 hover:bg-[#d4ff33] shadow-sm'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {todayCompleted
                          ? '✅ Đã hoàn thành & Cộng điểm hôm nay'
                          : '🎯 Hoàn thành bài tập (+50 điểm & +1 Streak)'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Weekly Progress Chart + Group Leaderboard Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Weekly Progress Chart */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-zinc-950">Biểu đồ Tiến độ Tuần này</h3>
                        <p className="text-xs text-zinc-500">Lượng calo tiêu hao (kcal) qua các buổi tập trong tuần</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveNav('daily-stats')}
                        className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1"
                      >
                        <span>Xem thống kê chi tiết</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="relative h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={WEEKLY_ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#52525B' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: '#52525B' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#09090B',
                              borderColor: '#27272A',
                              borderRadius: '10px',
                              color: '#FFFFFF',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey="calories" name="Calo đốt (kcal)" radius={[6, 6, 0, 0]}>
                            {WEEKLY_ACTIVITY_DATA.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={index === 3 ? '#C8FF00' : entry.calories > 0 ? '#09090B' : '#E4E4E7'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Nhóm "Cùng Tiến" Leaderboard Snapshot */}
                  <div className="lg:col-span-5 bg-zinc-950 text-white rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-[#C8FF00]" />
                          <h3 className="text-base font-bold text-white">🏆 BXH Nhóm "Cùng Tiến"</h3>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30">
                          Chuỗi nhóm: 🔥 {activeGroup.groupStreakDays} ngày
                        </span>
                      </div>

                      <div className="space-y-2.5 mt-4">
                        {activeGroup.members.map((member, idx) => (
                          <div
                            key={member.id}
                            className={`p-3 rounded-xl border flex items-center justify-between transition ${
                              member.isCurrentUser
                                ? 'bg-zinc-900 border-[#C8FF00]/50'
                                : 'bg-zinc-900/50 border-zinc-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-6 text-xs font-black tabular-nums ${
                                  idx === 0 ? 'text-[#C8FF00]' : 'text-zinc-400'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <div
                                className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${member.avatarBg}`}
                              >
                                {member.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                  {member.name}
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                  {member.completedWorkouts} buổi • {member.totalMinutes} phút
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-[#C8FF00] tabular-nums">
                                🔥 {member.streakDays}d | {member.points} pts
                              </p>
                              <p className="text-[10px] text-zinc-400">{member.weeklyDelta}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveNav('groups')}
                      className="mt-4 w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 flex items-center justify-center gap-1.5 transition"
                    >
                      <Users className="w-4 h-4 text-[#C8FF00]" />
                      <span>Mở bảng xếp hạng đầy đủ & Thử thách nhóm</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                SECTION B: AI FITNESS COACH
               =============================================================== */}
            {activeNav === 'coach' && (
              <div className="space-y-6">
                {/* Honest Data & Transparency Notice */}
                <div className="bg-zinc-950 text-white rounded-2xl p-5 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#C8FF00] text-zinc-950 flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">AI Fitness Coach — Phân tích Trung thực & Cá nhân hóa</h2>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#C8FF00]/20 text-[#C8FF00]">
                          Minh bạch dữ liệu
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        AI Coach chỉ phân tích dựa trên các thông số bạn đã cung cấp ({profile.heightCm}cm, {profile.weightKg}kg, mục tiêu{' '}
                        {GOAL_META[profile.goal].shortLabel}, {profile.availableTimeMin} phút/ngày, giới hạn: "{profile.limitations}"). Không bao giờ tự bịa đặt nhịp tim, huyết áp hay dữ liệu y tế chưa được nhập.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAIPlan}
                    className="px-4 py-2.5 rounded-xl bg-[#C8FF00] text-zinc-950 font-bold text-xs shrink-0 hover:bg-[#d4ff33] transition"
                  >
                    ⚡ Tạo lại đề xuất mới
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left 7 cols: Structured AI Workout Recommendation Card */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                          Đề xuất tối ưu hôm nay
                        </span>
                        <h3 className="text-xl font-extrabold text-zinc-950 mt-0.5">
                          {currentRecommendation.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-zinc-950 text-[#C8FF00]">
                          {EXPERIENCE_META[currentRecommendation.difficulty].badge}
                        </span>
                        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-zinc-100 text-zinc-900">
                          {currentRecommendation.durationMin} phút
                        </span>
                      </div>
                    </div>

                    {/* Why this workout is suitable */}
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-zinc-950" />
                        Tại sao lộ trình này phù hợp với bạn?
                      </p>
                      <p className="text-sm text-zinc-700 leading-relaxed">
                        {currentRecommendation.suitabilityReason}
                      </p>
                    </div>

                    {/* Target Muscle Groups */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                        Nhóm cơ mục tiêu (Target Muscle Groups)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentRecommendation.targetMuscles.map((muscle) => (
                          <span
                            key={muscle}
                            className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Detailed Exercises, Sets, Reps, and Rest */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                        Danh sách Bài tập, Số hiệp & Thời gian nghỉ
                      </p>
                      <div className="space-y-2.5">
                        {currentRecommendation.exercises.map((ex, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-zinc-200 hover:border-zinc-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-zinc-950 text-[#C8FF00] font-bold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="text-sm font-bold text-zinc-950">{ex.name}</p>
                                <p className="text-xs text-zinc-500">Nhóm cơ: {ex.muscle}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:shrink-0">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 tabular-nums">
                                {ex.sets} hiệp × {ex.reps}
                              </span>
                              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 tabular-nums">
                                Nghỉ {ex.restSec}s
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recovery & Consistency Recommendation */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                      <Heart className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          Khuyến nghị Phục hồi & Duy trì Thói quen
                        </p>
                        <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                          {currentRecommendation.recoveryNote}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleApplyRecommendationToPlan(currentRecommendation)}
                        className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-[#C8FF00] font-bold text-xs flex items-center gap-2 transition"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Áp dụng lộ trình này vào Lịch tập ({selectedDayPlan.dayLabel})</span>
                      </button>
                    </div>
                  </div>

                  {/* Right 5 cols: Conversational AI Coach Chat */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/90 shadow-sm flex flex-col h-[640px]">
                    <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-950 text-[#C8FF00] flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-950">Trò chuyện cùng AI Coach</h3>
                          <p className="text-[11px] text-zinc-500">Điều chỉnh lịch tập, thực đơn & phục hồi tức thì</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Trực tuyến
                      </span>
                    </div>

                    {/* Chat Messages Scroll Container */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/60">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            msg.sender === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                              msg.sender === 'user'
                                ? 'bg-zinc-950 text-white rounded-br-none'
                                : 'bg-white text-zinc-800 border border-zinc-200/90 rounded-bl-none shadow-sm'
                            }`}
                          >
                            {msg.text}
                            {msg.recommendationSnapshot && (
                              <div className="mt-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                                <p className="font-bold text-zinc-950">
                                  ⚡ {msg.recommendationSnapshot.title}
                                </p>
                                <p className="text-[11px] text-zinc-600">
                                  Thời lượng: {msg.recommendationSnapshot.durationMin} phút •{' '}
                                  {msg.recommendationSnapshot.exercises.length} bài tập
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (msg.recommendationSnapshot) {
                                      setCurrentRecommendation(msg.recommendationSnapshot);
                                      handleApplyRecommendationToPlan(msg.recommendationSnapshot);
                                    }
                                  }}
                                  className="w-full py-1.5 px-3 rounded-lg bg-zinc-950 text-[#C8FF00] font-bold text-[11px]"
                                >
                                  Áp dụng lộ trình này
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 mt-1 px-1">{msg.timestamp}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Prompt Chips */}
                    <div className="px-3 py-2 bg-white border-t border-zinc-100 flex items-center gap-1.5 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => handleSendChat('Hôm nay tôi chỉ có 15 phút rảnh, hãy rút gọn bài tập giúp tôi')}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 shrink-0 transition"
                      >
                        ⏱️ Chỉ có 15 phút
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendChat('Tôi hơi mỏi lưng dưới, cần lưu ý phục hồi gì hôm nay?')}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 shrink-0 transition"
                      >
                        🧘 Tư vấn phục hồi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendChat('Gợi ý thực đơn giàu đạm tiết kiệm cho hôm nay')}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 shrink-0 transition"
                      >
                        🥗 Thực đơn tiết kiệm
                      </button>
                    </div>

                    {/* Chat Input Box */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChat();
                      }}
                      className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Nhập câu hỏi cho AI Coach (VD: Đổi bài Squat sang bài không mỏi gối...)"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                      <button
                        type="submit"
                        className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-[#C8FF00] transition shrink-0"
                        aria-label="Gửi tin nhắn"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                SECTION C: PERSONAL WORKOUT PLAN
               =============================================================== */}
            {activeNav === 'workout-plan' && (
              <div className="space-y-6">
                {/* Plan Configuration Header */}
                <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Lịch tập Cá nhân hóa (Weekly Schedule)
                      </span>
                      <h2 className="text-xl font-extrabold text-zinc-950 mt-0.5">
                        Quản lý Kế hoạch Tập luyện & Bài tập
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Tùy chỉnh các ngày tập trong tuần, thời lượng, cường độ, dụng cụ và chỉnh sửa từng bài tập.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsAddExerciseOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-[#C8FF00] font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm bài tập vào {selectedDayPlan.dayLabel}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteTodayWorkout}
                        disabled={todayCompleted}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                          todayCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#C8FF00] text-zinc-950 hover:bg-[#d4ff33]'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{todayCompleted ? 'Đã hoàn thành hôm nay' : 'Hoàn thành buổi tập (+50 pts)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Weekly Calendar Selector Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-5">
                    {weeklyPlan.map((day) => {
                      const isSelected = day.dayCode === selectedDayCode;
                      return (
                        <button
                          key={day.dayCode}
                          type="button"
                          onClick={() => setSelectedDayCode(day.dayCode)}
                          className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
                              : day.completed
                              ? 'bg-emerald-50/60 border-emerald-200 text-zinc-900 hover:bg-emerald-50'
                              : 'bg-zinc-50 border-zinc-200/80 text-zinc-800 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <span
                              className={`text-xs font-extrabold ${
                                isSelected ? 'text-[#C8FF00]' : 'text-zinc-500'
                              }`}
                            >
                              {day.dayCode}
                            </span>
                            {day.completed ? (
                              <CheckCircle2
                                className={`w-4 h-4 ${
                                  isSelected ? 'text-[#C8FF00]' : 'text-emerald-600'
                                }`}
                              />
                            ) : day.isRestDay ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-semibold">
                                Nghỉ
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold tabular-nums opacity-75">
                                {day.durationMin}p
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold line-clamp-1">{day.focus}</p>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isSelected ? 'text-zinc-400' : 'text-zinc-500'
                              }`}
                            >
                              {day.exercises.length} bài tập
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Day Workout Timeline & Exercise Editor */}
                <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-zinc-950 text-[#C8FF00] text-xs font-bold">
                          {selectedDayPlan.dayLabel}
                        </span>
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          • Cường độ: {selectedDayPlan.intensity.toUpperCase()} • {selectedDayPlan.durationMin} phút
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-zinc-950 mt-1.5">{selectedDayPlan.title}</h3>
                    </div>

                    {/* Quick Day Intensity & Duration Adjusters */}
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedDayPlan.intensity}
                        onChange={(e) => {
                          const val = e.target.value as IntensityLevel;
                          setWeeklyPlan((prev) =>
                            prev.map((d) => (d.dayCode === selectedDayCode ? { ...d, intensity: val } : d))
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg border border-zinc-300 text-xs font-semibold bg-white"
                      >
                        <option value="low">Cường độ Thấp (Recovery)</option>
                        <option value="moderate">Cường độ Vừa (Moderate)</option>
                        <option value="high">Cường độ Cao (High)</option>
                        <option value="hiit">HIIT Đốt mỡ</option>
                      </select>
                    </div>
                  </div>

                  {/* Exercise List */}
                  {selectedDayPlan.exercises.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-300 space-y-3">
                      <Dumbbell className="w-8 h-8 text-zinc-400 mx-auto" />
                      <div>
                        <p className="text-sm font-bold text-zinc-800">Chưa có bài tập nào cho ngày này</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Thêm bài tập thủ công hoặc nhờ AI Fitness Coach tạo lộ trình tự động.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddExerciseOpen(true)}
                        className="px-4 py-2 rounded-xl bg-zinc-950 text-[#C8FF00] font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm bài tập đầu tiên</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayPlan.exercises.map((ex, index) => {
                        const isEditing = editingExerciseId === ex.id;
                        const isDone = ex.completedSets >= ex.sets;
                        return (
                          <div
                            key={ex.id}
                            className={`p-4 rounded-xl border transition ${
                              isDone
                                ? 'bg-emerald-50/40 border-emerald-300'
                                : 'bg-white border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-3.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleExerciseSet(selectedDayCode, ex.id)}
                                  className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 transition ${
                                    isDone
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-zinc-950 text-[#C8FF00] hover:scale-105'
                                  }`}
                                  title="Nhấn để đánh dấu hoàn thành từng hiệp"
                                >
                                  {isDone ? <Check className="w-4 h-4" /> : index + 1}
                                </button>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-bold text-zinc-950">{ex.name}</h4>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                                      {ex.muscleGroup}
                                    </span>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                                      {ex.equipment}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-500 mt-1">
                                    Tiến độ hiệp:{' '}
                                    <strong className="text-zinc-900 tabular-nums">
                                      {ex.completedSets} / {ex.sets} hiệp
                                    </strong>{' '}
                                    • Ước tính ~{ex.caloriesEst} kcal
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 tabular-nums">
                                  {ex.sets} hiệp × {ex.reps}
                                </span>
                                <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 tabular-nums">
                                  Nghỉ {ex.restSec}s
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleExerciseSet(selectedDayCode, ex.id)}
                                  className="px-3 py-1.5 rounded-lg bg-zinc-950 text-[#C8FF00] text-xs font-bold hover:bg-zinc-800 transition"
                                >
                                  +1 Hiệp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingExerciseId(isEditing ? null : ex.id)}
                                  className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                                  aria-label="Chỉnh sửa thông số bài tập"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExerciseDeleteConfirm({
                                      dayCode: selectedDayCode,
                                      exId: ex.id,
                                      exName: ex.name
                                    })
                                  }
                                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                                  aria-label="Xóa bài tập"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inline Editor Row for Sets / Reps / Rest */}
                            {isEditing && (
                              <div className="mt-3 pt-3 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-lg">
                                <div>
                                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                                    Số hiệp (Sets)
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={15}
                                    value={ex.sets}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                      setWeeklyPlan((prev) =>
                                        prev.map((d) =>
                                          d.dayCode === selectedDayCode
                                            ? {
                                                ...d,
                                                exercises: d.exercises.map((item) =>
                                                  item.id === ex.id ? { ...item, sets: val } : item
                                                )
                                              }
                                            : d
                                        )
                                      );
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                                    Số lần / Thời gian (Reps)
                                  </label>
                                  <input
                                    type="text"
                                    value={ex.reps}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setWeeklyPlan((prev) =>
                                        prev.map((d) =>
                                          d.dayCode === selectedDayCode
                                            ? {
                                                ...d,
                                                exercises: d.exercises.map((item) =>
                                                  item.id === ex.id ? { ...item, reps: val } : item
                                                )
                                              }
                                            : d
                                        )
                                      );
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                                    Nghỉ giữa hiệp (giây)
                                  </label>
                                  <input
                                    type="number"
                                    step={5}
                                    min={0}
                                    max={300}
                                    value={ex.restSec}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                      setWeeklyPlan((prev) =>
                                        prev.map((d) =>
                                          d.dayCode === selectedDayCode
                                            ? {
                                                ...d,
                                                exercises: d.exercises.map((item) =>
                                                  item.id === ex.id ? { ...item, restSec: val } : item
                                                )
                                              }
                                            : d
                                        )
                                      );
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 text-xs font-bold"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingExerciseId(null);
                                      triggerToast('Đã lưu cập nhật bài tập', ex.name);
                                    }}
                                    className="w-full py-1.5 px-3 rounded bg-zinc-950 text-[#C8FF00] font-bold text-xs"
                                  >
                                    Hoàn tất sửa
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===============================================================
                SECTION D: BODY METRICS & PROGRESS TRACKING
               =============================================================== */}
            {activeNav === 'body-metrics' && (
              <div className="space-y-6">
                {/* Non-Medical & Measured vs Calculated Distinction Banner */}
                <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-950 text-[#C8FF00] flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-zinc-950">
                        Theo dõi Chỉ số Cơ thể & Tiến độ Cá nhân
                      </h2>
                      <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                        Hệ thống phân biệt rõ <strong>Chỉ số do bạn nhập (User-Entered)</strong> và{' '}
                        <strong>Chỉ số tính toán ước lượng (Calculated Estimate)</strong>. Chỉ số BMI chỉ mang tính chất tham khảo thể hình, không phải là chẩn đoán y khoa.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top 4 Metric Cards with Explicit Source Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-500">Cân nặng hiện tại</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                        Bạn nhập (Measured)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 my-2">
                      <span className="text-3xl font-extrabold tabular-nums text-zinc-950">{profile.weightKg}</span>
                      <span className="text-xs font-semibold text-zinc-500">kg</span>
                    </div>
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      Giảm 2.4 kg so với tháng 9
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-500">Chiều cao</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                        Bạn nhập (Measured)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 my-2">
                      <span className="text-3xl font-extrabold tabular-nums text-zinc-950">{profile.heightCm}</span>
                      <span className="text-xs font-semibold text-zinc-500">cm</span>
                    </div>
                    <p className="text-xs text-zinc-500">Cơ sở tính toán tỷ lệ cơ thể</p>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-500">Chỉ số BMI</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Ước tính (Calculated)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 my-2">
                      <span className="text-3xl font-extrabold tabular-nums text-zinc-950">{currentBMI}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${bmiMeta.colorClass}`}>
                        {bmiMeta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">Công thức: kg / (m²)</p>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-500">Tỷ lệ mỡ & Cơ xương</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                        Tùy chọn nhập
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 my-2">
                      <div>
                        <span className="text-2xl font-extrabold tabular-nums text-zinc-950">
                          {profile.bodyFatPct ?? '--'}%
                        </span>
                        <span className="text-[11px] text-zinc-500 block">Body Fat</span>
                      </div>
                      <div className="border-l border-zinc-200 pl-3">
                        <span className="text-2xl font-extrabold tabular-nums text-zinc-950">
                          {profile.muscleMassKg ?? '--'}kg
                        </span>
                        <span className="text-[11px] text-zinc-500 block">Cơ xương</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart + Log New Measurement Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Historical Weight & Body Fat Chart */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-zinc-950">Biểu đồ Biến thiên Cân nặng (kg)</h3>
                        <p className="text-xs text-zinc-500">So sánh lịch sử đo lường theo tuần & tháng</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800">
                        Mục tiêu: {profile.targetWeightKg} kg
                      </span>
                    </div>
                    <div className="relative h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metricsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#09090B" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#09090B" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                          <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#09090B',
                              borderColor: '#27272A',
                              borderRadius: '10px',
                              color: '#FFFFFF',
                              fontSize: '12px'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="weightKg"
                            name="Cân nặng (kg)"
                            stroke="#09090B"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#weightGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Add Measurement Form */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6">
                    <h3 className="text-base font-bold text-zinc-950">Ghi nhận Chỉ số Mới</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Cập nhật số đo thực tế để theo dõi tiến độ chính xác.
                    </p>

                    <form onSubmit={handleAddMetricEntry} className="mt-4 space-y-3.5">
                      {metricFormError && (
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                          {metricFormError}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">
                            Cân nặng (kg) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={newMetricForm.weightKg}
                            onChange={(e) => setNewMetricForm((p) => ({ ...p, weightKg: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm font-bold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">
                            Chiều cao (cm) *
                          </label>
                          <input
                            type="number"
                            value={newMetricForm.heightCm}
                            onChange={(e) => setNewMetricForm((p) => ({ ...p, heightCm: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                            Body Fat (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={newMetricForm.bodyFatPct}
                            onChange={(e) => setNewMetricForm((p) => ({ ...p, bodyFatPct: e.target.value }))}
                            className="w-full px-2.5 py-2 rounded-lg border border-zinc-300 text-xs font-bold"
                            placeholder="Tùy chọn"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                            Cơ xương (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={newMetricForm.muscleMassKg}
                            onChange={(e) => setNewMetricForm((p) => ({ ...p, muscleMassKg: e.target.value }))}
                            className="w-full px-2.5 py-2 rounded-lg border border-zinc-300 text-xs font-bold"
                            placeholder="Tùy chọn"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                            Vòng eo (cm)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={newMetricForm.waistCm}
                            onChange={(e) => setNewMetricForm((p) => ({ ...p, waistCm: e.target.value }))}
                            className="w-full px-2.5 py-2 rounded-lg border border-zinc-300 text-xs font-bold"
                            placeholder="Tùy chọn"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Ghi chú đo lường
                        </label>
                        <input
                          type="text"
                          value={newMetricForm.note}
                          onChange={(e) => setNewMetricForm((p) => ({ ...p, note: e.target.value }))}
                          placeholder="VD: Đo sáng sớm sau khi thức dậy"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-[#C8FF00] font-bold text-xs transition"
                      >
                        + Lưu bản ghi chỉ số cơ thể
                      </button>
                    </form>
                  </div>
                </div>

                {/* Measurement History Table */}
                <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6">
                  <h3 className="text-base font-bold text-zinc-950 mb-4">Lịch sử Đo lường Chi tiết</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500 uppercase">
                          <th className="py-2.5 px-3">Ngày đo</th>
                          <th className="py-2.5 px-3">Cân nặng (Bạn nhập)</th>
                          <th className="py-2.5 px-3">BMI (Tính toán)</th>
                          <th className="py-2.5 px-3">Body Fat %</th>
                          <th className="py-2.5 px-3">Khối lượng cơ</th>
                          <th className="py-2.5 px-3">Ghi chú</th>
                          <th className="py-2.5 px-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {metricsHistory.map((item) => {
                          const bmi = calculateBMI(item.weightKg, item.heightCm);
                          return (
                            <tr key={item.id} className="hover:bg-zinc-50">
                              <td className="py-3 px-3 font-semibold text-zinc-900 tabular-nums">{item.date}</td>
                              <td className="py-3 px-3 font-bold text-zinc-950 tabular-nums">{item.weightKg} kg</td>
                              <td className="py-3 px-3 tabular-nums">
                                <span className="px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-800">
                                  {bmi}
                                </span>
                              </td>
                              <td className="py-3 px-3 tabular-nums text-zinc-700">
                                {item.bodyFatPct ? `${item.bodyFatPct}%` : '—'}
                              </td>
                              <td className="py-3 px-3 tabular-nums text-zinc-700">
                                {item.muscleMassKg ? `${item.muscleMassKg} kg` : '—'}
                              </td>
                              <td className="py-3 px-3 text-zinc-500">{item.note}</td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setMetricDeleteTargetId(item.id)}
                                  className="text-rose-600 hover:text-rose-800 font-semibold"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                SECTION E: DAILY STATISTICS
               =============================================================== */}
            {activeNav === 'daily-stats' && (
              <div className="space-y-6">
                {/* Period Filter Header (Day / Week / Month) */}
                <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-zinc-950">Thống kê Hoạt động & Hiệu suất</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Theo dõi tỷ lệ hoàn thành bài tập, thời lượng vận động và calo đốt cháy theo Ngày, Tuần, Tháng.
                    </p>
                  </div>
                  <div className="inline-flex p-1 rounded-xl bg-zinc-100 border border-zinc-200 self-start">
                    {(['day', 'week', 'month'] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setStatsPeriod(period)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                          statsPeriod === period
                            ? 'bg-zinc-950 text-[#C8FF00] shadow-sm'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        {period === 'day' ? 'Theo Ngày' : period === 'week' ? 'Theo Tuần' : 'Theo Tháng'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Stat Cards for Selected Period */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm">
                    <span className="text-xs font-semibold text-zinc-500">Số buổi tập hoàn thành</span>
                    <div className="text-3xl font-extrabold tabular-nums text-zinc-950 my-2">
                      {statsPeriod === 'day' ? (todayCompleted ? '1 / 1' : '0 / 1') : statsPeriod === 'week' ? '4 / 5' : '18 / 20'}
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold">Đạt mục tiêu kỷ luật</span>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm">
                    <span className="text-xs font-semibold text-zinc-500">Tổng thời gian tập</span>
                    <div className="text-3xl font-extrabold tabular-nums text-zinc-950 my-2">
                      {statsPeriod === 'day' ? '30 phút' : statsPeriod === 'week' ? '115 phút' : '635 phút'}
                    </div>
                    <span className="text-xs text-zinc-500">Trung bình 31.5 phút/buổi</span>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm">
                    <span className="text-xs font-semibold text-zinc-500">Tổng Calo tiêu hao</span>
                    <div className="text-3xl font-extrabold tabular-nums text-zinc-950 my-2">
                      {statsPeriod === 'day' ? `${todayCaloriesBurned} kcal` : statsPeriod === 'week' ? '1,260 kcal' : '8,270 kcal'}
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold">Ước tính từ METs bài tập</span>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-zinc-200/90 shadow-sm">
                    <span className="text-xs font-semibold text-zinc-500">Tỷ lệ hoàn thành</span>
                    <div className="text-3xl font-extrabold tabular-nums text-zinc-950 my-2">
                      {statsPeriod === 'day' ? (todayCompleted ? '100%' : '65%') : statsPeriod === 'week' ? '88%' : '91%'}
                    </div>
                    <span className="text-xs text-zinc-500">Top 5% nhóm Cùng Tiến</span>
                  </div>
                </div>

                {/* Dynamic Chart by Period + 28-Day Activity Consistency Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6">
                    <h3 className="text-base font-bold text-zinc-950 mb-1">
                      {statsPeriod === 'month'
                        ? 'Thống kê 4 Tuần Gần nhất (Calo & Thời lượng)'
                        : 'Biểu đồ Hoạt động Chi tiết'}
                    </h3>
                    <p className="text-xs text-zinc-500 mb-4">
                      Trực quan hóa năng lượng tiêu hao và thời gian rèn luyện
                    </p>
                    <div className="relative h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={statsPeriod === 'month' ? MONTHLY_ACTIVITY_DATA : WEEKLY_ACTIVITY_DATA}
                          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                          <XAxis
                            dataKey={statsPeriod === 'month' ? 'label' : 'day'}
                            tick={{ fontSize: 12, fill: '#52525B' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis tick={{ fontSize: 12, fill: '#52525B' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#09090B',
                              borderColor: '#27272A',
                              borderRadius: '10px',
                              color: '#FFFFFF',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey="calories" name="Calo tiêu hao (kcal)" fill="#09090B" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 28-Day Activity Heatmap */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-zinc-950">Bản đồ Nhiệt Kỷ luật 28 Ngày (Heatmap)</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Mỗi ô biểu thị mức độ hoàn thành mục tiêu vận động trong ngày
                      </p>

                      <div className="mt-5 grid grid-cols-7 gap-2">
                        {Array.from({ length: 28 }).map((_, idx) => {
                          const intensity =
                            idx === 27
                              ? todayCompleted
                                ? 3
                                : 2
                              : (idx * 7 + 3) % 5 === 0
                              ? 0
                              : (idx % 3) + 1;
                          const bgClass =
                            intensity === 3
                              ? 'bg-[#C8FF00] border-[#a8d900] text-zinc-950 font-bold'
                              : intensity === 2
                              ? 'bg-zinc-950 text-white'
                              : intensity === 1
                              ? 'bg-zinc-300 text-zinc-800'
                              : 'bg-zinc-100 text-zinc-400';
                          return (
                            <div
                              key={idx}
                              className={`h-10 rounded-lg border flex items-center justify-center text-xs tabular-nums ${bgClass}`}
                              title={`Ngày ${idx + 1}: Mức độ hoạt động ${intensity}/3`}
                            >
                              {idx + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                      <span>Ít vận động</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-zinc-100 border border-zinc-200" />
                        <span className="w-3.5 h-3.5 rounded bg-zinc-300" />
                        <span className="w-3.5 h-3.5 rounded bg-zinc-950" />
                        <span className="w-3.5 h-3.5 rounded bg-[#C8FF00]" />
                      </div>
                      <span>Đạt đỉnh 100%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                SECTION F: STREAK & GAMIFICATION
               =============================================================== */}
            {activeNav === 'streaks' && (
              <div className="space-y-6">
                {/* Top Streak Hero Banner */}
                <div className="bg-zinc-950 text-white rounded-2xl p-6 sm:p-8 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8FF00]/15 text-[#C8FF00] text-xs font-bold">
                      <Flame className="w-4 h-4 fill-[#C8FF00]" />
                      <span>Hệ thống Xây dựng Thói quen Bền vững</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      Chuỗi hiện tại: {streakDays} Ngày Liên Tiếp 🔥
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      Kỷ luật không phải là sự hoàn hảo tuyệt đối — chỉ cần 15–30 phút vận động mỗi ngày hoặc một buổi giãn cơ chủ động cũng giúp bạn giữ lửa thói quen.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 shrink-0">
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                      <span className="text-2xl font-black tabular-nums text-[#C8FF00]">{streakDays}d</span>
                      <span className="block text-[11px] text-zinc-400 mt-1">Chuỗi hiện tại</span>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                      <span className="text-2xl font-black tabular-nums text-white">{longestStreak}d</span>
                      <span className="block text-[11px] text-zinc-400 mt-1">Kỷ lục cá nhân</span>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                      <span className="text-2xl font-black tabular-nums text-white">{totalActiveDays}</span>
                      <span className="block text-[11px] text-zinc-400 mt-1">Tổng ngày tập</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Challenges + Achievement Badges */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Weekly Challenges */}
                  <div className="lg:col-span-6 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-zinc-950">Thử thách Hàng tuần (Weekly Challenges)</h3>
                        <p className="text-xs text-zinc-500">Hoàn thành thử thách để nhận điểm thưởng BXH</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-900">
                        Điểm của bạn: {userPoints} pts
                      </span>
                    </div>

                    <div className="space-y-3">
                      {challenges.map((ch) => {
                        const pct = Math.min(100, Math.round((ch.progress / ch.target) * 100));
                        const isReadyToClaim = ch.progress >= ch.target && !ch.claimed;
                        return (
                          <div key={ch.id} className="p-4 rounded-xl border border-zinc-200 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-zinc-950">{ch.title}</p>
                                <p className="text-xs text-zinc-500 tabular-nums mt-0.5">
                                  Tiến độ: {ch.progress} / {ch.target} ({pct}%)
                                </p>
                              </div>
                              {ch.claimed ? (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                                  Đã nhận +{ch.rewardPts} pts
                                </span>
                              ) : isReadyToClaim ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChallenges((prev) =>
                                      prev.map((item) => (item.id === ch.id ? { ...item, claimed: true } : item))
                                    );
                                    setUserPoints((p) => p + ch.rewardPts);
                                    triggerToast(
                                      `🎉 Nhận thưởng thành công +${ch.rewardPts} pts!`,
                                      `Bạn đã hoàn thành thử thách "${ch.title}"`
                                    );
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#C8FF00] text-zinc-950 font-bold text-xs animate-bounce"
                                >
                                  Nhận +{ch.rewardPts} pts
                                </button>
                              ) : (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700">
                                  +{ch.rewardPts} pts
                                </span>
                              )}
                            </div>
                            <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                              <div
                                className="h-full bg-zinc-950 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Achievement Badges & Milestones */}
                  <div className="lg:col-span-6 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-zinc-950">Huy hiệu Thành tích & Cột mốc (Milestones)</h3>
                      <p className="text-xs text-zinc-500">Ghi nhận hành trình kiên trì rèn luyện thể lực của bạn</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          title: 'Khởi đầu Kỷ luật',
                          desc: 'Hoàn thành 3 ngày Streak liên tiếp',
                          unlocked: streakDays >= 3,
                          badge: '🔥 3 Ngày'
                        },
                        {
                          title: 'Chiến binh 19:30',
                          desc: 'Tập đúng khung giờ vàng 5 buổi',
                          unlocked: true,
                          badge: '⏰ Đúng giờ'
                        },
                        {
                          title: 'Tuần lễ Không Bỏ Cuộc',
                          desc: 'Chạm mốc chuỗi 7 ngày liên tiếp',
                          unlocked: streakDays >= 7,
                          badge: '🏆 7 Ngày'
                        },
                        {
                          title: 'Thủ lĩnh Nhóm Cùng Tiến',
                          desc: 'Đạt Top 1 BXH Nhóm trong tuần',
                          unlocked: true,
                          badge: '👑 Top #1'
                        },
                        {
                          title: 'Kỷ lục gia 14 Ngày',
                          desc: 'Duy trì 2 tuần liên tục không đứt quãng',
                          unlocked: longestStreak >= 14,
                          badge: '⚡ 14 Ngày'
                        },
                        {
                          title: 'Câu lạc bộ 1,000 Điểm',
                          desc: 'Tích lũy 1,000 điểm thưởng tập luyện',
                          unlocked: userPoints >= 1000,
                          badge: '💎 1000 Pts'
                        }
                      ].map((ach, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border flex flex-col justify-between ${
                            ach.unlocked
                              ? 'bg-zinc-950 text-white border-zinc-900'
                              : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Award
                              className={`w-5 h-5 ${
                                ach.unlocked ? 'text-[#C8FF00]' : 'text-zinc-400'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                ach.unlocked
                                  ? 'bg-[#C8FF00] text-zinc-950'
                                  : 'bg-zinc-200 text-zinc-600'
                              }`}
                            >
                              {ach.unlocked ? ach.badge : 'Chưa mở khóa'}
                            </span>
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${ach.unlocked ? 'text-white' : 'text-zinc-700'}`}>
                              {ach.title}
                            </p>
                            <p className="text-xs opacity-75 mt-0.5">{ach.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                SECTION G: GROUPS & LEADERBOARD
               =============================================================== */}
            {activeNav === 'groups' && (
              <div className="space-y-6">
                {/* Top Social Header: Switch Groups, Create Group, Join by Code */}
                <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Cộng đồng & Thi đua (Social Fitness)
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#C8FF00]/40 text-zinc-950">
                        Chuỗi nhóm: 🔥 {activeGroup.groupStreakDays} ngày
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-zinc-950 mt-1">{activeGroup.name}</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">{activeGroup.slogan}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Group Selector */}
                    <select
                      value={activeGroupId}
                      onChange={(e) => setActiveGroupId(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-zinc-300 text-xs font-bold bg-white"
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.members.length} thành viên)
                        </option>
                      ))}
                    </select>

                    {/* Copy Invite Code Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyInviteCode(activeGroup.code)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Mã mời: {activeGroup.code}</span>
                    </button>

                    {/* Create New Group Button */}
                    <button
                      type="button"
                      onClick={() => setIsCreateGroupOpen(true)}
                      className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-[#C8FF00] font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tạo nhóm mới</span>
                    </button>
                  </div>
                </div>

                {/* Group Challenge Progress + Join Group Box */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 bg-zinc-950 text-white rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#C8FF00]">
                          Thử thách chung toàn nhóm tuần này
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          {activeGroup.weeklyChallengeTitle}
                        </h3>
                      </div>
                      <span className="text-sm font-black tabular-nums text-[#C8FF00]">
                        {activeGroup.weeklyChallengeCurrentMin} / {activeGroup.weeklyChallengeTargetMin} phút
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-[#C8FF00] rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (activeGroup.weeklyChallengeCurrentMin / activeGroup.weeklyChallengeTargetMin) * 100
                              )
                            )}%`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Tổng số buổi tập cả nhóm: 47 buổi</span>
                        <span>Còn {Math.max(0, activeGroup.weeklyChallengeTargetMin - activeGroup.weeklyChallengeCurrentMin)} phút để mở khóa Huy hiệu Nhóm</span>
                      </div>
                    </div>
                  </div>

                  {/* Join Existing Group by Code */}
                  <div className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-950">Tham gia Nhóm bằng Mã mời</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Nhập mã nhóm từ bạn bè (VD: <strong>VNSWEAT5AM</strong> hoặc mã bất kỳ) để cùng thi đua.
                      </p>
                    </div>
                    <form onSubmit={handleJoinGroupByCode} className="mt-4 flex items-center gap-2">
                      <input
                        type="text"
                        value={joinGroupCode}
                        onChange={(e) => setJoinGroupCode(e.target.value)}
                        placeholder="Nhập mã nhóm..."
                        className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-zinc-950 text-[#C8FF00] font-bold text-xs shrink-0 hover:bg-zinc-800 transition"
                      >
                        Tham gia
                      </button>
                    </form>
                  </div>
                </div>

                {/* Full Leaderboard Table with Scope Switcher */}
                <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-base font-bold text-zinc-950">
                        🏆 Bảng Xếp Hạng Tuần ({rankingScope === 'group' ? activeGroup.name : 'Toàn hệ thống Cá nhân'})
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Xếp hạng cập nhật tức thì theo Điểm kỷ luật, Số buổi tập, Tổng thời gian và Chuỗi Streak
                      </p>
                    </div>

                    <div className="inline-flex p-1 rounded-xl bg-zinc-100 border border-zinc-200 self-start">
                      <button
                        type="button"
                        onClick={() => setRankingScope('group')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                          rankingScope === 'group'
                            ? 'bg-zinc-950 text-[#C8FF00]'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        Xếp hạng Nhóm
                      </button>
                      <button
                        type="button"
                        onClick={() => setRankingScope('personal')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                          rankingScope === 'personal'
                            ? 'bg-zinc-950 text-[#C8FF00]'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        Xếp hạng Cá nhân Chung
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500 uppercase">
                          <th className="py-3 px-4">Hạng (Rank)</th>
                          <th className="py-3 px-4">Thành viên (Avatar & Username)</th>
                          <th className="py-3 px-4">Buổi tập hoàn thành</th>
                          <th className="py-3 px-4">Tổng thời gian</th>
                          <th className="py-3 px-4">Chuỗi Streak</th>
                          <th className="py-3 px-4 text-right">Tổng điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {(rankingScope === 'group'
                          ? activeGroup.members
                          : [
                              ...activeGroup.members,
                              {
                                id: 'global-1',
                                name: 'Khánh Linh',
                                handle: '@linh_cardio',
                                avatarBg: 'bg-lime-400 text-zinc-950',
                                initials: 'KL',
                                completedWorkouts: 18,
                                totalMinutes: 240,
                                streakDays: 9,
                                points: 610,
                                weeklyDelta: '+90 pts'
                              }
                            ].sort((a, b) => b.points - a.points)
                        ).map((member, idx) => (
                          <tr
                            key={`${member.id}-${idx}`}
                            className={`transition ${
                              member.isCurrentUser ? 'bg-[#C8FF00]/15 font-semibold' : 'hover:bg-zinc-50'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-black tabular-nums text-sm">
                              {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${member.avatarBg}`}
                                >
                                  {member.initials}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-zinc-950">
                                    {member.name}{' '}
                                    {member.isCurrentUser && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-950 text-[#C8FF00] ml-1">
                                        BẠN
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-zinc-500">{member.handle}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold tabular-nums text-zinc-900">
                              {member.completedWorkouts} buổi
                            </td>
                            <td className="py-3.5 px-4 font-semibold tabular-nums text-zinc-700">
                              {member.totalMinutes} phút
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 text-[#C8FF00] font-bold tabular-nums">
                                🔥 {member.streakDays} ngày
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-sm tabular-nums text-zinc-950">
                              {member.points} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                SECTION H: ONBOARDING EXPERIENCE WIZARD
               =============================================================== */}
            {activeNav === 'onboarding' && (
              <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Thiết lập Cá nhân hóa (Onboarding Flow)
                    </span>
                    <h2 className="text-xl font-extrabold text-zinc-950 mt-0.5">
                      Xây dựng Hồ sơ Thể lực & Lộ trình AI của Bạn
                    </h2>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-950 text-[#C8FF00]">
                    Bước {onboardingStep} / 4
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full bg-zinc-950 transition-all duration-300"
                    style={{ width: `${(onboardingStep / 4) * 100}%` }}
                  />
                </div>

                {onboardingError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                    {onboardingError}
                  </div>
                )}

                {/* STEP 1: Name, Fitness Goal & Experience */}
                {onboardingStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                        1. Tên hiển thị của bạn
                      </label>
                      <input
                        type="text"
                        value={onboardingDraft.name}
                        onChange={(e) => setOnboardingDraft((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Nhập tên hoặc biệt danh..."
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                        2. Mục tiêu Thể hình Chính (Fitness Goal)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(Object.keys(GOAL_META) as FitnessGoalId[]).map((gKey) => {
                          const selected = onboardingDraft.goal === gKey;
                          return (
                            <button
                              key={gKey}
                              type="button"
                              onClick={() => setOnboardingDraft((p) => ({ ...p, goal: gKey }))}
                              className={`p-4 rounded-xl border text-left transition ${
                                selected
                                  ? 'bg-zinc-950 text-white border-zinc-950'
                                  : 'bg-zinc-50 text-zinc-900 border-zinc-200 hover:bg-zinc-100'
                              }`}
                            >
                              <p className="text-sm font-bold">{GOAL_META[gKey].label}</p>
                              <p className={`text-xs mt-1 ${selected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                {GOAL_META[gKey].desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                        3. Kinh nghiệm Tập luyện (Fitness Experience)
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setOnboardingDraft((p) => ({ ...p, experience: lvl }))}
                            className={`p-3.5 rounded-xl border text-center font-bold text-xs transition ${
                              onboardingDraft.experience === lvl
                                ? 'bg-[#C8FF00] text-zinc-950 border-zinc-950'
                                : 'bg-zinc-50 text-zinc-800 border-zinc-200'
                            }`}
                          >
                            {EXPERIENCE_META[lvl].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Available Time, Frequency & Limitations */}
                {onboardingStep === 2 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                          Thời gian tập mỗi buổi (phút)
                        </label>
                        <input
                          type="number"
                          step={5}
                          min={10}
                          max={120}
                          value={onboardingDraft.availableTimeMin}
                          onChange={(e) =>
                            setOnboardingDraft((p) => ({
                              ...p,
                              availableTimeMin: parseInt(e.target.value, 10) || 30
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                          Số buổi tập mỗi tuần (Frequency)
                        </label>
                        <select
                          value={onboardingDraft.daysPerWeek}
                          onChange={(e) =>
                            setOnboardingDraft((p) => ({
                              ...p,
                              daysPerWeek: parseInt(e.target.value, 10) || 5
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold bg-white"
                        >
                          {[2, 3, 4, 5, 6, 7].map((d) => (
                            <option key={d} value={d}>
                              {d} buổi / tuần
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                        Khung giờ tập ưu tiên trong ngày
                      </label>
                      <input
                        type="time"
                        value={onboardingDraft.preferredTimeSlot}
                        onChange={(e) =>
                          setOnboardingDraft((p) => ({ ...p, preferredTimeSlot: e.target.value }))
                        }
                        className="px-4 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                        Giới hạn thể chất hoặc lưu ý chấn thương (nếu có)
                      </label>
                      <input
                        type="text"
                        value={onboardingDraft.limitations}
                        onChange={(e) => setOnboardingDraft((p) => ({ ...p, limitations: e.target.value }))}
                        placeholder="VD: Đau mỏi vai gáy, hạn chế nhảy cao..."
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Equipment & Financial/Nutrition Tier */}
                {onboardingStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                        Dụng cụ Tập luyện Sẵn có (Chọn một hoặc nhiều)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {EQUIPMENT_OPTIONS.map((eq) => {
                          const checked = onboardingDraft.equipment.includes(eq.id);
                          return (
                            <button
                              key={eq.id}
                              type="button"
                              onClick={() => {
                                setOnboardingDraft((p) => ({
                                  ...p,
                                  equipment: checked
                                    ? p.equipment.filter((i) => i !== eq.id)
                                    : [...p.equipment, eq.id]
                                }));
                              }}
                              className={`p-3.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition ${
                                checked
                                  ? 'bg-zinc-950 text-[#C8FF00] border-zinc-950'
                                  : 'bg-zinc-50 text-zinc-800 border-zinc-200'
                              }`}
                            >
                              <span>{eq.label}</span>
                              {checked && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                        Ngân sách Dinh dưỡng & Thực đơn Hàng ngày
                      </label>
                      <div className="space-y-2.5">
                        {(['economy', 'standard', 'premium'] as BudgetTier[]).map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setOnboardingDraft((p) => ({ ...p, budgetTier: tier }))}
                            className={`w-full p-4 rounded-xl border text-left transition ${
                              onboardingDraft.budgetTier === tier
                                ? 'bg-zinc-950 text-white border-zinc-950'
                                : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                            }`}
                          >
                            <p className="text-sm font-bold">{BUDGET_META[tier].label}</p>
                            <p className="text-xs opacity-80 mt-1">
                              Bữa trưa mẫu: {BUDGET_META[tier].meals.lunch}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Body Metrics (Optional & User-Provided) */}
                {onboardingStep === 4 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Chiều cao (cm)</label>
                        <input
                          type="number"
                          value={onboardingDraft.heightCm}
                          onChange={(e) =>
                            setOnboardingDraft((p) => ({ ...p, heightCm: parseInt(e.target.value, 10) || 170 }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Cân nặng hiện tại (kg)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={onboardingDraft.weightKg}
                          onChange={(e) =>
                            setOnboardingDraft((p) => ({ ...p, weightKg: parseFloat(e.target.value) || 65 }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Cân nặng mục tiêu (kg)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={onboardingDraft.targetWeightKg}
                          onChange={(e) =>
                            setOnboardingDraft((p) => ({
                              ...p,
                              targetWeightKg: parseFloat(e.target.value) || 63
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-zinc-900">
                          BMI Ước tính từ thông số của bạn:{' '}
                          <span className="text-base font-black">
                            {calculateBMI(onboardingDraft.weightKg, onboardingDraft.heightCm)}
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Sau khi nhấn Hoàn tất, AI sẽ tự động sinh lộ trình tập luyện cá nhân hóa.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wizard Footer Controls */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep((s) => Math.max(1, s - 1))}
                    disabled={onboardingStep === 1}
                    className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-800 font-bold text-xs flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>

                  {onboardingStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setOnboardingStep((s) => Math.min(4, s + 1))}
                      className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-[#C8FF00] font-bold text-xs flex items-center gap-1"
                    >
                      <span>Tiếp tục</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCompleteOnboarding}
                      className="px-6 py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#d4ff33] text-zinc-950 font-black text-xs flex items-center gap-2 shadow-md"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Hoàn tất & Tạo lộ trình AI</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =====================================================================
          MOBILE BOTTOM NAVIGATION BAR
         ===================================================================== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950 text-white border-t border-zinc-800 px-2 py-1.5 grid grid-cols-5 gap-1">
        {[
          { id: 'dashboard' as NavSection, label: 'Tổng quan', icon: Activity },
          { id: 'coach' as NavSection, label: 'AI Coach', icon: Brain },
          { id: 'workout-plan' as NavSection, label: 'Lịch tập', icon: Calendar },
          { id: 'body-metrics' as NavSection, label: 'Chỉ số', icon: Scale },
          { id: 'groups' as NavSection, label: 'BXH Nhóm', icon: Trophy }
        ].map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-semibold transition ${
                active ? 'text-[#C8FF00]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* =====================================================================
          MODALS & CONFIRMATION DIALOGS (No browser alert/confirm)
         ===================================================================== */}

      {/* Add Exercise Modal */}
      {isAddExerciseOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-950">
                Thêm Bài tập vào {selectedDayPlan.dayLabel}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddExerciseOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {exerciseFormError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {exerciseFormError}
              </div>
            )}

            <form onSubmit={handleAddExercise} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Tên bài tập *</label>
                <input
                  type="text"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Dumbbell Lunges, Push-up..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nhóm cơ</label>
                  <select
                    value={exerciseForm.muscleGroup}
                    onChange={(e) => setExerciseForm((p) => ({ ...p, muscleGroup: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-semibold bg-white"
                  >
                    <option value="Đùi & Mông">Đùi & Mông</option>
                    <option value="Ngực & Tay sau">Ngực & Tay sau</option>
                    <option value="Lưng xô & Tay trước">Lưng xô & Tay trước</option>
                    <option value="Vai & Cầu vai">Vai & Cầu vai</option>
                    <option value="Cơ lõi (Core)">Cơ lõi (Core)</option>
                    <option value="Cardio Toàn thân">Cardio Toàn thân</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Dụng cụ</label>
                  <select
                    value={exerciseForm.equipment}
                    onChange={(e) => setExerciseForm((p) => ({ ...p, equipment: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-semibold bg-white"
                  >
                    <option value="Bodyweight">Bodyweight</option>
                    <option value="Dumbbells">Tạ đơn (Dumbbells)</option>
                    <option value="Resistance Bands">Dây kháng lực</option>
                    <option value="Full Gym">Máy tập Gym</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Số hiệp (Sets)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={exerciseForm.sets}
                    onChange={(e) => setExerciseForm((p) => ({ ...p, sets: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Số lần (Reps)</label>
                  <input
                    type="text"
                    value={exerciseForm.reps}
                    onChange={(e) => setExerciseForm((p) => ({ ...p, reps: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nghỉ (giây)</label>
                  <input
                    type="number"
                    step={5}
                    value={exerciseForm.restSec}
                    onChange={(e) => setExerciseForm((p) => ({ ...p, restSec: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-950 text-[#C8FF00] font-bold text-xs"
                >
                  Lưu bài tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Exercise */}
      {exerciseDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Xác nhận xóa bài tập?</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Bạn có chắc muốn xóa "{exerciseDeleteConfirm.exName}" khỏi lịch tập không?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExerciseDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-xs"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteExercise}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                Xóa bài tập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Body Metric Entry */}
      {metricDeleteTargetId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Xóa bản ghi chỉ số cơ thể?</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Hành động này sẽ gỡ bản ghi khỏi biểu đồ lịch sử của bạn.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMetricDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMetric}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Fitness Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-950">Tạo Nhóm Tập Luyện Mới</h3>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {newGroupError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {newGroupError}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Tên nhóm *</label>
                <input
                  type="text"
                  value={newGroupForm.name}
                  onChange={(e) => setNewGroupForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Biệt Đội Giảm Mỡ Văn Phòng"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Khẩu hiệu nhóm (Slogan)</label>
                <input
                  type="text"
                  value={newGroupForm.slogan}
                  onChange={(e) => setNewGroupForm((p) => ({ ...p, slogan: e.target.value }))}
                  placeholder="VD: Mỗi ngày 30 phút không nghỉ!"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mục tiêu tổng số phút tập hàng tuần của nhóm
                </label>
                <input
                  type="number"
                  step={50}
                  value={newGroupForm.targetMin}
                  onChange={(e) => setNewGroupForm((p) => ({ ...p, targetMin: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs font-bold"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-950 text-[#C8FF00] font-bold text-xs"
                >
                  Tạo nhóm & Lấy mã mời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

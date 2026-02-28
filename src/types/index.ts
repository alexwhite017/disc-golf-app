export interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
  created_at: string
}

export interface Course {
  id: number
  name: string
  description: string | null
  city: string | null
  state: string | null
  country: string
  created_by: number
  holes: Hole[]
  created_at: string
  updated_at: string
}

export interface Hole {
  id: number
  course_id: number
  number: number
  par: number
  distance_feet: number | null
  notes: string | null
}

export interface Round {
  id: number
  user_id: number
  course_id: number
  played_at: string
  notes: string | null
  total_score: number | null
  score_vs_par: number | null
  course: Course | null
  scores: Score[]
  created_at: string
  updated_at: string
}

export interface Score {
  id: number
  round_id: number
  hole_id: number
  strokes: number
  hole: Hole | null
}

export interface Disc {
  id: number
  user_id: number
  brand: string
  name: string
  type: 'driver' | 'fairway_driver' | 'mid_range' | 'putter'
  weight_grams: string | null
  color: string | null
  notes: string | null
  is_in_bag: boolean
  created_at: string
  updated_at: string
}

export interface Stats {
  rounds_played: number
  holes_played: number
  avg_score_vs_par: number | null
  best_round: {
    id: number
    played_at: string
    course: string
    total_strokes: number
    score_vs_par: number
  } | null
  score_distribution: {
    eagles_or_better: number
    birdies: number
    pars: number
    bogeys: number
    double_bogeys_or_worse: number
  }
  favorite_course: {
    id: number
    name: string
    rounds_played: number
  } | null
  discs_in_bag: number
}

export interface LeaderboardEntry {
  user_id: number
  name: string
  rounds_played: number
  total_strokes: number | string
  total_par: number | string
  total_vs_par: number | string
  avg_vs_par_per_round: number | string
}

export interface PaginatedResponse<T> {
  data: T[]
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface AuthResponse {
  token: string
  user: User
}

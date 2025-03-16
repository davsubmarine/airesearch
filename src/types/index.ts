export interface Paper {
  id: string;
  title: string;
  abstract: string;
  date: string;
  url: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
  has_summary: boolean;
  summary?: string;
}

export interface Summary {
  id: string;
  paper_id: string;
  tldr: string[];
  key_innovation: string[];
  practical_applications: string[];
  limitations_future_work: string[];
  key_terms: Record<string, string>;
  created_at: string;
  updated_at: string;
} 
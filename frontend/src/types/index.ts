export interface StemItem {
  facet: string;
  anchor: string;
  stem_text: string;
  cosine_similarity: number;
  drift_flag: boolean;
  length_flag: boolean;
}

export interface GenerationFormData {
  temperature: number;
  max_tokens: number;
  model: string;
  constraints: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export interface ValidationRules {
  minSimilarity: number;
  maxLength: number;
}

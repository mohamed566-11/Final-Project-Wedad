export interface AiModelStats {
  total_predictions: number;
  high_risk_alerts: number;
  models_available: number;
  latest: {
    gdm?: any;
    preeclampsia?: any;
    preterm_birth?: any;
    scbu?: any;
  };
}

export interface AiModelInfo {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  icon: string;
  accuracy: string;
  latest?: any;
}

export interface HubData {
  stats: AiModelStats;
  models: AiModelInfo[];
}

export interface PrefillData {
  fields: Record<string, any>;
  auto_filled: string[];
  missing: string[];
  pregnancy_id?: number;
  pregnancy_week?: number;
  patient_name: string;
}

export interface PredictionApiResult {
  top_factors?: Record<string, number>;
  recommendation_ar?: string;
  recommendation_en?: string;
  features_used?: Record<string, any>;
  note?: string;
  // PTB specific
  prediction?: number;
  probability_high?: number;
  risk_label?: string;
  // GDM specific
  risk_probability?: number;
  risk_category?: string;
  final_risk?: string;
  guardrail_applied?: boolean;
  bmi_computed?: number;
}

export interface PredictionResponse {
  prediction_id: number;
  risk_level: string;
  risk_score: number;
  risk_color: string;
  risk_badge: string;
  api_result: PredictionApiResult;
  consultation_suggested: boolean;
}

export interface GdmInput {
  age: number;
  height_cm: number;
  weight_kg: number;
  no_of_pregnancy: number;
  family_history: number;
  pcos: number;
  sedentary_lifestyle: number;
  prediabetes: number;
  unexplained_prenatal_loss: number;
  large_child_or_birth_default: number;
  gestation_in_previous_pregnancy: number;
}

export interface PreeclampsiaInput {
  gravida: number;
  parity: number;
  gest_age: number;
  age: number;
  bmi: number;
  diabetes: number;
  htn: number;
  sysbp: number;
  diabp: number;
  hb: number;
  proteinuria: number;
}

export interface PretermInput {
  age: number;
  systolic_bp: number;
  diastolic: number;
  bs: number;
  bmi: number;
  previous_complications: number;
  preexisting_diabetes: number;
  gestational_diabetes: number;
  mental_health: number;
  heart_rate: number;
}

export interface ScbuInput {
  maternal_age?: number;
  bmi_at_booking?: number;
  hpg_2h?: number;
  weeks_of_gestation?: number;
  weight_measured?: number;
  height?: number;
  parity?: number;
  no_of_previous_csections?: number;
  contraction_freq?: number;
  imd_decile?: number;
  gravida?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  fasting_glucose?: number;
  vitamin_d?: number;
  binary_flags?: Record<string, number>;
}

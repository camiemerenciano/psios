export type PatientStatus = 'ativo' | 'inativo' | 'alta'
export type SessionStatus = 'agendada' | 'realizada' | 'cancelada' | 'falta'
export type PaymentStatus = 'pendente' | 'pago' | 'isento'
export type Modality = 'presencial' | 'online'
export type TransactionType = 'receita' | 'despesa'
export type TransactionCategory = 'consultorio' | 'pessoal'

export interface Patient {
  id: string
  psychologist_id: string
  name: string
  email: string | null
  phone: string | null
  birth_date: string | null
  cpf: string | null
  address: string | null
  status: PatientStatus
  session_fee: number | null
  session_frequency: string | null
  insurance: string | null
  referral: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MedicalRecord {
  id: string
  patient_id: string
  psychologist_id: string
  main_complaint: string | null
  history: string | null
  diagnostic_hypothesis: string | null
  icd_code: string | null
  therapeutic_plan: string | null
  approach: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  patient_id: string
  psychologist_id: string
  scheduled_at: string
  duration_minutes: number
  status: SessionStatus
  session_number: number | null
  notes: string | null
  evolution: string | null
  payment_status: PaymentStatus
  fee: number | null
  modality: Modality
  created_at: string
  updated_at: string
  patient?: Patient
}

export interface SupervisionRecord {
  id: string
  psychologist_id: string
  supervisor_name: string | null
  scheduled_at: string | null
  cases_discussed: string | null
  insights: string | null
  action_plan: string | null
  cost: number | null
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
}

export interface FinancialTransaction {
  id: string
  psychologist_id: string
  category: TransactionCategory
  type: TransactionType
  description: string
  amount: number
  date: string
  patient_id: string | null
  session_id: string | null
  payment_method: string | null
  status: PaymentStatus
  notes: string | null
  created_at: string
}

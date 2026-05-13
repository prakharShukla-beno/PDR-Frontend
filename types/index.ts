// Auth
export interface User {
  _id: string
  name: string
  email: string
  role?: string
  lastLogin?: string
  createdAt?: string
}

export interface AuthResponse {
  token: string
  user: User
}

// Prospect / Account
export interface Contact {
  _id?: string
  name: string
  designation?: string
  department?: string
  seniority?: string
  email?: string
  phone?: string
  linkedin?: string
  isPrimary?: boolean
}

export interface Prospect {
  _id: string
  accountName: string
  website?: string
  source?: string
  primaryIndustry?: string
  businessModel?: string
  country?: string
  hqLocationCity?: string
  annualRevenue?: string
  noOfEmployees?: string
  primaryTechStack?: string[]
  techFitScore?: number
  adoptionProfile?: string
  infrastructureRisk?: string
  clvRanking?: "Tier A" | "Tier B" | "Tier C"
  salesPriority?: "P1" | "P2" | "P3" | "P4"
  intentSignal?: string
  servicePitch?: string
  strategicValue?: string
  isDuplicate?: boolean
  contacts?: Contact[]
  assignedTo?: User | string
  campaignIds?: string[]
  interactionIds?: string[]
  importLogId?: string
  createdAt?: string
  updatedAt?: string
}

// Enrichment
export interface Enrichment {
  _id: string
  prospectId: string
  techStack?: string[]
  intentSignals?: string[]
  strategicCategory?: "High Value" | "Watch List" | "Not a Fit"
  icpMatch?: boolean
  priorityScore?: number
  createdAt?: string
  updatedAt?: string
}

// Campaign
export interface Campaign {
  _id: string
  name: string
  description?: string
  promptUsed?: string
  status: "draft" | "active" | "completed"
  prospectIds?: string[] | Prospect[]
  createdBy?: User | string
  createdAt?: string
  updatedAt?: string
}

// ICP
export interface BuyerPersona {
  seniorities?: string[]
  departments?: string[]
  designations?: string[]
}

export interface ICP {
  _id: string
  name: string
  industries?: string[]
  businessModels?: string[]
  countries?: string[]
  annualRevenues?: string[]
  employeeRanges?: string[]
  intentSignals?: string[]
  minTechFitScore?: number
  buyerPersona?: BuyerPersona
  isActive?: boolean
  createdBy?: User | string
  createdAt?: string
}

// Interaction
export type InteractionType = "Email" | "Call" | "Meeting" | "LinkedIn DM" | "Demo" | "Follow-Up" | "Event"
export type InteractionOutcome = "Positive" | "Neutral" | "Negative" | "No Response"

export interface Interaction {
  _id: string
  prospectId: string | Prospect
  type: InteractionType
  interactedAt: string
  notes?: string
  outcome?: InteractionOutcome
  conductedBy?: User | string
  createdAt?: string
}

// Duplicate
export interface Duplicate {
  _id: string
  prospectId1: Prospect | string
  prospectId2: Prospect | string
  matchFields?: string[]
  status: "pending" | "merged" | "dismissed"
  reviewedBy?: User | string
  reviewedAt?: string
  createdAt?: string
}

// Notification
export type NotificationType = "import_complete" | "enrichment_done" | "dedup_complete"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  message: string
  isRead: boolean
  refId?: string
  refCollection?: string
  createdAt?: string
}

// Dashboard
export interface DashboardSummary {
  totalProspects: number
  duplicateCount: number
  enrichedCount:
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

// ─── Contact ─────────────────────────────────────────────────────────────────
export type FunctionalDomain =
  | "Corporate Strategy"
  | "Technology & Digital"
  | "Data & AI"
  | "Finance & Accounting"
  | "Revenue & Growth"
  | "Product & Creative"
  | "Operations & Logistics"
  | "People & HR"
  | "Legal & Governance"
  | "Healthcare & Life Sciences"
  | "Industrial & Engineering"
  | "Resources & Utilities"
  | "Public Sector & NGO"

export interface Contact {
  _id: string
  accountId: Prospect | string | null

  // Account reference fields
  accountName?: string

  // Denormalized account fields — for filtering
  accountIndustry?: string
  accountCountry?: string
  accountCity?: string
  accountEmployees?: string
  accountRevenue?: string
  accountBusinessModel?: string
  accountSalesPriority?: string
  accountClvRanking?: string
  accountTechFitScore?: number
  accountIntentSignal?: string
  accountWebsite?: string

  // Contact fields
  firstName?: string
  lastName?: string
  functionalDomain?: FunctionalDomain
  keyFocusAreas?: string
  standardizedRoles?: string
  email?: string
  secondaryEmail?: string
  primaryPhone?: string
  secondaryPhone?: string
  primaryMobNo?: string
  primaryPhoneExtension?: string
  secondaryPhoneExtension?: string
  linkedIn?: string
  twitterUrl?: string
  country?: string
  state?: string
  city?: string
  timeZone?: string

  // Computed boolean fields
  hasEmail?: boolean
  hasPhone?: boolean
  hasLinkedIn?: boolean

  // System
  isPrimary?: boolean
  isLinked?: boolean
  source?: "excel" | "csv" | "manual" | "account_import"
  campaignIds?: Campaign[] | string[]
  importLogId?: string
  createdAt?: string
  updatedAt?: string
}

// ─── Prospect / Account ───────────────────────────────────────────────────────
export interface EmbeddedContact {
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
  accountNameLower?: string
  website?: string
  source?: string
  accountSource?: string
  primaryIndustry?: string
  commercialCategory?: string
  businessModel?: string
  country?: string
  hqLocationCity?: string
  annualRevenue?: string
  noOfEmployees?: string

  // Tech fields
  primaryTechStack?: string | string[]
  secondaryTechStack?: string
  tertiaryTechStack?: string
  techAdoptionProfile?: string
  infrastructureRisk?: string
  techFitScore?: number
  financialCapacity?: string
  marginPotential?: string

  // Sales fields
  clvRanking?: string
  salesPriority?: string
  intentSignal?: string
  servicePitch?: string
  strategicValue?: string
  historyTrigger?: string
  campaignName?: string
  comments?: string
  isDuplicate?: boolean

  // ── NEW Scoring & Tiering Fields ──────────────────────────────────────
  finalScore?: number
  scoringMetadata?: ScoringMetadata
  status?: "active" | "disqualified" | "archived"
  disqualificationReason?: string
  disqualifiedAt?: string

  // Relations
  assignedTo?: User | string
  campaignIds?: string[]
  interactionIds?: string[]
  importLogId?: string | { _id: string; fileName: string; status: string }

  createdAt?: string
  updatedAt?: string
}

// ─── Scoring & Tiering ────────────────────────────────────────────────────────
export interface ScoringMetadata {
  revenuePoints?: number
  strategyBonus?: number
  industryMultiplier?: number
  techFitMultiplier?: number
  calculatedAt?: Date
}

export interface ScoreBreakdown {
  prospect: {
    id: string
    accountName: string
    primaryIndustry?: string
    annualRevenue?: string
    strategicValue?: string
    financialCapacity?: string
  }
  scoring: {
    revenuePoints: number
    strategyBonus: number
    industryMultiplier: number
    techFitMultiplier: number
    finalScore: number
  }
  tier?: {
    tier: string
    assignment: string
    resourceAllocation: string
  }
  priority?: {
    priority: string
    bucket: string
    slaMinutes?: number
    description: string
    action: string
  }
  steps?: string[]
  metadata?: ScoringMetadata
}

export interface TierBreakdown {
  "Tier-A (Strategic)": number
  "Tier-B (Core)": number
  "Tier-C (Mass)": number
}

export interface PriorityBreakdown {
  "P1 (Tier A+Active)": number
  "P2 (Tier B+Active)": number
  "P3 (Tier A+Cold)": number
  "P4 (Tier B+Cold)": number
}

// ─── Enrichment ───────────────────────────────────────────────────────────────
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

// ─── Campaign ─────────────────────────────────────────────────────────────────
export interface Campaign {
  _id: string
  name: string
  description?: string
  promptUsed?: string
  status: "draft" | "active" | "completed"
  prospectIds?: string[] | Prospect[]
  stats?: {
    sentCount?: number
    openCount?: number
    clickCount?: number
    replyCount?: number
    conversions?: number
  }
  createdBy?: User | string
  createdAt?: string
  updatedAt?: string
}

// ─── ICP ──────────────────────────────────────────────────────────────────────
export interface BuyerPersona {
  targetSeniorities?: string[]
  targetDepartments?: string[]
  targetDesignations?: string[]
}

export interface ICP {
  _id: string
  name: string
  description?: string
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

// ─── Interaction ──────────────────────────────────────────────────────────────
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

// ─── Duplicate ────────────────────────────────────────────────────────────────
export interface Duplicate {
  _id: string
  prospectId1: Prospect | string
  prospectId2?: Prospect | string | null
  newData?: Record<string, any> | null
  source?: "import" | "manual"
  importLogId?: string
  matchFields?: string[]
  status: "pending" | "merged" | "skipped" | "kept_both" | "dismissed"
  reviewedBy?: User | string
  reviewedAt?: string
  createdAt?: string
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType =
  | "import_complete"
  | "enrichment_complete"
  | "enrichment_done"
  | "dedup_complete"

export interface Notification {
  _id?: string
  id?: string
  userId: string
  type: NotificationType
  message: string
  isRead: boolean
  refId?: string
  refCollection?: string
  createdAt?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardSummary {
  totalProspects: number
  duplicateCount: number
  enrichedCount: number
  icpMatchCount?: number
  pendingDuplicates?: number
  totalInteractions?: number
  enrichmentCoverage?: number
}

// ─── Import Log ───────────────────────────────────────────────────────────────
export interface ImportLog {
  _id: string
  fileName: string
  importType: string
  uploadedBy: User | string
  totalRows: number
  successCount: number
  failedCount: number
  status: "processing" | "completed" | "failed" | "partial"
  errorDetails?: string[]
  createdAt?: string
}

// ─── Segment ──────────────────────────────────────────────────────────────────
export interface Segment {
  _id: string
  name: string
  description?: string
  filters: Record<string, unknown>
  prospectCount?: number
  createdBy?: User | string
  createdAt?: string
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: Pagination
}
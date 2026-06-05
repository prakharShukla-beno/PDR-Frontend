"use client"

import { useState } from "react"
import {
  AlertTriangle, CheckCircle, GitMerge, Copy,
  SkipForward, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { api } from "@/lib/api"

type Action = "merge" | "skip" | "keep_both"

interface DuplicateRow {
  newData:      Record<string, any>
  existingData: Record<string, any>
  matchFields:  string[]
}

interface Decision {
  existingId: string
  newData:    Record<string, any>
  action:     Action
}

interface Props {
  isOpen:           boolean
  duplicates:       DuplicateRow[]
  importLogId:      string
  resolveEndpoint?: string                  // default: /import/resolve-duplicates
  onComplete?:      (results: any) => void  // accounts page uses this
  onResolved?:      () => void              // contacts page uses this
  onClose:          () => void
}

// Account fields — for prospect/account duplicate review
const ACCOUNT_FIELDS: { key: string; label: string }[] = [
  { key: "accountName",      label: "Account Name"   },
  { key: "primaryIndustry",  label: "Industry"       },
  { key: "businessModel",    label: "Business Model" },
  { key: "country",          label: "Country"        },
  { key: "hqLocationCity",   label: "City"           },
  { key: "noOfEmployees",    label: "Employees"      },
  { key: "annualRevenue",    label: "Revenue"        },
  { key: "website",          label: "Website"        },
  { key: "primaryTechStack", label: "Tech Stack"     },
  { key: "salesPriority",    label: "Sales Priority" },
  { key: "clvRanking",       label: "CLV Ranking"    },
  { key: "intentSignal",     label: "Intent Signal"  },
  { key: "techFitScore",     label: "TechFit Score"  },
]

// Contact fields — for contact duplicate review
const CONTACT_FIELDS: { key: string; label: string }[] = [
  { key: "firstName",         label: "First Name"  },
  { key: "lastName",          label: "Last Name"   },
  { key: "email",             label: "Email"       },
  { key: "primaryPhone",      label: "Phone 1"     },
  { key: "secondaryPhone",    label: "Phone 2"     },
  { key: "standardizedRoles", label: "Role / Title"},
  { key: "functionalDomain",  label: "Department"  },
  { key: "accountName",       label: "Account Name"},
  { key: "linkedIn",          label: "LinkedIn"    },
  { key: "country",           label: "Country"     },
  { key: "city",              label: "City"        },
]

export function DuplicateReviewModal({
  isOpen, duplicates, importLogId, resolveEndpoint,
  onComplete, onResolved, onClose,
}: Props) {

  // Contact import uses contact fields, account import uses account fields
  const isContactImport = resolveEndpoint?.includes("contacts")
  const DISPLAY_FIELDS  = isContactImport ? CONTACT_FIELDS : ACCOUNT_FIELDS

  const [currentIndex, setCurrentIndex] = useState(0)
  const [decisions, setDecisions]       = useState<Record<number, Action>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const current      = duplicates[currentIndex]
  const totalCount   = duplicates.length
  const decidedCount = Object.keys(decisions).length
  const allDecided   = decidedCount === totalCount

  const setDecision = (action: Action) => {
    setDecisions(prev => ({ ...prev, [currentIndex]: action }))
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  const applyToAll = (action: Action) => {
    const all: Record<number, Action> = {}
    for (let i = 0; i < totalCount; i++) all[i] = action
    setDecisions(all)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const decisionsArray: Decision[] = duplicates.map((dup, i) => ({
        existingId: dup.existingData._id,
        newData:    dup.newData,
        action:     decisions[i] || "skip",
      }))

      const endpoint = resolveEndpoint || "/import/resolve-duplicates"
      const res = await api.post<any>(endpoint, { importLogId, decisions: decisionsArray })

      const resultData = res.data || res
      if (onComplete) onComplete(resultData)
      if (onResolved) onResolved()
    } catch (err) {
      console.error("Resolve error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!current) return null

  const currentDecision = decisions[currentIndex]

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-3xl max-h-[90vh] flex flex-col"
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogDescription className="sr-only">
          Review duplicate records found during import.
        </DialogDescription>

        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Duplicate Records Found
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              {currentIndex + 1} / {totalCount}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            These records already exist in your database. Choose what to do with each one.
          </p>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{decidedCount} of {totalCount} decided</span>
            <span>{Math.round((decidedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(decidedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Match info */}
        <div className="flex-shrink-0 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800">
            Matched on: <strong>{current.matchFields.join(", ")}</strong>
          </span>
        </div>

        {/* Comparison table */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">

            <div className="bg-muted/50 px-4 py-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Existing Record (in DB)
              </p>
            </div>
            <div className="bg-blue-50 px-4 py-2.5">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                New Record (from file)
              </p>
            </div>

            {DISPLAY_FIELDS.map(({ key, label }) => {
              const oldVal    = current.existingData[key]
              const newVal    = current.newData[key]
              if (!oldVal && !newVal) return null
              const different = oldVal !== newVal && (oldVal || newVal)
              return (
                <div key={key} className="contents">
                  <div className={`px-4 py-2 border-t ${different ? "bg-amber-50/30" : "bg-white"}`}>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className={`text-sm font-medium ${different ? "text-amber-800" : "text-foreground"}`}>
                      {oldVal ?? <span className="text-muted-foreground italic">—</span>}
                    </p>
                  </div>
                  <div className={`px-4 py-2 border-t ${different ? "bg-blue-50/30" : "bg-white"}`}>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className={`text-sm font-medium ${different ? "text-blue-800" : "text-foreground"}`}>
                      {newVal ?? <span className="text-muted-foreground italic">—</span>}
                      {different && newVal && (
                        <span className="ml-1.5 text-xs text-blue-600 font-normal">(updated)</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 space-y-3 pt-2 border-t">

          {currentDecision && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
              ${currentDecision === "merge"
                ? "bg-green-50 text-green-700 border border-green-200"
                : currentDecision === "skip"
                ? "bg-gray-50 text-gray-700 border border-gray-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
              <CheckCircle className="h-4 w-4" />
              Decision: {currentDecision === "merge" ? "Merge" : currentDecision === "skip" ? "Skip" : "Keep Both"}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDecision("merge")}
              className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all hover:border-green-400 hover:bg-green-50
                ${currentDecision === "merge" ? "border-green-500 bg-green-50" : "border-border bg-white"}`}
            >
              <GitMerge className={`h-5 w-5 ${currentDecision === "merge" ? "text-green-600" : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold">Merge</span>
              <span className="text-xs text-muted-foreground leading-tight">Update existing with new data</span>
            </button>

            <button
              onClick={() => setDecision("skip")}
              className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all hover:border-gray-400 hover:bg-gray-50
                ${currentDecision === "skip" ? "border-gray-500 bg-gray-50" : "border-border bg-white"}`}
            >
              <SkipForward className={`h-5 w-5 ${currentDecision === "skip" ? "text-gray-600" : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold">Skip</span>
              <span className="text-xs text-muted-foreground leading-tight">Keep existing, ignore new</span>
            </button>

            <button
              onClick={() => setDecision("keep_both")}
              className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all hover:border-blue-400 hover:bg-blue-50
                ${currentDecision === "keep_both" ? "border-blue-500 bg-blue-50" : "border-border bg-white"}`}
            >
              <Copy className={`h-5 w-5 ${currentDecision === "keep_both" ? "text-blue-600" : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold">Keep Both</span>
              <span className="text-xs text-muted-foreground leading-tight">Save as separate record</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Apply to all remaining:</span>
            <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={() => applyToAll("merge")}>
              <GitMerge className="h-3 w-3" />Merge All
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={() => applyToAll("skip")}>
              <SkipForward className="h-3 w-3" />Skip All
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(i => i - 1)}>
                <ChevronLeft className="h-4 w-4" />Prev
              </Button>
              <Button variant="outline" size="sm" disabled={currentIndex === totalCount - 1}
                onClick={() => setCurrentIndex(i => i + 1)}>
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              className="bg-primary hover:bg-primary/90 gap-2"
              disabled={!allDecided || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle className="h-4 w-4" />}
              {isSubmitting ? "Processing..." : `Confirm All ${totalCount} Decisions`}
            </Button>
          </div>

          {!allDecided && (
            <p className="text-xs text-center text-muted-foreground">
              {totalCount - decidedCount} more to decide before confirming
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

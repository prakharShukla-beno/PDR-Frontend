"use client"

import { useMemo, useState } from "react"
import { Loader2, Save, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { formatClvTier, SEGMENT_SECTION_HEADER_CLASS } from "@/lib/segment-builder-constants"
import type { Prospect } from "@/types"

export type SegmentAccount = Pick<
  Prospect,
  "_id" | "accountName" | "primaryIndustry" | "country" | "clvRanking" | "finalScore"
>

interface SegmentRightPanelProps {
  activeTab: "search" | "filter"
  searchQuery: string
  previewAccounts: SegmentAccount[]
  previewTotal: number
  previewLoading: boolean
  checkedIds: string[]
  onCheckedIdsChange: (ids: string[]) => void
  selectedIds: string[]
  selectedAccounts: SegmentAccount[]
  onAddSelected: () => void
  onAddAll: () => void
  isAddingAll: boolean
  onRemove: (id: string) => void
  onClearAll: () => void
  onSave: () => void
  isSaving: boolean
  segmentName: string
  saveLabel?: string
}

function accountMeta(account: SegmentAccount) {
  return [account.primaryIndustry, account.country, formatClvTier(account.clvRanking)]
    .filter(Boolean)
    .join(" · ")
}

export function SegmentRightPanel({
  activeTab,
  searchQuery,
  previewAccounts,
  previewTotal,
  previewLoading,
  checkedIds,
  onCheckedIdsChange,
  selectedIds,
  selectedAccounts,
  onAddSelected,
  onAddAll,
  isAddingAll,
  onRemove,
  onClearAll,
  onSave,
  isSaving,
  segmentName,
  saveLabel = "Save Segment",
}: SegmentRightPanelProps) {
  const [selectedSearch, setSelectedSearch] = useState("")

  const addablePreview = previewAccounts.filter(
    (a) => !selectedIds.includes(String(a._id))
  )
  const allAddableChecked =
    addablePreview.length > 0 &&
    addablePreview.every((a) => checkedIds.includes(String(a._id)))

  const filteredSelected = useMemo(() => {
    const q = selectedSearch.trim().toLowerCase()
    if (!q) return selectedAccounts
    return selectedAccounts.filter(
      (a) =>
        a.accountName?.toLowerCase().includes(q) ||
        a.primaryIndustry?.toLowerCase().includes(q) ||
        a.country?.toLowerCase().includes(q)
    )
  }, [selectedAccounts, selectedSearch])

  const previewSubtitle = () => {
    if (previewTotal > 0) {
      if (activeTab === "search" && searchQuery.trim().length >= 2) {
        return `${previewTotal} account${previewTotal === 1 ? "" : "s"} found for '${searchQuery.trim()}'`
      }
      return `${previewTotal} account${previewTotal === 1 ? "" : "s"} match`
    }
    return activeTab === "search"
      ? "Search to see results"
      : "Apply filters to see results"
  }

  const previewEmptyMessage =
    activeTab === "search"
      ? "Search accounts to see results here"
      : "Select filters to see matching accounts"

  const toggleChecked = (accountId: string, checked: boolean) => {
    const id = String(accountId)
    onCheckedIdsChange(
      checked ? [...checkedIds, id] : checkedIds.filter((existing) => String(existing) !== id)
    )
  }

  return (
    <div className="sticky top-4 space-y-6">
      {/* Card 1 — Live Preview (matches left panel card gap/style) */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className={SEGMENT_SECTION_HEADER_CLASS}>Live Preview</p>
            <p className="text-sm text-muted-foreground mt-1">{previewSubtitle()}</p>
          </div>

          {previewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground ml-2">Loading...</span>
            </div>
          ) : previewAccounts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">{previewEmptyMessage}</p>
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto -mx-1 px-1">
              {previewAccounts.map((account) => {
                const isChecked = checkedIds.includes(String(account._id))
                const isAlreadyAdded = selectedIds.includes(String(account._id))

                return (
                  <div
                    key={account._id}
                    className={`flex items-center gap-3 py-2.5 border-b last:border-0 transition-colors ${
                      isAlreadyAdded ? "bg-muted/40 opacity-60" : "hover:bg-muted/30"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      disabled={isAlreadyAdded}
                      onCheckedChange={(val) => {
                        if (isAlreadyAdded) return
                        toggleChecked(String(account._id), val === true)
                      }}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{account.accountName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {accountMeta(account)}
                      </p>
                    </div>
                    {isAlreadyAdded && (
                      <span className="text-xs text-primary font-medium flex-shrink-0">
                        Added
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {previewAccounts.length > 0 && (
            <div className="flex items-center gap-2 pt-3 border-t">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={allAddableChecked}
                  onCheckedChange={(val) => {
                    onCheckedIdsChange(val ? addablePreview.map((a) => String(a._id)) : [])
                  }}
                  className="h-3.5 w-3.5"
                />
                Select all
              </label>
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  size="sm"
                  onClick={onAddSelected}
                  disabled={checkedIds.length === 0}
                  className="h-8 text-xs"
                >
                  Add Selected ({checkedIds.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onAddAll}
                  disabled={previewTotal === 0 || isAddingAll}
                  className="h-8 text-xs"
                >
                  {isAddingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : null}
                  Add All {previewTotal}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2 — Selected Accounts + Save */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <p className={SEGMENT_SECTION_HEADER_CLASS}>
            Selected Accounts
            <span className="ml-2 text-primary normal-case font-semibold">
              ({selectedAccounts.length})
            </span>
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search selected..."
              value={selectedSearch}
              onChange={(e) => setSelectedSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[200px] overflow-y-auto -mx-1 px-1">
            {filteredSelected.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {selectedAccounts.length === 0
                  ? "No accounts selected yet"
                  : "No accounts match your search"}
              </p>
            ) : (
              filteredSelected.map((account) => (
                <div
                  key={account._id}
                  className="flex items-start justify-between gap-2 py-2 border-b last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{account.accountName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {accountMeta(account)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(account._id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${account.accountName}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {selectedAccounts.length > 0 && (
            <Button type="button" variant="outline" className="w-full" onClick={onClearAll}>
              Clear All
            </Button>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={
              !segmentName.trim() ||
              selectedIds.length === 0 ||
              isSaving
            }
            className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              !segmentName.trim() || selectedIds.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saveLabel}
                {selectedIds.length > 0 && (
                  <span className="text-xs opacity-80">({selectedIds.length})</span>
                )}
              </>
            )}
          </button>
          {selectedIds.length > 0 && !segmentName.trim() && (
            <p className="text-xs text-amber-600 text-center mt-1">
              Add a segment name to save
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

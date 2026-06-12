"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const ICP_COLUMN_LABELS: Record<string, string> = {
  primaryIndustry: "Primary Industry",
  employeeRange:   "Employee Range",
  annualRevenue:   "Annual Revenue",
}

type PreviewRow = {
  accountName?: string
  primaryIndustry?: string
  noOfEmployees?: string
  annualRevenue?: string
  country?: string
}

type Props = {
  open: boolean
  fileName: string
  missingColumns: string[]
  previewRows: PreviewRow[]
  totalRows: number
  isProceeding?: boolean
  onProceed: () => void
  onCancel: () => void
}

export function IcpImportPreviewModal({
  open,
  fileName,
  missingColumns,
  previewRows,
  totalRows,
  isProceeding = false,
  onProceed,
  onCancel,
}: Props) {
  if (!open) return null

  const allMissing = missingColumns.length === 3
  const someMissing = missingColumns.length > 0

  const missingLabels = missingColumns.map(
    (key) => ICP_COLUMN_LABELS[key] || key
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Import Preview</h2>
            <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
          </div>

          {someMissing && (
            <div
              className={`rounded-lg border p-4 space-y-2 ${
                allMissing
                  ? "bg-orange-50 border-orange-200 text-orange-900"
                  : "bg-yellow-50 border-yellow-200 text-yellow-900"
              }`}
            >
              <div className="flex items-start gap-2 font-medium">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>
                  {allMissing
                    ? "No ICP Matching Data Detected"
                    : "Missing ICP Matching Columns"}
                </span>
              </div>

              {allMissing ? (
                <p className="text-sm pl-7">
                  Primary Industry, Employee Range, and Annual Revenue columns are all
                  missing from your file. Prospects will be imported, but they will not
                  match any ICP filters based on these fields. ICP matching will return
                  0 results for these criteria unless you re-import with complete data.
                </p>
              ) : (
                <>
                  <p className="text-sm pl-7">The following columns were not found in your file:</p>
                  <ul className="text-sm pl-11 list-disc space-y-0.5">
                    {missingLabels.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                  <p className="text-sm pl-7">
                    Prospects will be imported successfully, but ICP matching accuracy will
                    be limited for these fields. Consider adding these columns to your Excel
                    file before re-importing.
                  </p>
                </>
              )}
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <div className="px-3 py-2 bg-muted/30 text-xs text-muted-foreground border-b">
                Preview — first {previewRows.length} of {totalRows} rows
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-2 font-medium">Account</th>
                      <th className="p-2 font-medium">Industry</th>
                      <th className="p-2 font-medium">Employees</th>
                      <th className="p-2 font-medium">Revenue</th>
                      <th className="p-2 font-medium">Country</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2">{row.accountName || "—"}</td>
                        <td className="p-2">{row.primaryIndustry || "—"}</td>
                        <td className="p-2">{row.noOfEmployees || "—"}</td>
                        <td className="p-2">{row.annualRevenue || "—"}</td>
                        <td className="p-2">{row.country || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel} disabled={isProceeding}>
              Cancel
            </Button>
            <Button onClick={onProceed} disabled={isProceeding}>
              {isProceeding ? "Importing..." : "Proceed with Import"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Loader2 } from "lucide-react"

export type ImportJobState = {
  jobId: string
  status: string
  fileName?: string
  totalRows: number
  processedRows: number
  successCount: number
  duplicateCount: number
  errorCount: number
  errorMessage?: string
}

export const ACTIVE_IMPORT_STATUSES = ["pending", "parsing", "processing"] as const

export const isImportJobActive = (status: string) =>
  ACTIVE_IMPORT_STATUSES.includes(status as (typeof ACTIVE_IMPORT_STATUSES)[number])

const TERMINAL_STATUSES = new Set([
  "completed",
  "completed_with_errors",
  "failed",
  "cancelled",
])

export const isImportJobTerminal = (status: string) =>
  TERMINAL_STATUSES.has(status)

type Props = {
  job: ImportJobState
  onCancel?: () => void | Promise<void>
  canCancel?: boolean
}

export function ImportJobProgress({ job, onCancel, canCancel = false }: Props) {
  const progress =
    job.totalRows > 0
      ? Math.round((job.processedRows / job.totalRows) * 100)
      : 0

  const showCancel = canCancel && isImportJobActive(job.status) && onCancel

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
        {(job.status === "pending" ||
          job.status === "parsing" ||
          job.status === "processing") && (
          <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
        )}
        <span>{job.fileName ? `Importing ${job.fileName}` : "Import in progress"}</span>
      </div>

      {job.status === "pending" && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Import queued...</p>
          {showCancel && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onCancel?.()
              }}
              className="ml-3 text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
            >
              Cancel Import
            </button>
          )}
        </div>
      )}

      {(job.status === "parsing" || job.status === "processing") && (
        <>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-700">
              {job.status === "parsing"
                ? "Reading file..."
                : `Processing ${job.processedRows.toLocaleString()} of ${job.totalRows.toLocaleString()} rows`}
            </span>
            <span className="flex items-center text-gray-400">
              {progress}%
              {showCancel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onCancel?.()
                  }}
                  className="ml-3 text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
                  disabled={!showCancel}
                >
                  Cancel Import
                </button>
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {job.totalRows >= 5000 && (
            <p className="mt-2 text-xs text-gray-500">
              Large file import — this may take a minute or more.
            </p>
          )}
        </>
      )}

      {(job.status === "completed" ||
        job.status === "completed_with_errors") && (
        <div className="text-sm">
          <p className="mb-1 font-medium text-gray-900">Import complete</p>
          <p className="text-gray-500">
            {job.successCount.toLocaleString()} accounts created,{" "}
            {job.duplicateCount.toLocaleString()} duplicates,{" "}
            {job.errorCount.toLocaleString()} errors
          </p>
        </div>
      )}

      {job.status === "cancelled" && (
        <p className="text-sm text-gray-500">
          Import cancelled. {job.successCount.toLocaleString()} accounts were
          created before stopping.
        </p>
      )}

      {job.status === "failed" && (
        <p className="text-sm text-red-600">
          {job.errorMessage ||
            "Import failed. Please try again or contact support."}
        </p>
      )}
    </div>
  )
}

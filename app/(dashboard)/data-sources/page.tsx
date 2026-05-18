"use client"

// ─────────────────────────────────────────────
// Data Sources Page
// Reference: akshayji.lovable.app/app/sources
// APIs:
//   GET /api/dashboard/import-history → recent imports
//   POST /api/import/excel            → CSV upload
// Note: Apollo/ZoomInfo/Bitrix24 connectors
// abhi backend mein nahi hain — UI only show karo
// ─────────────────────────────────────────────

import { useEffect, useState, useRef } from "react"
import {
  Upload, Loader2, CheckCircle, XCircle,
  RefreshCw, Settings, Plus, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { api, ApiError } from "@/lib/api"

// ── Connector config — static UI ──
const CONNECTORS = [
  {
    id: "zoominfo",
    name: "ZoomInfo",
    initial: "Z",
    color: "bg-orange-500",
    status: "connected",
    records: 0,
    errors: 0,
    lastSync: "Not synced",
    description: "B2B contact & company data"
  },
  {
    id: "apollo",
    name: "Apollo",
    initial: "A",
    color: "bg-blue-600",
    status: "connected",
    records: 0,
    errors: 0,
    lastSync: "Not synced",
    description: "Sales intelligence platform"
  },
  {
    id: "oneb",
    name: "OneB",
    initial: "O",
    color: "bg-primary",
    status: "connected",
    records: 0,
    errors: 0,
    lastSync: "Not synced",
    description: "Internal CRM connector"
  },
  {
    id: "bitrix24",
    name: "Bitrix24",
    initial: "B",
    color: "bg-red-500",
    status: "idle",
    records: 0,
    errors: 0,
    lastSync: "Not configured",
    description: "CRM & project management"
  },
]

const AVAILABLE_CONNECTORS = [
  { name: "Salesforce", initial: "S", color: "bg-sky-500" },
  { name: "HubSpot", initial: "H", color: "bg-orange-400" },
  { name: "LinkedIn Sales Nav", initial: "L", color: "bg-blue-700" },
]

export default function DataSourcesPage() {
  const [importHistory, setImportHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // GET /api/dashboard/import-history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get<any>("/dashboard/import-history")
        setImportHistory(res.data || [])
      } catch (err) {
        console.error("Import history error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  // POST /api/import/excel — CSV/Excel upload
  const handleUpload = async () => {
    if (!uploadFile) return
    setIsUploading(true)
    setUploadMsg("")
    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      const res = await api.upload<any>("/import/excel", formData)
      setUploadMsg(`✅ Import complete — ${res.data?.successCount ?? 0} records added`)
      setUploadFile(null)
      // Refresh history
      const histRes = await api.get<any>("/dashboard/import-history")
      setImportHistory(histRes.data || [])
    } catch (err) {
      if (err instanceof ApiError) setUploadMsg(`❌ ${err.message}`)
      else setUploadMsg("❌ Upload failed. Try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusStyle = (status: string) => {
    if (status === "connected") return { dot: "bg-green-500", badge: "bg-green-100 text-green-700 border-green-200", label: "Connected" }
    if (status === "error") return { dot: "bg-red-500", badge: "bg-red-100 text-red-700 border-red-200", label: "Error" }
    return { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600 border-gray-200", label: "Idle" }
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Admin · BR-04</p>
          <h1 className="text-2xl font-bold">Data Sources</h1>
          <p className="text-sm text-muted-foreground">
            Manage connectors, sync schedules and error logs.
          </p>
        </div>
        <div className="flex gap-3">
          {/* CSV Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) { setUploadFile(f); setUploadMsg("") }
            }}
          />
          <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />Upload CSV
          </Button>
          {uploadFile && (
            <Button className="gap-2" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Uploading..." : `Upload: ${uploadFile.name.slice(0, 12)}...`}
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />Add Source
          </Button>
        </div>
      </div>

      {uploadMsg && (
        <div className="text-sm px-4 py-2 rounded-lg border">{uploadMsg}</div>
      )}

      {/* ── Connected Sources ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONNECTORS.map((connector) => {
          const style = getStatusStyle(connector.status)
          return (
            <Card key={connector.id}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${connector.color} text-white font-bold`}>
                      {connector.initial}
                    </div>
                    <div>
                      <p className="font-semibold">{connector.name}</p>
                      <p className="text-xs text-muted-foreground">{connector.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${style.badge}`}>
                    {style.label}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{connector.records.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Records</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${connector.errors > 0 ? "text-red-500" : ""}`}>
                      {connector.errors}
                    </p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground pt-1">{connector.lastSync}</p>
                    <p className="text-xs text-muted-foreground">Last sync</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs">
                    <RefreshCw className="h-3 w-3" />Sync now
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <Settings className="h-3 w-3" />Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* CSV Upload card */}
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 font-bold">
                  C
                </div>
                <div>
                  <p className="font-semibold">CSV Upload</p>
                  <p className="text-xs text-muted-foreground">Excel / CSV file import</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200">
                Idle
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold">{importHistory.reduce((sum, imp) => sum + (imp.successCount ?? 0), 0)}</p>
                <p className="text-xs text-muted-foreground">Records</p>
              </div>
              <div>
                <p className="text-lg font-bold">{importHistory.reduce((sum, imp) => sum + (imp.failedCount ?? 0), 0)}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground pt-1">
                  {importHistory.length > 0
                    ? new Date(importHistory[0].createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Last import</p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full gap-1 text-xs"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3 w-3" />Upload File
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Available Connectors ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Available Connectors</h3>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_CONNECTORS.map((c) => (
              <Button key={c.name} variant="outline" className="gap-2">
                <div className={`h-5 w-5 rounded text-white text-xs flex items-center justify-center font-bold ${c.color}`}>
                  {c.initial}
                </div>
                + {c.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Import History ── */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Import History</h3>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : importHistory.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Koi imports nahi hain abhi. CSV upload karo.</p>
            </div>
          ) : (
            <div className="divide-y">
              {importHistory.map((imp) => (
                <div key={imp._id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {imp.status === "completed"
                      ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      : imp.status === "failed"
                      ? <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      : <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    }
                    <div>
                      <p className="text-sm font-medium">
                        {imp.fileName?.split("-").slice(1).join("-") || imp.fileName || "Unknown file"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {imp.successCount ?? 0} records · {imp.failedCount ?? 0} errors ·{" "}
                        {new Date(imp.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={imp.status === "completed" ? "default" : imp.status === "failed" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {imp.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
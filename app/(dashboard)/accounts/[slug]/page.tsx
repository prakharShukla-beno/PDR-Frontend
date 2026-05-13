"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Sparkles, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"
import type { Prospect, Interaction, Enrichment } from "@/types"

export default function AccountDetailPage() {
  const { slug } = useParams()
  const router = useRouter()
  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [enrichment, setEnrichment] = useState<Enrichment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichMsg, setEnrichMsg] = useState("")

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prospectRes, interactionsRes] = await Promise.all([
          api.get<any>(`/prospects/${slug}`),
          api.get<any>(`/interactions/prospect/${slug}`),
        ])
        setProspect(prospectRes.data)
        setInteractions(interactionsRes.data || [])
      } catch (err) {
        console.error("Account detail error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    if (slug) fetchAll()
  }, [slug])

  const handleEnrich = async () => {
    setIsEnriching(true)
    setEnrichMsg("")
    try {
      const res = await api.post<any>(`/enrichment/${slug}`)
      setEnrichment(res.data)
      setEnrichMsg("✅ AI enrichment complete!")
    } catch (err) {
      setEnrichMsg("❌ Enrichment fail ho gayi.")
    } finally {
      setIsEnriching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!prospect) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Prospect nahi mila.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{prospect.accountName}</h1>
          <p className="text-muted-foreground">{prospect.website}</p>
        </div>
        <Button
          className="gap-2"
          onClick={handleEnrich}
          disabled={isEnriching}
        >
          {isEnriching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Enrich with AI
        </Button>
      </div>

      {enrichMsg && (
        <div className="rounded-lg border px-4 py-2 text-sm">{enrichMsg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Account Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Industry", value: prospect.primaryIndustry },
                  { label: "Business Model", value: prospect.businessModel },
                  { label: "Country", value: prospect.country },
                  { label: "City", value: prospect.hqLocationCity },
                  { label: "Revenue", value: prospect.annualRevenue },
                  { label: "Employees", value: prospect.noOfEmployees },
                  { label: "Sales Priority", value: prospect.salesPriority },
                  { label: "CLV Ranking", value: prospect.clvRanking },
                  { label: "Tech Fit Score", value: prospect.techFitScore },
                  { label: "Intent Signal", value: prospect.intentSignal },
                  { label: "Source", value: prospect.source },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-muted-foreground">{label}</p>
                    <p className="font-medium">{value ?? "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contacts */}
          {prospect.contacts && prospect.contacts.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Contacts ({prospect.contacts.length})</h3>
                <div className="space-y-3">
                  {prospect.contacts.map((contact, i) => (
                    <div key={i} className="flex items-start justify-between border rounded-lg p-3">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.designation} — {contact.department}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                        {contact.phone && <p className="text-sm text-muted-foreground">{contact.phone}</p>}
                      </div>
                      <div className="flex gap-2">
                        {contact.isPrimary && <Badge variant="secondary">Primary</Badge>}
                        <Badge variant="outline">{contact.seniority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interactions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Interactions ({interactions.length})</h3>
              </div>
              {interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Koi interactions nahi hain abhi.</p>
              ) : (
                <div className="space-y-2">
                  {interactions.map((interaction) => (
                    <div key={interaction._id} className="border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{interaction.type}</Badge>
                        <span className="text-muted-foreground text-xs">
                          {new Date(interaction.interactedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {interaction.notes && (
                        <p className="mt-2 text-muted-foreground">{interaction.notes}</p>
                      )}
                      {interaction.outcome && (
                        <Badge
                          className="mt-1"
                          variant={interaction.outcome === "Positive" ? "default" : "secondary"}
                        >
                          {interaction.outcome}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — AI Enrichment */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Enrichment
              </h3>
              {enrichment ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Priority Score</p>
                    <p className="font-bold text-2xl">{enrichment.priorityScore ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Strategic Category</p>
                    <Badge>{enrichment.strategicCategory}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ICP Match</p>
                    <Badge variant={enrichment.icpMatch ? "default" : "secondary"}>
                      {enrichment.icpMatch ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {enrichment.techStack && enrichment.techStack.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1">Tech Stack</p>
                      <div className="flex flex-wrap gap-1">
                        {enrichment.techStack.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {enrichment.intentSignals && enrichment.intentSignals.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1">Intent Signals</p>
                      <div className="flex flex-wrap gap-1">
                        {enrichment.intentSignals.map((signal) => (
                          <Badge key={signal} variant="secondary" className="text-xs">{signal}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Abhi tak enrichment nahi ki gayi.</p>
                  <Button size="sm" className="gap-2 w-full" onClick={handleEnrich} disabled={isEnriching}>
                    <Sparkles className="h-3 w-3" />
                    Enrich Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
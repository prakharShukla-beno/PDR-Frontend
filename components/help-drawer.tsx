"use client"

import { useState } from "react"
import { X, ChevronDown } from "lucide-react"

interface HelpDrawerProps {
  open: boolean
  onClose: () => void
}

const SECTIONS = [
  {
    title: "Accounts",
    content: [
      "Import accounts via Excel (Account Name, Website, Country, Industry, Employees, Revenue, Tech Stack, Contact info).",
      "Use Filters to narrow down by industry, tier, or score.",
      "Export the current list to Excel anytime.",
      "Re-Tier All recalculates CLV scores for every account.",
      "Select multiple accounts to bulk delete, add to a segment, or AI Enrich.",
    ],
  },
  {
    title: "Segments & ICP",
    content: [
      "Create an ICP Profile to define your Ideal Customer Profile — industry, size, revenue, tech stack, region, and buyer persona.",
      "Mark one ICP as your Company Benchmark — all accounts get scored against it (ICP Fit Score, 0–100).",
      "Create a Segment to save a filtered list of accounts as a reusable group.",
      "Run Enrich & Score on a segment to AI-enrich all its accounts at once.",
    ],
  },
  {
    title: "Contacts",
    content: [
      "Contacts are linked to accounts and store designation, seniority, and department.",
      "Buyer Persona matching in your ICP looks for contacts whose designation matches your target list (e.g. CTO, CFO).",
    ],
  },
  {
    title: "Duplicates",
    content: [
      "When an imported account matches an existing one (same name or website), it's flagged here for review.",
      "Merge combines both records into one. Keep Both keeps them separate. Skip leaves it pending. Delete removes the duplicate.",
    ],
  },
  {
    title: "Campaigns",
    content: [
      "Create prompt-based outreach campaigns linked to a segment of accounts.",
      "Track sent, open rate, CTR, and conversions per campaign.",
    ],
  },
  {
    title: "Users & Roles",
    content: [
      "Admins can invite teammates by email and assign a role: Admin, Editor, or Viewer.",
      "Admin — full access, can invite/remove users and set the benchmark ICP.",
      "Editor — can import, enrich, and create ICPs/segments, but can't manage users.",
      "Viewer — read-only access, can still export data.",
      "Removed users lose access immediately but their activity history is preserved.",
    ],
  },
]

const FAQS = [
  {
    q: "What's the difference between ICP Fit and CLV?",
    a: "ICP Fit (0-100) measures how closely an account matches your Ideal Customer Profile — industry, size, tech, region, persona. CLV measures the account's business value (revenue capacity, strategic value, margin potential). A great ICP match can still have a low CLV if it lacks strategic signals — they answer different questions.",
  },
  {
    q: "Why is an account's score 0?",
    a: "A score of 0 usually means Tech Fit was a 'No Match' — the account uses technology your company can't service (e.g. legacy/on-premise systems), which disqualifies the CLV score regardless of other factors.",
  },
  {
    q: "Why do some fields show as empty after import?",
    a: "If your Excel file is missing columns like Employee Range or Tech Stack, those fields stay empty until you run AI Enrichment, which fills them in automatically.",
  },
  {
    q: "What happens when I merge a duplicate?",
    a: "The two accounts become one — contacts from both are kept, and the data is combined. The duplicate record is then removed.",
  },
]

export function HelpDrawer({ open, onClose }: HelpDrawerProps) {
  const [openSection, setOpenSection] = useState<string | null>("Accounts")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-labelledby="help-drawer-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 id="help-drawer-title" className="font-semibold text-gray-900 text-base">
              Help & Guide
            </h2>
            <p className="text-xs text-gray-400">How to use Beno PDR</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close help"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-6 p-4 bg-teal-50 border border-teal-100 rounded-xl">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">
              Quick Start
            </p>
            <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
              <li>Import accounts via Excel</li>
              <li>Build your ICP and set it as Benchmark</li>
              <li>Match accounts against your ICP</li>
              <li>Run AI Enrichment to fill in scoring data</li>
              <li>Review CLV scores and sales priority</li>
            </ol>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Features
          </p>
          <div className="space-y-1 mb-6">
            {SECTIONS.map((section) => (
              <div
                key={section.title}
                className="border border-gray-100 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenSection((prev) =>
                      prev === section.title ? null : section.title
                    )
                  }
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  {section.title}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      openSection === section.title ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openSection === section.title && (
                  <div className="px-3 pb-3">
                    <ul className="text-xs text-gray-500 space-y-1.5 list-disc list-inside leading-relaxed">
                      {section.content.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Frequently Asked
          </p>
          <div className="space-y-1">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq((prev) => (prev === i ? null : i))}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <p className="px-3 pb-3 text-xs text-gray-500 leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Still stuck? Reach out to your workspace admin.
          </p>
        </div>
      </div>
    </>
  )
}

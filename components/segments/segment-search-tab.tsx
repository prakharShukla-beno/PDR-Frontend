"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SegmentSearchTabProps {
  query: string
  onQueryChange: (query: string) => void
}

export function SegmentSearchTab({ query, onQueryChange }: SegmentSearchTabProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search accounts by name or domain..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}

"use client"

import { useParams } from "next/navigation"
import { SegmentBuilder } from "@/components/segments/segment-builder"

export default function EditSegmentPage() {
  const { id } = useParams<{ id: string }>()
  return <SegmentBuilder mode="edit" segmentId={id} />
}

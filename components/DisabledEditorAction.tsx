"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface DisabledEditorActionProps {
  label: string
  tooltip: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function DisabledEditorAction({
  label,
  tooltip,
  variant = "outline",
  size = "default",
  className,
}: DisabledEditorActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            variant={variant}
            size={size}
            disabled
            className={cn("gap-2 cursor-not-allowed opacity-60", className)}
          >
            <Lock className="h-3.5 w-3.5 shrink-0" />
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={6}
        hideArrow
        className={cn(
          "max-w-[260px] whitespace-normal text-center leading-snug",
          "bg-sidebar text-sidebar-foreground border border-sidebar-border shadow-md"
        )}
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

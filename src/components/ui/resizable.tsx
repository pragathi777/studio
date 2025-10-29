"use client"

import * as React from "react"
import { ImperativePanelHandle, Panel, PanelGroup } from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = React.forwardRef<
  ImperativePanelHandle,
  React.ComponentProps<typeof PanelGroup>
>(({ className, ...props }, ref) => (
  <PanelGroup
    ref={ref}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
))
ResizablePanelGroup.displayName = "ResizablePanelGroup"

const ResizablePanel = Panel

const ResizableHandle = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    withHandle?: boolean
  }
>(({ className, withHandle, ...props }, ref) => (
  <div
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-panel-group-direction=vertical]>div]:h-px [&[data-panel-group-direction=vertical]>div]:w-full [&[data-panel-group-direction=vertical]>div]:after:left-0 [&[data-panel-group-direction=vertical]>div]:after:h-1 [&[data-panel-group-direction=vertical]>div]:after:w-full [&[data-panel-group-direction=vertical]>div]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:after:translate-x-0 [&[data-panel-group-direction=vertical]]:h-px [&[data-panel-group-direction=vertical]]:w-full",
      className
    )}
    {...props}
  >
    <div
      ref={ref}
      data-resize-handle=""
      className="z-10 flex h-full w-full items-center justify-center"
    >
      {withHandle && (
        <div className="z-10 flex h-2.5 w-8 items-center justify-center rounded-sm border bg-border transition-colors hover:bg-muted-foreground/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            className="h-2.5 w-2.5 rotate-90 text-muted-foreground [&[data-panel-group-direction=vertical]]:rotate-0"
          >
            <path d="M9 18V6m0 0-3 3M9 6l3 3M15 6v12m0 0-3-3m0 0 3-3" />
          </svg>
        </div>
      )}
    </div>
  </div>
))
ResizableHandle.displayName = "ResizableHandle"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }

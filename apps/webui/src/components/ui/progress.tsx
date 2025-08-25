"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress@1.1.2";

import { cn } from "./utils";

function Progress({
  className,
  value,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  variant?: 'default' | 'tech' | 'data'
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'tech':
        return {
          root: "bg-white/10 relative h-2 w-full overflow-hidden rounded-full border border-white/20 backdrop-blur-sm",
          indicator: "bg-gradient-to-r from-blue-400 to-blue-600 h-full w-full flex-1 transition-all duration-500 ease-out shadow-lg shadow-blue-500/20"
        };
      case 'data':
        return {
          root: "bg-white/10 relative h-2 w-full overflow-hidden rounded-full border border-white/20 backdrop-blur-sm",
          indicator: "bg-gradient-to-r from-purple-400 to-purple-600 h-full w-full flex-1 transition-all duration-500 ease-out shadow-lg shadow-purple-500/20 progress-enhanced"
        };
      default:
        return {
          root: "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
          indicator: "bg-primary h-full w-full flex-1 transition-all"
        };
    }
  };

  const classes = getVariantClasses();

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(classes.root, className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={classes.indicator}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

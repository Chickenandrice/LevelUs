"use client";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";

const textVariants = cva("", {
  variants: {
    variant: {
      h1: "text-4xl font-extrabold leading-tight",
      h2: "text-2xl font-semibold",
      lead: "text-lg text-muted-foreground",
      body: "text-base",
      muted: "text-sm text-muted-foreground",
    },
    truncate: {
      true: "truncate",
      false: "",
    },
  },
  defaultVariants: {
    variant: "body",
    truncate: false,
  },
});

export function Text({ variant, className, children, truncate = false }: { variant?: "h1" | "h2" | "lead" | "body" | "muted"; className?: string; children?: React.ReactNode; truncate?: boolean; }) {
  return <div className={cn(textVariants({ variant, truncate }), className)}>{children}</div>;
}

export default Text;

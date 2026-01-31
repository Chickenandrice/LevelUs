"use client";
import React from "react";
import { Button } from "../ui/button";

export default function Controls({ children }: { children?: React.ReactNode; }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

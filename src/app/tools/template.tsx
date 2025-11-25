"use client";

import { FadeIn } from "@/components/FadeIn";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <FadeIn duration={0.4} className="h-full">
      {children}
    </FadeIn>
  );
}

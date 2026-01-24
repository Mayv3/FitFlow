'use client';

import { GlowingEffect } from '@/components/ui/glowing-effect';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowCard({ children, className }: GlowCardProps) {
  return (
    <div className={cn('relative', className)}>
      <GlowingEffect
        spread={40}
        glow
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />

      <div className="relative h-full rounded-xl border bg-background p-4 shadow-sm">
        {children}
      </div>
    </div>
  );
}

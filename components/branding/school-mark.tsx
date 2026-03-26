'use client';

import * as React from 'react';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchoolMarkProps {
  logoUrl?: string | null;
  schoolName?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

export function SchoolMark({
  logoUrl,
  schoolName,
  className,
  imageClassName,
  fallbackClassName,
}: SchoolMarkProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(logoUrl && !imageFailed);

  return (
    <div className={cn('flex items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm', className)}>
      {showImage ? (
        <img
          src={logoUrl!}
          alt={schoolName ? `${schoolName} logo` : 'School logo'}
          className={cn('h-full w-full object-cover', imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center bg-white text-blue-700', fallbackClassName)}>
          <GraduationCap className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}

import * as React from 'react';
import { cn } from '@/utils/cn';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{ initials?: string; src?: string; alt?: string }>;
  max?: number;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, avatars, max = 3, ...props }, ref) => {
    const displayAvatars = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
      <div
        ref={ref}
        className={cn('flex items-center -space-x-2', className)}
        {...props}
      >
        {displayAvatars.map((avatar, i) => (
          <div
            key={i}
            className="relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-background bg-muted"
          >
            {avatar.src ? (
              <img src={avatar.src} alt={avatar.alt || 'Avatar'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary-600 text-xs font-medium text-white">
                {avatar.initials || '?'}
              </div>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className="relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-background bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400">
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

export { AvatarGroup };

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const avatarVariants = cva(
  'relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted'
);

const avatarImageVariants = cva('h-full w-full object-cover');

const avatarFallbackVariants = cva('flex h-full w-full items-center justify-center bg-muted');

const avatarInitialsVariants = cva('flex h-full w-full items-center justify-center bg-primary-600 text-white text-xs font-medium');

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  initials?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, initials, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(avatarVariants(), className)}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="h-full w-full object-cover" />
      ) : initials ? (
        <div className={cn(avatarInitialsVariants())}>
          {initials}
        </div>
      ) : (
        children
      )}
    </div>
  )
);
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement> & VariantProps<typeof avatarImageVariants>>(
  ({ className, ...props }, ref) => (
    <img ref={ref} className={cn(avatarImageVariants(), className)} {...props} />
  )
);
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof avatarFallbackVariants>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(avatarFallbackVariants(), className)}
      {...props}
    />
  )
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };

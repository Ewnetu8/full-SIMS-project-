'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Variants ─────────────────────────────────────────────────────────────────

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full select-none',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-9 w-9 text-sm',
        lg: 'h-11 w-11 text-base',
        xl: 'h-14 w-14 text-lg',
        '2xl': 'h-20 w-20 text-2xl',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

// ─── Status dot ───────────────────────────────────────────────────────────────

const statusColors = {
  online:  'bg-success',
  offline: 'bg-muted-foreground',
  busy:    'bg-warning',
  away:    'bg-warning/70',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  /** Image source URL. */
  src?: string;
  /** Alt text for image. */
  alt?: string;
  /** Fallback initials (2 chars max). */
  fallback?: string;
  /** Online presence status indicator. */
  status?: 'online' | 'offline' | 'busy' | 'away';
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * User avatar with image, fallback initials, and optional status dot.
 *
 * @example
 * <Avatar src="/user.jpg" alt="John Doe" fallback="JD" status="online" />
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, src, alt, fallback, status, ...props }, ref) => (
  <div className="relative inline-flex">
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={alt}
        className="aspect-square h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback
        className={cn(
          'flex h-full w-full items-center justify-center rounded-full font-semibold',
          'bg-gradient-to-br from-primary/80 to-ai-primary/80 text-white',
        )}
        delayMs={200}
      >
        {fallback?.slice(0, 2).toUpperCase()}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>

    {status && (
      <span
        className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-background',
          statusColors[status],
          size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
        )}
        aria-label={`Status: ${status}`}
      />
    )}
  </div>
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

// ─── Avatar Group ─────────────────────────────────────────────────────────────

export interface AvatarGroupProps {
  avatars: Pick<AvatarProps, 'src' | 'alt' | 'fallback'>[];
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

/**
 * Stack of overlapping avatars with overflow count.
 *
 * @example
 * <AvatarGroup avatars={users} max={4} size="sm" />
 */
function AvatarGroup({ avatars, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visible  = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visible.map((avatar, i) => (
        <Avatar
          key={i}
          {...avatar}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            avatarVariants({ size }),
            'ring-2 ring-background',
            'flex items-center justify-center rounded-full',
            'bg-muted text-muted-foreground font-semibold text-xs',
          )}
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup, avatarVariants };

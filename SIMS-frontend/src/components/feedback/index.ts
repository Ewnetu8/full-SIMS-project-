// ─── Feedback Components — Barrel Export ─────────────────────────────────────

export { LoadingSpinner }           from './loading-spinner';
export type { LoadingSpinnerProps } from './loading-spinner';

export {
  Skeleton, SkeletonText, SkeletonAvatar,
  SkeletonCard, SkeletonTable,
}                                   from './skeleton';
export type { SkeletonProps }       from './skeleton';

export { Toaster, toast }           from './toast';

export { Alert }                    from './alert';
export type { AlertProps }          from './alert';

export { EmptyState }               from './empty-state';
export type { EmptyStateProps }     from './empty-state';

export { ErrorState }               from './error-state';
export type { ErrorStateProps }     from './error-state';

export { ConfirmationDialog }       from './confirmation-dialog';
export type { ConfirmationDialogProps } from './confirmation-dialog';

export { ProgressIndicator }        from './progress-indicator';
export type { ProgressIndicatorProps, ProgressStep } from './progress-indicator';

export { SuccessState }             from './success-state';
export type { SuccessStateProps }   from './success-state';

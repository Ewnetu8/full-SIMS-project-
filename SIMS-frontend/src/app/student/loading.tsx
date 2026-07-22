import { Skeleton } from '@/components/feedback';

export default function StudentLoading() {
  return <div className="space-y-6" aria-label="Loading student content"><Skeleton className="h-8 w-56" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><Skeleton className="h-72" /></div>;
}
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function FeedsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
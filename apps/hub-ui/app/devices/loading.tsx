import LoadingState from '@/components/ui/LoadingState';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LoadingState message="Loading devices..." size="lg" />
    </div>
  );
}

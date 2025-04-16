import { Suspense } from 'react';
import { ProfileView } from '@/app/(features)/profile/[userId]/profile-view';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function UserProfilePage({
  params: { userId },
}: {
  params: { userId: string };
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Suspense fallback={<LoadingSpinner />}>
        <ProfileView userId={userId} />
      </Suspense>
    </div>
  );
} 
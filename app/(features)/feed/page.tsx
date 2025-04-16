// app/(features)/feed/page.tsx
import { Feed } from './feed';
import { PageContainer } from "@/components/shared/page-container";

export default function FeedPage() {
  return (
    <PageContainer>
      <Feed />
    </PageContainer>
  );
}
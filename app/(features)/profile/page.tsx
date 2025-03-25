import Profile from "@/app/(features)/profile/profile";
import { ProfileProvider } from "@/components/shared/ProfileContext";

export default function ProfilePage() {
  return (
    <ProfileProvider>
      <Profile />
    </ProfileProvider>
  );
}

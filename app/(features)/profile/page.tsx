import Profile from "@/app/(features)/profile/profile";
import { ProfileProvider } from "@/contexts/ProfileContext";

export default function ProfilePage() {
  return (
    <ProfileProvider>
      <Profile />
    </ProfileProvider>
  );
}

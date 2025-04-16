'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileLinkProps {
  userId: string;
  children: ReactNode;
  className?: string;
}

export function ProfileLink({ userId, children, className = '' }: ProfileLinkProps) {
  const { user } = useAuth();
  
  // If the profile is the current user's, link to the main profile page
  const isCurrentUser = user && (user.id === userId || user._id?.toString() === userId);
  const href = isCurrentUser ? '/profile' : `/profile/${userId}`;
  
  return (
    <Link
      href={href}
      className={`hover:opacity-80 transition-opacity ${className}`}
    >
      {children}
    </Link>
  );
} 
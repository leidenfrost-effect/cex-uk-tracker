'use client';

import React from 'react';
import { ClerkProvider, useUser } from '@clerk/nextjs';
import { AppProvider } from '@/context/AppContext';

function ClerkAwareAppProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  return <AppProvider userId={isLoaded && isSignedIn ? user.id : null} authLoaded={isLoaded}>{children}</AppProvider>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) return <AppProvider authLoaded>{children}</AppProvider>;
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkAwareAppProvider>{children}</ClerkAwareAppProvider>
    </ClerkProvider>
  );
}

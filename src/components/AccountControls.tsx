'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export function AccountControls() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100 transition-colors hover:bg-zinc-700">
            Google ile giriş
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9' } }} />
      </SignedIn>
    </div>
  );
}

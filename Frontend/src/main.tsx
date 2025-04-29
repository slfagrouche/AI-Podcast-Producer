import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Create a JWT template for Supabase integration
const supabaseTemplate = {
  name: 'supabase',
  template: 'supabase',
  // Use the Clerk user ID as Supabase's auth.uid()
  claims: {
    sub: '{{user.id}}',
    user_id: '{{user.id}}',
    email: '{{user.email_addresses.0.email_address}}',
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={(cache) => cache.localStorageCache}
      // Add the JWT template for Supabase integration
      jwtTemplates={[supabaseTemplate]}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);

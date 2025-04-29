import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <SignIn 
          routing="path" 
          path="/login" 
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full max-w-md",
              card: "bg-gray-800/50 dark:bg-gray-200/50 border border-gray-700/50 dark:border-gray-300/50 backdrop-blur-sm",
              headerTitle: "text-white dark:text-gray-900",
              headerSubtitle: "text-gray-400 dark:text-gray-600",
              formFieldLabel: "text-gray-300 dark:text-gray-700",
              formFieldInput: "bg-gray-900/50 dark:bg-white/50 border-gray-700 dark:border-gray-300 text-white dark:text-gray-900",
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
              footerActionLink: "text-indigo-400 hover:text-indigo-300",
              identityPreviewText: "text-gray-300 dark:text-gray-700",
              formFieldInputShowPasswordButton: "text-gray-400 dark:text-gray-600",
              dividerLine: "bg-gray-700/50 dark:bg-gray-300/50",
              dividerText: "text-gray-400 dark:text-gray-600",
              socialButtonsBlockButton: "border-gray-700 dark:border-gray-300 hover:bg-gray-800/50 dark:hover:bg-gray-200/50",
              socialButtonsBlockButtonText: "text-gray-300 dark:text-gray-700",
              alert: "bg-red-900/30 dark:bg-red-100/30 border-red-800 dark:border-red-200 text-red-500",
            },
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
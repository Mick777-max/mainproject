import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#0ea5e9', // Neon blue
              colorTextOnPrimaryBackground: '#ffffff',
              colorBackground: '#1f2937',
              colorInputBackground: '#374151',
              colorInputText: '#f3f4f6',
              colorTextSecondary: '#38bdf8', // Lighter neon blue
              colorDanger: '#ef4444',
              borderRadius: '0.5rem'
            },
            elements: {
              card: "bg-gray-800 border-gray-700",
              headerTitle: "text-sky-400",
              headerSubtitle: "text-sky-300",
              socialButtonsBlockButton: "bg-gray-700 hover:bg-gray-600 text-sky-300",
              socialButtonsBlockButtonText: "text-sky-300",
              dividerLine: "bg-gray-700",
              dividerText: "text-sky-300",
              formButtonPrimary: "bg-sky-500 hover:bg-sky-600 text-white",
              formFieldLabel: "text-sky-300",
              formFieldInput: "bg-gray-700 border-gray-600 text-sky-200",
              formFieldInputPlaceholder: "text-sky-600/50",
              formFieldHintText: "text-sky-300/80",
              formFieldErrorText: "text-red-400",
              userButtonPopoverCard: "bg-gray-800/95 border border-gray-700 backdrop-blur-sm",
              userButtonPopoverText: "text-sky-300 font-medium",
              userButtonPopoverActionButton: "hover:bg-gray-700/70 text-sky-300",
              userButtonPopoverActionButtonText: "text-sky-300",
              userButtonPopoverFooter: "border-t border-gray-700",
              avatarBox: "ring-2 ring-sky-500",
              navbar: "bg-gray-800",
              navbarButton: "text-sky-300 hover:text-sky-200",
              formFieldSuccessText: "text-sky-300",
              footerActionLink: "text-sky-400 hover:text-sky-300",
              identityPreviewText: "text-sky-300 font-medium",
              identityPreviewEditButtonIcon: "text-sky-400",
              // Additional customizations for user profile
              userPreviewMainIdentifier: "text-sky-400 font-semibold",
              userPreviewSecondaryIdentifier: "text-sky-300",
              userButtonTrigger: "ring-2 ring-sky-500/50 hover:ring-sky-500",
              userButtonPopoverActionButtonIcon: "text-sky-400",
              userButtonPopoverActionButtonIconBox: "bg-sky-500/10",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

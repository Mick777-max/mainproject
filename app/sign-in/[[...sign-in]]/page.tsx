import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="aura-heading mt-6 text-3xl font-bold tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-green-500 hover:bg-green-600 text-white",
              footerActionLink: 
                "text-green-600 hover:text-green-500"
            }
          }}
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl="/"
        />
      </div>
    </div>
  );
} 
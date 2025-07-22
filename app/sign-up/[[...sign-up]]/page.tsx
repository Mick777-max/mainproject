import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="aura-heading mt-6 text-3xl font-bold tracking-tight">
            Create an Account
          </h2>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Sign up to get started with our service
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-green-500 hover:bg-green-600 text-white",
              footerActionLink: 
                "text-green-600 hover:text-green-500"
            }
          }}
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
          unsafeMetadata={{
            role: "user"
          }}
        />
      </div>
    </div>
  );
} 
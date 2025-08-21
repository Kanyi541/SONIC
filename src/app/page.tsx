import LoginTabs from "@/components/login/login-tabs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-black via-gray-900 to-yellow-800">
      <div className="w-full max-w-md">
        <h1 className="text-4xl lg:text-5xl font-headline font-extrabold text-center mb-2 text-white shadow-lg">
          CASA Motor Valuers & Assessors Ltd
        </h1>
        <p className="text-center text-gray-300 mb-8 font-body">
          Please select your role and sign in to continue.
        </p>
        <LoginTabs />
      </div>
    </main>
  );
}

import LoginForm from "@/components/auth/login-form";

export const metadata = {
  title: "Login - VulnScope",
  description: "Login to your VulnScope account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
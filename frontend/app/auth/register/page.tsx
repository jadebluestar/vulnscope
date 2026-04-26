import RegisterForm from "@/components/auth/register-form";

export const metadata = {
  title: "Register - VulnScope",
  description: "Create a new VulnScope account",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <RegisterForm />
      </div>
    </div>
  );
}
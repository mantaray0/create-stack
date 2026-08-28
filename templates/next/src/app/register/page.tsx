import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Sign up – {{APP_TITLE}}" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}

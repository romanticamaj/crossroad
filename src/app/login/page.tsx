import { AuthForm } from "@/components/auth-form";
import { login } from "@/app/actions/auth";

export const metadata = { title: "Log in · Crossroad" };

export default function LoginPage() {
  return <AuthForm mode="login" action={login} />;
}

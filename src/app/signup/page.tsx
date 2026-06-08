import { AuthForm } from "@/components/auth-form";
import { signup } from "@/app/actions/auth";

export const metadata = { title: "Sign up · Crossroad" };

export default function SignupPage() {
  return <AuthForm mode="signup" action={signup} />;
}

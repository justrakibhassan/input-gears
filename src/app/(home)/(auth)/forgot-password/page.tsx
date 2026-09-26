import ForgotPasswordView from "@/modules/auth/views/forgot-password-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Input Gears account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}

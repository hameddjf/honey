import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata = {
  robots: { index: false, follow: false },
  title: "فراموشی رمز عبور",
  description: "بازیابی رمز عبور حساب کاربری عسل طبیعی نیکا.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}

import SignupClient from "./SignupClient";

export const metadata = {
  robots: { index: false, follow: false },
  title: "ثبت‌نام",
  description: "یک حساب کاربری جدید در فروشگاه عسل طبیعی نیکا بسازید.",
};

export default function SignupPage() {
  return <SignupClient />;
}

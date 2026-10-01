import LoginClient from "./LoginClient";

export const metadata = {
  robots: { index: false, follow: false },
  title: "ورود به حساب کاربری",
  description: "وارد حساب کاربری خود در فروشگاه عسل طبیعی نیکا شوید.",
};

export default function LoginPage() {
  return <LoginClient />;
}

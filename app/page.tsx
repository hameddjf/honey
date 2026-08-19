import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import Products from "@/components/Products";
import Story from "@/components/Story";
import Process from "@/components/Process";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Intro />
        <Products />
        <Story />
        <Process />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}

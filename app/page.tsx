import Hero from "@/components/Hero";
import Symptoms from "@/components/Symptoms";
import About from "@/components/About";
import Education from "@/components/Education";
import ContactCta from "@/components/ContactCta";

export default function Home() {
  return (
    <>
      <Hero />
      <Symptoms />
      <About />
      <Education />
      <ContactCta />
    </>
  );
}
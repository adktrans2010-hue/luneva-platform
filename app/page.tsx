import Hero from "@/components/Hero";
import Symptoms from "@/components/Symptoms";
import About from "@/components/About";
import Education from "@/components/Education";
import ContactCta from "@/components/ContactCta";
import SectionDivider from "@/components/SectionDivider";

export default function Home() {
  return (
    <>
      <Hero />
      <SectionDivider />

      <Symptoms />
      <SectionDivider />

      <About />
      <SectionDivider />

      <Education />
      <SectionDivider />

      <ContactCta />
    </>
  );
}
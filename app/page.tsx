import Hero from "@/components/Hero";
import Symptoms from "@/components/Symptoms";
import About from "@/components/About";
import Education from "@/components/Education";
import Process from "@/components/Process";
import Reviews from "@/components/Reviews";
import ContactCta from "@/components/ContactCta";
import SectionDivider from "@/components/SectionDivider";

export default async function Home() {
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

      <Process />
      <SectionDivider />

      <Reviews limit={3} />
      <SectionDivider />

      <ContactCta />
    </>
  );
}
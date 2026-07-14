import Hero from "@/components/Hero";
import Symptoms from "@/components/Symptoms";
import About from "@/components/About";
import Education from "@/components/Education";
import Process from "@/components/Process";
import Reviews from "@/components/Reviews";
import Pricing from "@/components/Pricing";
import ContactCta from "@/components/ContactCta";
import SectionDivider from "@/components/SectionDivider";
import { getSeoPage, seoToMetadata } from "@/src/lib/seo";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/"), "/");
}

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

      <Pricing />
      <SectionDivider />

      <ContactCta />
    </>
  );
}

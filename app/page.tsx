import Hero from "@/components/Hero";
import Section from "@/components/Section";
import FeatureGrid from "@/components/FeatureGrid";
import AboutSection from "@/components/home/AboutSection";
import ServicesSection from "@/components/home/ServicesSection";
import CtaSection from "@/components/home/CtaSection";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-100 blur-3xl" />

      <Hero />

      <Section>
        <h2 className="text-3xl font-bold text-slate-900">
          Чем помогает Luneva Psy
        </h2>

        <FeatureGrid />
      </Section>

      <AboutSection />

      <ServicesSection />

      <CtaSection />
    </div>
  );
}
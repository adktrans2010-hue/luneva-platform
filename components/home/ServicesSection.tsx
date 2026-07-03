import Section from "@/components/Section";
import ServiceGrid from "@/components/ServiceGrid";

export default function ServicesSection() {
  return (
    <Section>
      <h2 className="text-3xl font-bold text-slate-900">
        Основные направления работы
      </h2>

      <ServiceGrid />
    </Section>
  );
}
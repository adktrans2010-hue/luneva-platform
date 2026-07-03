import Section from "@/components/Section";

export default function About() {
  return (
    <Section>
      <p className="text-sm font-medium uppercase tracking-widest text-slate-500">
        О проекте
      </p>

      <h1 className="mt-4 text-5xl font-bold tracking-tight text-slate-900">
        Luneva Platform
      </h1>

      <p className="mt-6 text-lg leading-8 text-slate-600">
        Это платформа нового поколения для управления сайтами. Мы создаём
        современную, быструю и гибкую альтернативу WordPress.
      </p>
    </Section>
  );
}
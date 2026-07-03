import Button from "@/components/Button";
import Section from "@/components/Section";

export default function AboutSection() {
  return (
    <Section>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-12">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">
          О специалисте
        </p>

        <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          Психологическая помощь с уважением к вашему темпу
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Luneva Psy — это пространство для людей, которые хотят лучше понять
          себя, свои эмоции, отношения и внутренние опоры.
        </p>

        <div className="mt-8">
          <Button variant="secondary">
            Подробнее о подходе
          </Button>
        </div>
      </div>
    </Section>
  );
}
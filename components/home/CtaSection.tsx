import Button from "@/components/Button";
import Section from "@/components/Section";

export default function CtaSection() {
  return (
    <Section>
      <div className="rounded-3xl bg-slate-900 p-8 text-white md:p-12">
        <h2 className="text-4xl font-bold tracking-tight">
          Сделайте первый шаг к себе
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Если вы чувствуете, что готовы поговорить о важном, Luneva Psy станет
          спокойным и безопасным пространством для этого разговора.
        </p>

        <div className="mt-8">
          <Button>Записаться на консультацию</Button>
        </div>
      </div>
    </Section>
  );
}
import Button from "@/components/Button";

export default function Hero() {
  return (
    <section className="py-24">
      <div className="max-w-4xl">
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          ✨ Новое поколение психологической практики
        </span>

        <h1 className="mt-8 text-6xl font-bold tracking-tight text-slate-900">
          Пространство,
          <br />
          где начинается
          <span className="text-sky-600"> путь к себе.</span>
        </h1>

        <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-600">
          Luneva Psy — современная психологическая практика,
          где бережность сочетается с научным подходом,
          а технологии помогают сделать помощь доступнее.
        </p>

        <div className="mt-10 flex gap-4">
          <Button>Записаться на консультацию</Button>

          <Button variant="secondary">
            Узнать больше
          </Button>
        </div>
      </div>
    </section>
  );
}
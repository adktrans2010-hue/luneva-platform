import { getSeoPage, seoToMetadata } from "@/src/lib/seo";
import ConsultationCta from "@/components/sections/ConsultationCta";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/help"));
}

const helpItems = [
  {
    title: "Тревога и внутреннее напряжение",
    text: "Когда сложно расслабиться, мысли постоянно крутятся, а тело живёт в состоянии напряжения.",
  },
  {
    title: "Панические состояния",
    text: "Когда накрывает страх, учащается сердцебиение и появляется ощущение потери контроля.",
  },
  {
    title: "Травма и ПТСР",
    text: "Когда прошлый опыт продолжает влиять на настоящее, отношения и ощущение безопасности.",
  },
  {
    title: "Отношения и семья",
    text: "Когда трудно говорить о важном, выстраивать границы и сохранять близость.",
  },
  {
    title: "Расстройства пищевого поведения",
    text: "Когда еда, тело и контроль становятся источником тревоги и внутреннего конфликта.",
  },
  {
    title: "Потеря опоры и смысла",
    text: "Когда кажется, что вы живёте не свою жизнь и трудно понять, куда двигаться дальше.",
  },
];

export default function HelpPage() {
  return (
    <section className="luneva-fade bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Психологическая помощь
        </p>

        <h1 className="max-w-4xl font-serif text-6xl leading-tight text-[#332725]">
          С чем можно обратиться
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">
          В терапии мы бережно исследуем то, что сейчас мешает жить спокойнее,
          лучше понимать себя и строить отношения с собой и другими.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {helpItems.map((item) => (
            <div
              key={item.title}
              className="luneva-card rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
            >
              <div className="mb-6 text-3xl text-[#c98778]">✦</div>

              <h2 className="text-xl font-medium text-[#332725]">
                {item.title}
              </h2>

              <p className="mt-4 leading-7 text-[#5f5552]">{item.text}</p>
            </div>
          ))}
        </div>

        <ConsultationCta className="mt-16 px-0 py-0" />
      </div>
    </section>
  );
}

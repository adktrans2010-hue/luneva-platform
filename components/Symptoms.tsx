import Container from "@/components/Container";
import SymptomsCarousel from "@/components/SymptomsCarousel";

export default function Symptoms() {
  return (
    <section
      id="when-to-seek-help"
      className="scroll-mt-24 overflow-hidden bg-[#fff8f6] py-24 lg:py-28"
    >
      <Container>
        <div className="md:pl-16 lg:pl-[72px]">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Когда стоит обратиться
          </p>

          <h2 className="max-w-3xl font-serif text-4xl leading-[1.12] text-[#332725] sm:text-5xl">
            Я могу быть рядом,
            <br />
            когда становится сложно
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5552]">
            В терапии мы бережно исследуем ваши переживания, ищем причины
            трудностей и находим новые способы справляться с жизненными
            ситуациями.
          </p>
        </div>

        <SymptomsCarousel />
      </Container>
    </section>
  );
}

import Image from "next/image";

type ConsultationCtaProps = {
  bookingHref?: string;
  aboutHref?: string;
  imageSrc?: string;
};

export default function ConsultationCta({
  bookingHref = "/contacts#booking",
  aboutHref = "/about",
  imageSrc = "/images/cta/consultation-cta-vase.png",
}: ConsultationCtaProps) {
  return (
    <section className="bg-[#fff8f6] px-4 py-20 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="relative grid overflow-hidden rounded-[32px] bg-[#fbf3ef] md:min-h-[430px] md:grid-cols-[57fr_43fr]">
          <div className="px-8 py-10 md:px-12 md:py-14 lg:px-20 lg:py-16">
            <h2 className="font-serif text-[38px] font-normal leading-[1.18] text-[#2f2926] sm:text-[42px] lg:text-[58px]">
              Если вам чувствуете, что
              <br />
              готовы поговорить о важном
            </h2>

            <p className="mt-7 max-w-3xl text-[20px] leading-[1.7] text-[#3f3936] lg:text-[24px]">
              Оставьте заявку, и мы обсудим ваш запрос, формат
              <br />
              работы и первый удобный шаг к изменениям.
            </p>

            <div className="mt-10 flex flex-col gap-5 md:flex-row">
              <a
                href={bookingHref}
                className="inline-flex h-14 items-center justify-center rounded-[14px] bg-[#332a26] px-8 text-[16px] font-medium text-white hover:bg-[#3d322e]"
              >
                <span>Записаться на консультацию</span>
                <span className="ml-3" aria-hidden="true">
                  →
                </span>
              </a>

              <a
                href={aboutHref}
                className="inline-flex h-14 items-center justify-center rounded-[14px] border border-[#d9aaa0] bg-transparent px-8 text-[16px] font-medium text-[#a87064] hover:bg-white/30"
              >
                Узнать обо мне
              </a>
            </div>
          </div>

          <div className="relative h-[290px] md:h-auto">
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 45vw"
              className="object-cover object-center"
              priority={false}
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-32 bg-gradient-to-r from-[#fbf3ef] to-transparent md:block" />
          </div>
        </div>
      </div>
    </section>
  );
}

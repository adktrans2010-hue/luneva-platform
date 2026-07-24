import Image from "next/image";

type ConsultationCtaProps = {
  bookingHref?: string;
  aboutHref?: string;
  imageSrc?: string;
  className?: string;
};

export default function ConsultationCta({
  bookingHref = "/contacts#booking",
  aboutHref = "/about",
  imageSrc = "/images/cta/consultation-cta-vase.png",
  className = "",
}: ConsultationCtaProps) {
  return (
    <section className={`bg-[#fff8f6] px-4 py-14 md:px-6 ${className}`}>
      <div className="mx-auto max-w-7xl">
        <div className="relative grid overflow-hidden rounded-[28px] border border-[#f0ddd6] bg-[#fbf3ef] shadow-sm md:min-h-[330px] md:grid-cols-[54fr_46fr]">
          <div className="relative z-10 px-7 py-9 md:px-12 md:py-10 lg:px-16">
            <h2 className="max-w-[640px] font-serif text-[34px] font-normal leading-[1.15] text-[#2f2926] sm:text-[42px] lg:text-[54px]">
              Если вы чувствуете, что
              <br />
              готовы поговорить о важном
            </h2>

            <p className="mt-6 max-w-2xl text-[18px] leading-[1.65] text-[#4b413d] lg:text-[21px]">
              Оставьте заявку, и мы обсудим ваш запрос, формат работы и первый
              удобный шаг к изменениям.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={bookingHref}
                className="inline-flex h-14 items-center justify-center rounded-[14px] bg-[#332a26] px-7 text-[15px] font-medium text-white shadow-lg shadow-[#332a26]/10 transition hover:bg-[#3d322e]"
              >
                <span>Записаться на консультацию</span>
                <span className="ml-3" aria-hidden="true">
                  →
                </span>
              </a>

              <a
                href={aboutHref}
                className="inline-flex h-14 items-center justify-center rounded-[14px] border border-[#d9aaa0] bg-white/25 px-7 text-[15px] font-medium text-[#a87064] transition hover:bg-white/45"
              >
                Узнать обо мне
              </a>
            </div>
          </div>

          <div className="relative min-h-[210px] md:h-auto">
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 45vw"
              className="object-cover object-center"
              priority={false}
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-56 bg-gradient-to-r from-[#fbf3ef] via-[#fbf3ef]/82 to-transparent md:block" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#fbf3ef]/55 to-transparent md:hidden" />
          </div>
        </div>
      </div>
    </section>
  );
}

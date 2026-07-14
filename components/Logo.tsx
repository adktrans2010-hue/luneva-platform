import Image from "next/image";

type LogoProps = {
  variant?: "header" | "footer";
};

export default function Logo({ variant = "header" }: LogoProps) {
  const isFooter = variant === "footer";
  const wrapperClassName = isFooter
    ? "relative isolate block h-16 w-[281px] shrink-0 overflow-hidden sm:h-20 sm:w-[365px]"
    : "relative isolate block h-12 w-[210px] shrink-0 overflow-hidden min-[375px]:w-[245px] sm:h-20 sm:w-[365px]";

  return (
    <span className={wrapperClassName}>
      <Image
        src="/luneva-alexandra-logo-transparent.png"
        alt="Лунева Александра — психолог"
        width={1774}
        height={887}
        preload={!isFooter}
        sizes={isFooter ? "(max-width: 639px) 281px, 365px" : "(max-width: 374px) 210px, (max-width: 639px) 245px, 365px"}
        className="absolute top-1/2 left-1/2 h-auto w-full max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </span>
  );
}

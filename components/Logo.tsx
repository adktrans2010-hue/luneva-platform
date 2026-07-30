import Image from "next/image";

type LogoProps = {
  variant?: "header" | "footer";
};

export default function Logo({ variant = "header" }: LogoProps) {
  const isFooter = variant === "footer";
  const wrapperClassName = isFooter
    ? "relative isolate block h-16 w-full max-w-[281px] shrink-0 overflow-visible sm:h-20 sm:max-w-[365px]"
    : "relative isolate block h-16 w-32 shrink-0 overflow-visible min-[375px]:h-[72px] min-[375px]:w-36 sm:h-20 sm:w-40";

  return (
    <span className={wrapperClassName}>
      <Image
        src="/luneva-alexandra-logo-transparent.png"
        alt="Лунева Александра — психолог"
        width={1774}
        height={887}
        preload={!isFooter}
        sizes={isFooter ? "(max-width: 639px) 281px, 365px" : "(max-width: 374px) 220px, (max-width: 639px) 255px, 365px"}
        className={isFooter ? "absolute top-1/2 left-1/2 h-auto w-full max-w-none -translate-x-1/2 -translate-y-1/2" : "h-full w-full object-contain"}
      />
    </span>
  );
}

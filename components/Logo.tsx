import Image from "next/image";

type LogoProps = {
  variant?: "header" | "footer";
};

export default function Logo({ variant = "header" }: LogoProps) {
  const isFooter = variant === "footer";

  return (
    <span
      className={`relative isolate block shrink-0 overflow-hidden ${
        isFooter
          ? "h-16 w-[281px] sm:h-20 sm:w-[365px]"
          : "h-14 w-[243px] min-[360px]:w-[273px] sm:h-16 sm:w-[330px]"
      }`}
    >
      <Image
        src="/luneva-alexandra-logo-transparent.png"
        alt="Лунева Александра — психолог"
        width={1774}
        height={887}
        preload={!isFooter}
        className="absolute top-1/2 left-1/2 h-auto w-full max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </span>
  );
}

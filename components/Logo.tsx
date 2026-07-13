import Image from "next/image";

type LogoProps = {
  variant?: "header" | "footer";
};

export default function Logo({ variant = "header" }: LogoProps) {
  const isFooter = variant === "footer";

  return (
    <Image
      src="/luneva-alexandra-logo.png"
      alt="Лунева Александра — психолог"
      width={1774}
      height={887}
      priority={!isFooter}
      className={`max-w-full object-contain ${
        isFooter ? "h-16 w-auto sm:h-20" : "h-14 w-auto sm:h-16"
      }`}
    />
  );
}

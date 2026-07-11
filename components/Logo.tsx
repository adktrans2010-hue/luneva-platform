import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-4">
      <Image
        src="/logo-transparent.png"
        alt="Luneva Psy"
        width={72}
        height={72}
        priority
        className="
          h-16
          w-16
          object-contain
        "
      />

      <div>
        <div className="font-serif text-2xl text-[#332725]">
          Luneva Psy
        </div>

        <div className="text-xs tracking-[0.2em] text-[#c98778]">
          psychology
        </div>
      </div>
    </div>
  );
}

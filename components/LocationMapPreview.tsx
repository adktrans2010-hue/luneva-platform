import Image from "next/image";

type Props = { title: string; address: string; href: string; image: string; alt: string };

export default function LocationMapPreview({ title, address, href, image, alt }: Props) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      aria-label={`Открыть карту: ${title}, ${address}`}
      className="group relative mx-6 block h-40 overflow-hidden rounded-2xl border border-[#ead7d1] bg-[#f3eee7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d443e] md:mx-8 md:h-48">
      <Image src={image} alt={alt} fill sizes="(min-width: 1344px) 560px, (min-width: 1024px) calc(50vw - 100px), calc(100vw - 100px)"
        className="object-cover object-center transition-[filter] group-hover:brightness-95" />
    </a>
  );
}

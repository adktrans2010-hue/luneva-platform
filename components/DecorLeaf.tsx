export default function DecorLeaf({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`
        pointer-events-none
        select-none
        font-serif
        text-[#d8a096]/40
        ${className}
      `}
    >
      ❧
    </div>
  );
}
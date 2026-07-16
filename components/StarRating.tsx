"use client";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

export default function StarRating({
  value,
  onChange,
  label = "Оценка",
  size = "md",
}: StarRatingProps) {
  const normalizedValue = Math.min(5, Math.max(0, Math.round(value)));

  return (
    <div
      className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}
      role={onChange ? "radiogroup" : "img"}
      aria-label={`${label}: ${normalizedValue} из 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= normalizedValue;

        if (!onChange) {
          return (
            <span
              key={star}
              aria-hidden="true"
              className={active ? "text-[#c98778]" : "text-[#e8d8d3]"}
            >
              ★
            </span>
          );
        }

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === normalizedValue}
            aria-label={`${star} из 5`}
            onClick={() => onChange(star)}
            className={`min-h-11 min-w-11 rounded-md transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778] ${
              active ? "text-[#c98778]" : "text-[#e8d8d3]"
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

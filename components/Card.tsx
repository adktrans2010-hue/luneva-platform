export default function Card({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
      <h3 className="text-xl font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-slate-600">
        {description}
      </p>
    </div>
  );
}
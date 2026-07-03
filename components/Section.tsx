export default function Section({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-3xl py-16">
      {children}
    </section>
  );
}
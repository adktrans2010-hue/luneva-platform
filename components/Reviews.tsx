import Image from "next/image";

const reviews = [
  {
    name: "Василина",
    age: "22 года",
    date: "03 марта 2024 г.",
    image: "/reviews/female.jpg",
    text: "Александра прекрасный специалист. Помогла разобраться в сложной жизненной ситуации и увидеть, куда двигаться дальше.",
  },
  {
    name: "Роман",
    age: "23 года",
    date: "13 февраля 2024 г.",
    image: "/reviews/male.jpg",
    text: "На встречах было спокойно и комфортно. Получилось лучше понять свои эмоции и навести порядок в голове.",
  },
  {
    name: "Татьяна",
    age: "37 лет",
    date: "29 января 2024 г.",
    image: "/reviews/female.jpg",
    text: "Работа со специалистом понравилась. Получила ответы на важные вопросы и почувствовала больше опоры.",
  },
];

export default function Reviews() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Отзывы
        </p>

        <h2 className="font-serif text-5xl text-[#332725]">
          Истории людей, которые обратились за поддержкой
        </h2>

        <div className="mt-20 grid gap-10 md:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="relative rounded-[2rem] border border-[#ead7d1] bg-white px-8 pb-8 pt-20 text-center shadow-sm"
            >
              <div className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-white p-2 shadow-lg">
                <Image
                  src={review.image}
                  alt={review.name}
                  width={96}
                  height={96}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>

              <h3 className="text-lg font-medium uppercase tracking-wide text-[#332725]">
                {review.name}, {review.age}
              </h3>

              <div className="mt-4 text-[#c98778]">★★★★★</div>

              <p className="mt-8 font-serif text-lg italic leading-8 text-[#332725]">
                {review.text}
              </p>

              <p className="mt-8 text-sm text-[#8a7a76]">{review.date}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
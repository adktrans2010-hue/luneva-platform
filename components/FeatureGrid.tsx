import Card from "@/components/Card";

export default function FeatureGrid() {
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <Card
        title="Бережная поддержка"
        description="Помогаем разобраться в себе без давления, осуждения и спешки."
      />

      <Card
        title="Понятный путь"
        description="Структурируем запрос и постепенно движемся к устойчивым изменениям."
      />

      <Card
        title="Современный подход"
        description="Соединяем психологическую практику, контент и удобные цифровые инструменты."
      />

      <Card
        title="Личное пространство"
        description="Создаём атмосферу, где можно безопасно говорить о важном."
      />
    </div>
  );
}
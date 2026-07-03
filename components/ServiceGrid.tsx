import Card from "@/components/Card";

export default function ServiceGrid() {
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-3">
      <Card
        title="Индивидуальные консультации"
        description="Работа с тревогой, самооценкой, кризисами и внутренними конфликтами."
      />

      <Card
        title="Семейные отношения"
        description="Поддержка в вопросах общения, доверия и поиска взаимопонимания."
      />

      <Card
        title="Личностное развитие"
        description="Помощь в поиске своих ценностей, целей и внутренней устойчивости."
      />
    </div>
  );
}
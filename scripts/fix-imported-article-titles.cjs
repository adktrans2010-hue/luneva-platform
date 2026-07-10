const { Client } = require("pg");

const updates = [
  {
    match: "5-страхов-обращения-к-психологу",
    title: "5 страхов обращения к психологу",
    category: "Психотерапия",
  },
  {
    match: "как-ограничивающие-убеждения-мешают-нам-достигать%",
    title: "Как ограничивающие убеждения мешают нам достигать целей",
    category: "Психология",
  },
  {
    match: "выстраиваем-личные-границы",
    title: "Выстраиваем личные границы",
    category: "Психология",
  },
  {
    match: "травмы-взрослых-дете%",
    title: "Травмы взрослых детей алкоголиков",
    category: "Травма и семья",
  },
  {
    match: "компульсии-навязчивые%",
    title: "Компульсии: навязчивые действия и детский опыт",
    category: "Психология",
  },
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  for (const update of updates) {
    await client.query(
      "update articles set title=$1, category=$2, updated_at=now() where slug like $3",
      [update.title, update.category, update.match]
    );
  }

  const result = await client.query(
    "select count(*)::int as total from articles where published=true"
  );

  console.log(`Published articles: ${result.rows[0].total}`);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

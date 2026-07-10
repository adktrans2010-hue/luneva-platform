const { Client } = require("pg");

const transliterationMap = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function createSlug(value) {
  return (
    value
      .toLowerCase()
      .split("")
      .map((letter) => transliterationMap[letter] ?? letter)
      .join("")
      .normalize("NFC")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "article"
  );
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query("select id, title from articles order by created_at asc");
  const used = new Set();

  for (const article of result.rows) {
    const base = createSlug(article.title);
    let slug = base;
    let index = 2;

    while (used.has(slug)) {
      slug = `${base}-${index}`;
      index += 1;
    }

    used.add(slug);

    await client.query("update articles set slug=$1, updated_at=now() where id=$2", [
      slug,
      article.id,
    ]);
  }

  console.log(`Updated ${result.rows.length} article slugs`);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

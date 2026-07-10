const { execFileSync } = require("node:child_process");
const { Client } = require("pg");

const docxPath = process.argv[2];

if (!docxPath) {
  throw new Error("Укажите путь к DOCX-файлу.");
}

function extractParagraphs(path) {
  const script = `
    $Path = $env:DOCX_IMPORT_PATH
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip=[System.IO.Compression.ZipFile]::OpenRead($Path)
    try {
      $entry=$zip.GetEntry('word/document.xml')
      $reader=New-Object System.IO.StreamReader($entry.Open())
      $xmlText=$reader.ReadToEnd()
      $reader.Close()
      [xml]$xml=$xmlText
      $ns=New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
      $ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
      $paras=$xml.SelectNodes('//w:body/w:p',$ns)
      $lines=@()
      foreach($p in $paras){
        $texts=$p.SelectNodes('.//w:t',$ns) | ForEach-Object { $_.'#text' }
        $line=($texts -join '').Trim()
        if($line){ $lines += $line }
      }
      $lines | ConvertTo-Json -Depth 2
    } finally {
      $zip.Dispose()
    }
  `;

  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    {
      encoding: "utf8",
      env: { ...process.env, DOCX_IMPORT_PATH: path },
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  return JSON.parse(output);
}

function splitArticles(lines) {
  const articles = [];
  let current = [];

  for (const rawLine of lines) {
    const line = String(rawLine).replace(/\u2800/g, "").trim();

    if (/^\d+\s+текст$/i.test(line)) {
      if (current.length) {
        articles.push(current);
        current = [];
      }
      continue;
    }

    if (line) {
      current.push(line);
    }
  }

  if (current.length) {
    articles.push(current);
  }

  return articles;
}

function createSlug(value) {
  return (
    value
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "article"
  );
}

function excerptFrom(content) {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > 220 ? `${clean.slice(0, 217).trim()}...` : clean;
}

function categoryFor(title, content) {
  const text = `${title} ${content}`.toLowerCase();

  if (text.includes("self") || text.includes("селф") || text.includes("кризис")) {
    return "Кризисы и самопомощь";
  }

  if (text.includes("пищ") || text.includes("переед") || text.includes("детокс")) {
    return "РПП и питание";
  }

  if (text.includes("подрост") || text.includes("ребен") || text.includes("детей") || text.includes("абьюз")) {
    return "Подростки и семья";
  }

  if (text.includes("психотерап") || text.includes("гештальт") || text.includes("психолог")) {
    return "Психотерапия";
  }

  return "Психология";
}

const titleOverrides = new Map([
  [1, "Детокс-диеты и мифы о детоксикации"],
  [14, "Self-harm: что важно знать"],
  [16, "Как перестать совершать self-harm"],
  [17, "Как преодолевать трудности без self-harm"],
  [18, "Мифы о self-harm"],
  [19, "Как помочь человеку, который совершает self-harm"],
  [20, "Расстройства пищевого поведения и влияние среды"],
  [23, "Переедание: причины и признаки"],
  [24, "Компульсии: навязчивые действия и детский опыт"],
]);

function buildArticle(lines, index) {
  const firstLine = lines[0] ?? `Статья ${index}`;
  const title = titleOverrides.get(index) ?? firstLine.replace(/[🔪💫🤨😭😏😔]/g, "").trim();
  const content = lines.join("\n\n");

  return {
    title,
    slug: createSlug(title),
    category: categoryFor(title, content),
    excerpt: excerptFrom(index === 1 ? content : lines.slice(1).join(" ") || content),
    content,
    published: true,
  };
}

async function main() {
  const lines = extractParagraphs(docxPath);
  const articleBlocks = splitArticles(lines);
  const articles = articleBlocks.map((block, index) => buildArticle(block, index + 1));
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  await client.connect();

  for (const article of articles) {
    await client.query(
      `
        insert into articles (title, slug, category, excerpt, content, published, created_at, updated_at)
        values ($1, $2, $3, $4, $5, true, now(), now())
        on conflict (slug) do update set
          title = excluded.title,
          category = excluded.category,
          excerpt = excluded.excerpt,
          content = excluded.content,
          published = true,
          updated_at = now()
      `,
      [article.title, article.slug, article.category, article.excerpt, article.content]
    );
  }

  await client.end();

  console.log(`Imported ${articles.length} articles`);
  for (const article of articles) {
    console.log(`- ${article.title} / ${article.category}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

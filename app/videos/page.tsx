import { getPublishedVideos } from "@/src/lib/videos";
import { getSeoPage, seoToMetadata } from "@/src/lib/seo";
import TrackedVideoLink from "@/components/TrackedVideoLink";

const typeLabels: Record<string, string> = {
  short: "Короткое видео",
  long: "Длинное видео",
};

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/videos"), "/videos");
}

export default async function VideosPage() {
  const videos = await getPublishedVideos();
  const shortVideos = videos.filter((video) => video.type === "short");
  const longVideos = videos.filter((video) => video.type === "long");
  const videosJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Полезные видео Луневой Александры",
    itemListElement: videos.map((video, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "VideoObject",
        name: video.seoTitle || video.title,
        description: video.seoDescription || video.description || video.topic,
        keywords: video.seoKeywords || video.topic,
        uploadDate: video.createdAt.toISOString(),
        url: video.url,
      },
    })),
  };

  return (
    <section className="luneva-fade bg-[#fff8f6] px-6 py-24">
      {videos.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videosJsonLd) }}
        />
      )}

      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Видео
        </p>

        <h1 className="max-w-4xl font-serif text-6xl leading-tight text-[#332725]">
          Полезные видео
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Короткие и длинные видео по темам психологии, отношений, тревоги и
          внутренней устойчивости.
        </p>

        <VideoSection title="Короткие видео" videos={shortVideos} />
        <VideoSection title="Длинные видео" videos={longVideos} />
      </div>
    </section>
  );
}

function VideoSection({
  title,
  videos,
}: {
  title: string;
  videos: Awaited<ReturnType<typeof getPublishedVideos>>;
}) {
  return (
    <section className="mt-16">
      <h2 className="font-serif text-4xl text-[#332725]">{title}</h2>

      {videos.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <article
              key={video.id}
              className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm"
            >
              <p className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                {video.topic}
              </p>

              <h3 className="mt-4 text-2xl font-medium leading-snug text-[#332725]">
                {video.title}
              </h3>

              {video.description && (
                <p className="mt-4 leading-7 text-[#5f5552]">
                  {video.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[#8a7a76]">
                <span>{typeLabels[video.type]}</span>
                {video.platform && <span>{video.platform}</span>}
              </div>

              <TrackedVideoLink
                href={video.url}
                title={video.title}
                className="mt-6 inline-flex rounded-2xl bg-[#332725] px-5 py-3 text-white"
              >
                Смотреть видео
              </TrackedVideoLink>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[2rem] border border-[#ead7d1] bg-white p-8 text-[#5f5552] shadow-sm">
          Видео в этом разделе скоро появятся.
        </div>
      )}
    </section>
  );
}

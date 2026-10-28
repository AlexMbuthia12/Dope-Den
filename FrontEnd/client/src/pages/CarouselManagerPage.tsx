import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJson } from "@/lib/auth";

type CarouselSlideType = "image" | "video";

type CarouselSlide = {
  id: string;
  type: CarouselSlideType;
  src: string;
  title: string;
  subtitle: string;
  cta?: string;
};

const STORAGE_KEY = "dopeden-carousel-items";

const getStoredSlides = (): CarouselSlide[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CarouselSlide[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveSlides = (slides: CarouselSlide[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
};

const normalizeSlideForUi = (slide: any): CarouselSlide => ({
  id: slide?._id || slide?.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type: slide?.type === "video" ? "video" : "image",
  src: slide?.src || "",
  title: slide?.title || "Featured drop",
  subtitle: slide?.subtitle || "Fresh arrivals for the season.",
  cta: slide?.cta || "Shop now",
});

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        reject(new Error("Unable to read file."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });

export default function CarouselManagerPage() {
  const [, setLocation] = useLocation();
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [draft, setDraft] = useState({
    type: "image" as CarouselSlideType,
    src: "",
    title: "",
    subtitle: "",
    cta: "Shop now",
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const payload = await apiJson<any[]>("/carousel");
        const normalized = (payload || []).map(normalizeSlideForUi);
        setSlides(normalized);
        saveSlides(normalized);
      } catch {
        const fallback = getStoredSlides();
        setSlides(fallback);
      }
    };

    void loadSlides();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setMessage("Please upload an image or video file.");
      return;
    }

    try {
      const src = await readFileAsDataUrl(file);
      setDraft((prev) => ({ ...prev, type: file.type.startsWith("video/") ? "video" : "image", src }));
      setMessage(`${file.name} loaded and ready to save.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "File upload failed.");
    } finally {
      event.target.value = "";
    }
  };

  const handleAddSlide = async () => {
    if (!draft.src.trim()) {
      setMessage("Please add a media URL or upload a file first.");
      return;
    }

    try {
      const payload = await apiJson<{ slide?: any; message?: string }>("/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim() || "Featured drop",
          subtitle: draft.subtitle.trim() || "Fresh arrivals for the season.",
          cta: draft.cta.trim() || "Shop now",
          type: draft.type,
          src: draft.src.trim(),
        }),
      });

      const createdSlide = normalizeSlideForUi(payload?.slide || {
        _id: `local-${Date.now()}`,
        ...draft,
      });

      const nextSlides = [createdSlide, ...slides];
      setSlides(nextSlides);
      saveSlides(nextSlides);
      setDraft({ type: "image", src: "", title: "", subtitle: "", cta: "Shop now" });
      setMessage(payload?.message || "Carousel item added successfully.");
    } catch (error) {
      const newSlide: CarouselSlide = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: draft.type,
        src: draft.src.trim(),
        title: draft.title.trim() || "Featured drop",
        subtitle: draft.subtitle.trim() || "Fresh arrivals for the season.",
        cta: draft.cta.trim() || "Shop now",
      };

      const nextSlides = [newSlide, ...slides];
      setSlides(nextSlides);
      saveSlides(nextSlides);
      setDraft({ type: "image", src: "", title: "", subtitle: "", cta: "Shop now" });
      setMessage(error instanceof Error ? error.message : "Saved locally because backend is unavailable.");
    }
  };

  const handleDelete = async (id: string) => {
    const slideToDelete = slides.find((slide) => slide.id === id);
    const nextSlides = slides.filter((slide) => slide.id !== id);
    setSlides(nextSlides);
    saveSlides(nextSlides);

    if (slideToDelete && slideToDelete.id.startsWith("local-")) {
      setMessage("Carousel item removed locally.");
      return;
    }

    try {
      await apiJson(`/carousel/${id}`, { method: "DELETE" });
      setMessage("Carousel item removed from backend.");
    } catch {
      setMessage("Carousel item removed locally; backend sync could not complete.");
    }
  };

  return (
    <DefaultLayout title="Hero carousel manager" subtitle="Add promotional carousel slides for the storefront">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Media type</label>
                <select
                  value={draft.type}
                  onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as CarouselSlideType }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Image or video URL</label>
                <Input
                  value={draft.src}
                  onChange={(event) => setDraft((prev) => ({ ...prev, src: event.target.value }))}
                  placeholder="https://example.com/hero.jpg"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Headline</label>
                <Input
                  value={draft.title}
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Summer drop"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Subtitle</label>
                <Input
                  value={draft.subtitle}
                  onChange={(event) => setDraft((prev) => ({ ...prev, subtitle: event.target.value }))}
                  placeholder="Fresh arrivals and premium essentials"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">CTA text</label>
                <Input
                  value={draft.cta}
                  onChange={(event) => setDraft((prev) => ({ ...prev, cta: event.target.value }))}
                  placeholder="Shop now"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Upload image/video</label>
                <Input type="file" accept="image/*,video/*" onChange={handleFileUpload} />
              </div>

              <div className="flex gap-3">
                <Button type="button" onClick={handleAddSlide}>Add slide</Button>
                <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                  Back to store
                </Button>
              </div>

              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <p className="mb-3 text-sm font-semibold">Live preview</p>
              {draft.src ? (
                <div className="overflow-hidden rounded-xl border border-border bg-muted">
                  {draft.type === "video" ? (
                    <video src={draft.src} controls className="h-72 w-full object-cover" />
                  ) : (
                    <img src={draft.src} alt={draft.title || "Slide preview"} className="h-72 w-full object-cover" />
                  )}
                  <div className="space-y-2 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Featured</p>
                    <h3 className="text-2xl font-bold">{draft.title || "Featured drop"}</h3>
                    <p className="text-sm text-muted-foreground">{draft.subtitle || "Fresh arrivals for the season."}</p>
                    <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium">
                      {draft.cta || "Shop now"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                  Upload or add a media URL to preview it.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Saved slides</h3>
            <span className="text-sm text-muted-foreground">{slides.length} total</span>
          </div>

          {slides.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No carousel items saved yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {slides.map((slide) => (
                <div key={slide.id} className="overflow-hidden rounded-xl border border-border bg-background">
                  <div className="relative h-44">
                    {slide.type === "video" ? (
                      <video src={slide.src} muted loop autoPlay playsInline className="h-full w-full object-cover" />
                    ) : (
                      <img src={slide.src} alt={slide.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {slide.type}
                      </span>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(slide.id)}>
                        Remove
                      </Button>
                    </div>
                    <p className="text-sm font-semibold">{slide.title}</p>
                    <p className="text-xs text-muted-foreground">{slide.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
}

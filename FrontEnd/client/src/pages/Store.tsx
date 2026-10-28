import { Button } from "@/components/ui/button";
import DefaultLayout from "@/components/DefaultLayout";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/auth";
import { Link } from "wouter";

type CategoryNode = {
  _id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
};

type ProductRecord = {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  discount?: string | null;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  stock?: number;
  category?: { _id?: string; name?: string; slug?: string } | null;
};

type ProductsResponse = {
  products: ProductRecord[];
};

export default function Store() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedShoeSizes, setSelectedShoeSizes] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState<any[]>([]);

  useEffect(() => {
    void loadData();
    void loadCarousel();
  }, []);

  const loadData = async () => {
    try {
      const [productPayload, categoryPayload] = await Promise.all([
        apiJson<ProductsResponse>("/products"),
        apiJson<CategoryNode[]>("/categories"),
      ]);

      setProducts(productPayload.products || []);
      setCategories(categoryPayload || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load catalog");
    } finally {
      setLoading(false);
    }
  };

  const loadCarousel = async () => {
    try {
      const payload = await apiJson<any[]>("/carousel");
      setCarouselSlides(Array.isArray(payload) ? payload : []);
    } catch {
      setCarouselSlides([]);
    }
  };

  const flattenCategories = (nodes: CategoryNode[]): string[] => {
    const flat: string[] = [];
    for (const node of nodes) {
      flat.push(node._id);
      if (node.children?.length) {
        flat.push(...flattenCategories(node.children));
      }
    }
    return flat;
  };

  const allCategoryIds = flattenCategories(categories);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleShoeSize = (size: string) => {
    setSelectedShoeSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());

    const categoryId = product.category?._id;
    const matchesCategory =
      selectedCategories.length === 0 ||
      (categoryId ? selectedCategories.includes(categoryId) : false);

    const productSizes = product.sizes || [];
    const matchesStandardSize =
      selectedSizes.length === 0 ||
      selectedSizes.some((size) => productSizes.includes(size));

    const matchesShoeSize =
      selectedShoeSizes.length === 0 ||
      selectedShoeSizes.some((size) => productSizes.includes(size));

    // Must match search, category (if selected), and size criteria (if any size/shoe size filters are active)
    const matchesSizeFilter =
      selectedSizes.length === 0 && selectedShoeSizes.length === 0
        ? true
        : (selectedSizes.length > 0 && matchesStandardSize) ||
          (selectedShoeSizes.length > 0 && matchesShoeSize);

    return matchesSearch && matchesCategory && matchesSizeFilter;
  });

  const categoryOptions = categories.flatMap((node) => {
    const children = node.children?.length ? node.children : [];
    return [node, ...children];
  });

  const visibleCategoryOptions = showAllCategories ? categoryOptions : categoryOptions.slice(0, 4);

  const standardSizes = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "N/A"];
  const shoeSizes = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];

  const heroSlides = carouselSlides.length > 0 ? carouselSlides : (() => {
    try {
      const raw = localStorage.getItem("dopeden-carousel-items");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const defaultFallbackSlide = {
    _id: "default-hero-1",
    src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1600&h=900&fit=crop",
    title: "Exclusive Drops",
    subtitle: "Explore our latest seasonal arrivals and premium styles.",
    cta: "Shop now"
  };

  const heroSlidesRendered = heroSlides.length > 0 
    ? heroSlides 
    : products.filter((product) => Array.isArray(product.images) && product.images.length > 0).length > 0 
      ? products.filter((product) => Array.isArray(product.images) && product.images.length > 0).slice(0, 5)
      : [defaultFallbackSlide];

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (heroSlidesRendered.length <= 1 || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlidesRendered.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [heroSlidesRendered.length, isPaused]);

  const goToSlide = (index: number) => setActiveSlide(index);

  return (
    <DefaultLayout>
      <div className="space-y-8">
        {heroSlidesRendered.length > 0 && (
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-screen overflow-hidden border-b-0 bg-card shadow-none">
            <div className="relative z-10 h-full">
              <div className="overflow-hidden h-full">
                {heroSlidesRendered.map((slide, index) => {
                  const isVideo = slide.type === "video" || slide.src?.includes(".mp4");
                  const visible = index === activeSlide;
                  return (
                    <div
                      key={slide.id || slide._id || slide.src || index}
                      className={`h-full transition-opacity duration-500 ease-in-out ${visible ? "block opacity-100" : "hidden opacity-0"}`}
                    >
                      <div className="relative h-full w-full">
                        {isVideo ? (
                          <video src={slide.src} className="block h-full w-full object-cover" autoPlay muted loop playsInline />
                        ) : (
                          <img
                            src={slide.src}
                            className="block h-full w-full object-cover"
                            alt={slide.title || slide.name || "Feature slide"}
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />

                        <div className="absolute inset-x-0 bottom-0 p-8 md:p-16 text-white">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Featured drop</p>
                          <h2 className="max-w-md text-3xl font-bold text-white md:text-5xl">{slide.title || slide.name}</h2>
                          <p className="mt-3 max-w-md text-sm text-white/80 md:text-base">
                            {slide.subtitle || slide.description}
                          </p>
                          {"price" in slide ? (
                            <div className="mt-5 flex items-center gap-3">
                              <span className="text-2xl font-bold text-white">${slide.price}</span>
                              {slide.originalPrice ? (
                                <span className="text-sm text-white/60 line-through">${slide.originalPrice}</span>
                              ) : null}
                            </div>
                          ) : (
                            <div className="mt-5">
                              <span className="inline-flex rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white">
                                {slide.cta || "Shop now"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-8 z-20 flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 py-2 backdrop-blur-sm">
                {heroSlidesRendered.map((slide, index) => (
                  <button
                    key={`${slide.id || slide._id || slide.src || index}-indicator`}
                    type="button"
                    aria-label={`Slide ${index + 1}`}
                    aria-current={index === activeSlide ? "true" : undefined}
                    onClick={() => goToSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeSlide ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-8">
          <aside className="w-64 flex-shrink-0 hidden md:block">
            <div className="space-y-6 rounded-xl border border-border bg-card p-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Search</h3>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products"
                  className="text-sm"
                />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Category</h3>
                <div className="space-y-2">
                  {visibleCategoryOptions.map((item) => (
                    <label key={item._id} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 transition-colors hover:bg-muted/80">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(item._id)}
                        onChange={() => toggleCategory(item._id)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </label>
                  ))}
                </div>

                {categoryOptions.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((prev) => !prev)}
                    className="mt-3 text-sm font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    {showAllCategories ? "Show fewer" : "View more"}
                  </button>
                )}

                {allCategoryIds.length > 0 && (
                  <button
                    type="button"
                    className="mt-2 block text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedCategories(allCategoryIds)}
                  >
                    Select all
                  </button>
                )}
              </div>

              {/* Standard Sizes Filter */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Size</h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {standardSizes.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`border rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shoe Sizes Filter */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shoe Size</h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {shoeSizes.map((size) => {
                    const isSelected = selectedShoeSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleShoeSize(size)}
                        className={`border rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-8 flex flex-col gap-4 pb-6 border-b border-border md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products"
                  className="max-w-xs"
                />
              </div>

              <div className="flex items-center gap-4">
                <select className="border border-border rounded px-3 py-2 text-sm bg-background">
                  <option>SORT BY FEATURED</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                </select>
              </div>
            </div>

            {(selectedCategories.length > 0 || selectedSizes.length > 0 || selectedShoeSizes.length > 0) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {selectedCategories.map((id) => {
                  const match = categoryOptions.find((cat) => cat._id === id);
                  if (!match) return null;
                  return (
                    <button
                      key={match._id}
                      type="button"
                      onClick={() => toggleCategory(match._id)}
                      className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
                    >
                      {match.name} ×
                    </button>
                  );
                })}
                {selectedSizes.map((size) => (
                  <button
                    key={`size-${size}`}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
                  >
                    Size: {size} ×
                  </button>
                ))}
                {selectedShoeSizes.map((size) => (
                  <button
                    key={`shoe-size-${size}`}
                    type="button"
                    onClick={() => toggleShoeSize(size)}
                    className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
                  >
                    Shoe Size: {size} ×
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading catalog…</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products match your current filters.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Link 
                    key={product._id} 
                    href={`/products/${product._id}`} 
                    className="group cursor-pointer block"
                  >
                    <div className="relative mb-4 overflow-hidden rounded-lg bg-muted aspect-[3/4]">
                      <img
                        src={product.images?.[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.discount ? (
                        <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {product.discount}
                        </div>
                      ) : null}
                    </div>
                    <h3 className="mb-2 text-sm font-semibold group-hover:text-primary transition-colors">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">${product.price}</span>
                      {product.originalPrice ? (
                        <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{product.category?.name || "Uncategorized"}</p>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </DefaultLayout>
  );
}
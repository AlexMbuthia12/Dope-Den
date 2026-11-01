import { Button } from "@/components/ui/button";
import DefaultLayout from "@/components/DefaultLayout";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/auth";
import { Link } from "wouter";
import { Filter, X, ChevronLeft, ChevronRight, Search, Flame } from "lucide-react";

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
  section?: "catalog" | "deal";
};

type ProductsResponse = {
  products: ProductRecord[];
  totalProducts?: number;
};

export default function Store() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedShoeSizes, setSelectedShoeSizes] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState<any[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // =========================================================================
  // BATCH & PAGINATION ARCHITECTURE (Prevents redundant DB queries & 1k loads)
  // =========================================================================
  
  // Catalog States: 8 items per page, 3 pages per batch = 24 items per batch
  const [catalogItems, setCatalogItems] = useState<ProductRecord[]>([]);
  const [catalogPage, setCatalogPage] = useState(1); // User's current local page
  const [catalogBatchIndex, setCatalogBatchIndex] = useState(1); // Tracks which batch (1, 2, 3...) we've fetched from backend
  const [hasMoreCatalog, setHasMoreCatalog] = useState(true);
  const CATALOG_ITEMS_PER_PAGE = 8;
  const CATALOG_BATCH_SIZE = 24; // 8 * 3

  // Deals States: 15 items per page (5 across, 3 rows), 3 pages per batch = 45 items per batch
  const [dealItems, setDealItems] = useState<ProductRecord[]>([]);
  const [dealPage, setDealPage] = useState(1); // User's current local deal page
  const [dealBatchIndex, setDealBatchIndex] = useState(1); // Tracks deal batch index
  const [hasMoreDeals, setHasMoreDeals] = useState(true);
  const DEALS_ITEMS_PER_PAGE = 15; // 5 * 3
  const DEALS_BATCH_SIZE = 45; // 15 * 3

  const [dealCategoryFilter, setDealCategoryFilter] = useState<string>("all");

  useEffect(() => {
    void loadInitialData();
    void loadCarousel();
  }, []);

  // Fetch initial batches and categories
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [catPayload, initialCatalog, initialDeals] = await Promise.all([
        apiJson<CategoryNode[]>("/categories"),
        apiJson<ProductsResponse>(`/products?limit=${CATALOG_BATCH_SIZE}&page=1§ion=catalog`),
        apiJson<ProductsResponse>(`/products?limit=${DEALS_BATCH_SIZE}&page=1§ion=deal`),
      ]);

      setCategories(catPayload || []);
      setCatalogItems(initialCatalog.products || []);
      setDealItems(initialDeals.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load store data");
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

  // CHANGED: Function to fetch the next batch of catalog items only when needed (remembering where we left off)
  const fetchNextCatalogBatch = async (nextBatchNum: number) => {
    try {
      const res = await apiJson<ProductsResponse>(
        `/products?limit=${CATALOG_BATCH_SIZE}&page=${nextBatchNum}§ion=catalog`
      );
      if (res.products && res.products.length > 0) {
        setCatalogItems((prev) => [...prev, ...res.products]);
        setCatalogBatchIndex(nextBatchNum);
        if (res.products.length < CATALOG_BATCH_SIZE) {
          setHasMoreCatalog(false);
        }
      } else {
        setHasMoreCatalog(false);
      }
    } catch (err) {
      console.error("Failed to load catalog batch", err);
    }
  };

  // CHANGED: Function to fetch the next batch of deals items only when needed
  const fetchNextDealBatch = async (nextBatchNum: number) => {
    try {
      const res = await apiJson<ProductsResponse>(
        `/products?limit=${DEALS_BATCH_SIZE}&page=${nextBatchNum}§ion=deal`
      );
      if (res.products && res.products.length > 0) {
        setDealItems((prev) => [...prev, ...res.products]);
        setDealBatchIndex(nextBatchNum);
        if (res.products.length < DEALS_BATCH_SIZE) {
          setHasMoreDeals(false);
        }
      } else {
        setHasMoreDeals(false);
      }
    } catch (err) {
      console.error("Failed to load deal batch", err);
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
    setCatalogPage(1);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setCatalogPage(1);
  };

  const toggleShoeSize = (size: string) => {
    setSelectedShoeSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setCatalogPage(1);
  };

  // ---------------------------------------------------------------------------
  // Filtering & Local Pagination on Cached Batch Data
  // ---------------------------------------------------------------------------
const filteredCatalog = catalogItems.filter((product) => {
    // FRONTEND SAFETY CHECK: Ensure item is strictly a catalog product (or legacy unassigned)
    const isCatalog = !product.section || product.section === "catalog";
    if (!isCatalog) return false;

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

    const matchesSizeFilter =
      selectedSizes.length === 0 && selectedShoeSizes.length === 0
        ? true
        : (selectedSizes.length > 0 && matchesStandardSize) ||
          (selectedShoeSizes.length > 0 && matchesShoeSize);

    return matchesSearch && matchesCategory && matchesSizeFilter;
  });

  // Calculate local pagination pages from cached batch items (8 per page)
  const totalCatalogPages = Math.ceil(filteredCatalog.length / CATALOG_ITEMS_PER_PAGE) || 1;
  const paginatedCatalog = filteredCatalog.slice(
    (catalogPage - 1) * CATALOG_ITEMS_PER_PAGE,
    catalogPage * CATALOG_ITEMS_PER_PAGE
  );

  // Filtered & Paginated Deals (15 per page, 3 rows of 5)
const filteredDeals = dealItems.filter((product) => {
    // FRONTEND SAFETY CHECK: Ensure item is strictly a deal product
    const isDeal = product.section === "deal";
    if (!isDeal) return false;

    if (dealCategoryFilter === "all") return true;
    return product.category?._id === dealCategoryFilter;
  });

  const totalDealPages = Math.ceil(filteredDeals.length / DEALS_ITEMS_PER_PAGE) || 1;
  const paginatedDeals = filteredDeals.slice(
    (dealPage - 1) * DEALS_ITEMS_PER_PAGE,
    dealPage * DEALS_ITEMS_PER_PAGE
  );

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
    : catalogItems.filter((product) => Array.isArray(product.images) && product.images.length > 0).length > 0 
      ? catalogItems.filter((product) => Array.isArray(product.images) && product.images.length > 0).slice(0, 5)
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

  return (
    <DefaultLayout>
      <div className="space-y-12">
        {/* HERO CAROUSEL */}
        {heroSlidesRendered.length > 0 && (
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-screen overflow-hidden bg-slate-900 shadow-xl">
            <div className="relative z-10 h-full">
              <div className="overflow-hidden h-full">
                {heroSlidesRendered.map((slide, index) => {
                  const isVideo = slide.type === "video" || slide.src?.includes(".mp4");
                  const visible = index === activeSlide;
                  return (
                    <div
                      key={slide.id || slide._id || slide.src || index}
                      className={`h-full transition-opacity duration-700 ease-in-out ${visible ? "block opacity-100" : "hidden opacity-0"}`}
                    >
                      <div className="relative h-full w-full">
                        {isVideo ? (
                          <video src={slide.src} className="block h-full w-full object-cover scale-105" autoPlay muted loop playsInline />
                        ) : (
                          <img
                            src={slide.src}
                            className="block h-full w-full object-cover scale-105 transition-transform duration-1000"
                            alt={slide.title || slide.name || "Feature slide"}
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent" />

                        <div className="absolute inset-x-0 bottom-20 px-6 sm:px-12 lg:px-20 max-w-4xl text-white">
                          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-md">
                            Featured Drop
                          </span>
                          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-md">
                            {slide.title || slide.name}
                          </h2>
                          <p className="mt-4 text-base sm:text-lg text-slate-200/90 max-w-xl font-normal leading-relaxed drop-shadow">
                            {slide.subtitle || slide.description}
                          </p>
                          {"price" in slide ? (
                            <div className="mt-6 flex items-center gap-4">
                              <span className="text-3xl font-extrabold text-white">${slide.price}</span>
                              {slide.originalPrice ? (
                                <span className="text-lg text-slate-400 line-through">${slide.originalPrice}</span>
                              ) : null}
                            </div>
                          ) : (
                            <div className="mt-6">
                              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105">
                                {slide.cta || "Shop now"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CATALOG & SIDEBAR SECTION */}
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          
          <div className="flex md:hidden items-center justify-between mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Catalog Filters</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="flex items-center gap-2 border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
            >
              <Filter size={16} />
              <span>{mobileFilterOpen ? "Hide Filters" : "Filter Products"}</span>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar Filters */}
            <aside className={`w-full md:w-72 flex-shrink-0 ${mobileFilterOpen ? "block" : "hidden md:block"}`}>
              <div className="sticky top-24 space-y-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Search Products</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setCatalogPage(1); }}
                      placeholder="Search catalog..."
                      className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Categories</h3>
                  <div className="space-y-1.5">
                    {visibleCategoryOptions.map((item) => (
                      <label 
                        key={item._id} 
                        className="flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(item._id)}
                          onChange={() => toggleCategory(item._id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                      </label>
                    ))}
                  </div>

                  {categoryOptions.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllCategories((prev) => !prev)}
                      className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {showAllCategories ? "Show fewer" : `View more (${categoryOptions.length - 4})`}
                    </button>
                  )}

                  {allCategoryIds.length > 0 && (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors block"
                      onClick={() => { setSelectedCategories(allCategoryIds); setCatalogPage(1); }}
                    >
                      Select all categories
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Standard Size</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {standardSizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition-all shadow-sm ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-indigo-600/30 ring-2 ring-indigo-600/20"
                              : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Shoe Size</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {shoeSizes.map((size) => {
                      const isSelected = selectedShoeSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleShoeSize(size)}
                          className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition-all shadow-sm ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-indigo-600/30 ring-2 ring-indigo-600/20"
                              : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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

            {/* Main Product Catalog (8 items per page, 24 per batch) */}
            <main className="flex-1">
              
              <div className="mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Store Catalog</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Page {catalogPage} of {totalCatalogPages} ({filteredCatalog.length} loaded items)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select className="w-full sm:w-auto border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium shadow-sm focus:ring-2 focus:ring-indigo-500">
                    <option>Sort by: Featured</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Newest Arrivals</option>
                  </select>
                </div>
              </div>

              {(selectedCategories.length > 0 || selectedSizes.length > 0 || selectedShoeSizes.length > 0) && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Active Filters:</span>
                  {selectedCategories.map((id) => {
                    const match = categoryOptions.find((cat) => cat._id === id);
                    if (!match) return null;
                    return (
                      <button
                        key={match._id}
                        type="button"
                        onClick={() => toggleCategory(match._id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-sm"
                      >
                        {match.name} <X size={13} />
                      </button>
                    );
                  })}
                  {selectedSizes.map((size) => (
                    <button
                      key={`size-${size}`}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400 shadow-sm"
                    >
                      Size: {size} <X size={13} />
                    </button>
                  ))}
                  {selectedShoeSizes.map((size) => (
                    <button
                      key={`shoe-size-${size}`}
                      type="button"
                      onClick={() => toggleShoeSize(size)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800 px-3 py-1 text-xs font-semibold text-pink-600 dark:text-pink-400 shadow-sm"
                    >
                      Shoe: {size} <X size={13} />
                    </button>
                  ))}
                  <button
                    onClick={() => { setSelectedCategories([]); setSelectedSizes([]); setSelectedShoeSizes([]); setCatalogPage(1); }}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {loading ? (
                <div className="py-20 text-center">
                  <p className="text-sm font-medium text-slate-400 animate-pulse">Loading catalog items…</p>
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-6 text-sm text-red-600">
                  {error}
                </div>
              ) : paginatedCatalog.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
                  <p className="text-base font-bold text-slate-700 dark:text-slate-300">No products match your filters.</p>
                  <p className="text-sm text-slate-400 mt-1">Try clearing your filters or search criteria.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {paginatedCatalog.map((product) => (
                      <Link 
                        key={product._id} 
                        href={`/products/${product._id}`} 
                        className="group cursor-pointer flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300"
                      >
                        <div className="relative mb-3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 aspect-[3/4]">
                          <img
                            src={product.images?.[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {product.discount ? (
                            <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md">
                              {product.discount}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col flex-1 justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                              {product.category?.name || "Featured"}
                            </p>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                              {product.name}
                            </h3>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-slate-900 dark:text-white">${product.price}</span>
                              {product.originalPrice ? (
                                <span className="text-xs text-slate-400 line-through">${product.originalPrice}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* CHANGED: Smart Pagination that triggers next batch fetch when user approaches end of cached batch */}
                  <div className="mt-10 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={catalogPage === 1}
                      onClick={() => { setCatalogPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                      className="rounded-xl flex items-center gap-1 border-slate-200 dark:border-slate-800"
                    >
                      <ChevronLeft size={16} /> Previous
                    </Button>
                    <span className="text-xs font-bold text-slate-500">
                      Page {catalogPage} of {totalCatalogPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasMoreCatalog && catalogPage >= totalCatalogPages}
                      onClick={async () => {
                        const nextPage = catalogPage + 1;
                        // If we are about to view a page past our currently cached batch items, fetch the next batch!
                        const requiredItemsCount = nextPage * CATALOG_ITEMS_PER_PAGE;
                        if (filteredCatalog.length < requiredItemsCount && hasMoreCatalog) {
                          await fetchNextCatalogBatch(catalogBatchIndex + 1);
                        }
                        setCatalogPage(nextPage);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="rounded-xl flex items-center gap-1 border-slate-200 dark:border-slate-800"
                    >
                      Next <ChevronRight size={16} />
                    </Button>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DEALS OF THE MONTH SECTION (15 per page: 5 across, 3 rows) */}
        {/* ======================================================== */}
        <section className="mt-24 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-100/60 to-white dark:from-slate-900/40 dark:to-slate-950 py-16">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest mb-1">
                  <Flame size={16} className="animate-bounce" /> Special Limited Offers
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  DEALS OF THE MONTH
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                Handpicked exclusive seasonal discounts. Grab these limited-time deals before stock runs out.
              </p>
            </div>

            {/* Horizontal Filter Row */}
            <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => { setDealCategoryFilter("all"); setDealPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                  dealCategoryFilter === "all"
                    ? "bg-rose-600 text-white shadow-rose-600/30"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                }`}
              >
                All Deals
              </button>
              {categories.map((cat) => (
                <button
                  key={`deal-cat-${cat._id}`}
                  type="button"
                  onClick={() => { setDealCategoryFilter(cat._id); setDealPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                    dealCategoryFilter === cat._id
                      ? "bg-rose-600 text-white shadow-rose-600/30"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {paginatedDeals.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">No deals available in this category yet.</p>
                <p className="text-sm text-slate-400 mt-1">Check back soon for upcoming drops.</p>
              </div>
            ) : (
              <>
                {/* 5 products across the screen */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
                  {paginatedDeals.map((product) => (
                    <Link 
                      key={`deal-${product._id}`} 
                      href={`/products/${product._id}`} 
                      className="group cursor-pointer flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-sm hover:shadow-xl hover:border-rose-500/40 transition-all duration-300"
                    >
                      <div className="relative mb-3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 aspect-[3/4]">
                        <img
                          src={product.images?.[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md">
                          {product.discount || "DEAL"}
                        </div>
                      </div>

                      <div className="flex flex-col flex-1 justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                            {product.category?.name || "Exclusive Deal"}
                          </p>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-rose-600 transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-slate-900 dark:text-white">${product.price}</span>
                            {product.originalPrice ? (
                              <span className="text-xs text-slate-400 line-through">${product.originalPrice}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* CHANGED: Deal pagination controls with batch fetching integration */}
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={dealPage === 1}
                    onClick={() => { setDealPage((p) => Math.max(1, p - 1)); }}
                    className="rounded-xl flex items-center gap-1 border-slate-200 dark:border-slate-800"
                  >
                    <ChevronLeft size={16} /> Previous Deals
                  </Button>
                  <span className="text-xs font-bold text-slate-500">
                    Page {dealPage} of {totalDealPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasMoreDeals && dealPage >= totalDealPages}
                    onClick={async () => {
                      const nextDealPage = dealPage + 1;
                      const requiredDealsCount = nextDealPage * DEALS_ITEMS_PER_PAGE;
                      if (filteredDeals.length < requiredDealsCount && hasMoreDeals) {
                        await fetchNextDealBatch(dealBatchIndex + 1);
                      }
                      setDealPage(nextDealPage);
                    }}
                    className="rounded-xl flex items-center gap-1 border-slate-200 dark:border-slate-800"
                  >
                    More Deals <ChevronRight size={16} />
                  </Button>
                </div>
              </>
            )}

          </div>
        </section>

      </div>
    </DefaultLayout>
  );
}
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, apiJson, fetchCurrentUser, isAdminUser, type AuthUser } from "@/lib/auth";

type CategoryOption = {
  _id: string;
  name: string;
  slug: string;
  children?: CategoryOption[];
};

type ProductStatus = "active" | "sold";
type ProductSection = "catalog" | "deal"; // CHANGED: Added section type to differentiate standard catalog vs Deals of the Month

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  discount: string;
  category: string;
  sizes: string;
  colors: string;
  stock: string;
  brand: string;
  status: ProductStatus;
  section: ProductSection; // CHANGED: Included section in form state
};

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  discount?: string | null;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  brand?: string | null;
  status?: ProductStatus;
  section?: ProductSection; // CHANGED: Included section in backend payload
};

export default function AddProductsPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    discount: "",
    category: "",
    sizes: "",
    colors: "",
    stock: "10",
    brand: "DopeDen",
    status: "active",
    section: "catalog", // CHANGED: Default new products to standard catalog
  });

  const standardSizes = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "N/A"];
  const shoeSizes = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const isAdmin = useMemo(() => isAdminUser(user), [user]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiJson<CategoryOption[]>('/categories');
        setCategories(response || []);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Unable to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    void fetchCurrentUser().then(setUser);
    void loadCategories();
  }, []);

  const flattenCategories = (items: CategoryOption[]): CategoryOption[] =>
    items.flatMap((item) => [item, ...flattenCategories(item.children || [])]);

  const categoryOptions = flattenCategories(categories);

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        reject(new Error("Unable to read the selected image."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });

  const handleLocalFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (validFiles.length === 0) {
      setMessage("Please choose valid image files only.");
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const previews = await Promise.all(validFiles.map(async (file) => readFileAsDataUrl(file)));
      setSelectedPreviews((current) => [...current, ...previews]);

      const cloudReadyFiles = await Promise.all(
        validFiles.map(async (file) => {
          try {
            const response = await fetch(`${API_BASE_URL}/images/generate-upload-url`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: file.name, fileType: file.type }),
            });

            const payload = await response.json();
            if (!response.ok) return null;

            const uploadResponse = await fetch(payload.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });

            if (!uploadResponse.ok) return null;

            return payload.finalImageUrl;
          } catch {
            return null;
          }
        })
      );

      const validCloudUrls = cloudReadyFiles.filter((value): value is string => Boolean(value));
      setImageUrls((current) => [...current, ...validCloudUrls]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Image processing failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleLocalFiles(event.target.files);
    event.target.value = "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
      setMessage("You must be signed in as an admin to create products.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const finalImages = [...selectedPreviews, ...imageUrls];

      const payload: ProductPayload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        discount: form.discount || null,
        category: form.category,
        images: finalImages,
        sizes: form.sizes.split(",").map((item) => item.trim()).filter(Boolean),
        colors: form.colors.split(",").map((item) => item.trim()).filter(Boolean),
        stock: Number(form.stock),
        brand: form.brand || "DopeDen",
        status: form.status,
        section: form.section, // CHANGED: Pass selected store section (catalog vs deal) to backend
      };

      await apiJson("/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setMessage("Product created successfully.");
      setLocation("/admin");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DefaultLayout title="Add Product" subtitle="Create inventory entries for storefront or Deals of the Month">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        {!isAdmin ? (
          <div className="mb-6 rounded-xl border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
            You need an admin account to create products. Please sign in from the profile page first.
          </div>
        ) : null}

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* CHANGED: Product Section Selector (Catalog vs Deals of the Month) */}
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              Store Placement Section
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, section: "catalog" }))}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  form.section === "catalog"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                Standard Catalog
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, section: "deal" }))}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  form.section === "deal"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                🔥 Deal of the Month
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Product name</span>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required className="rounded-xl" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Brand</span>
              <Input value={form.brand} onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))} className="rounded-xl" />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Description</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Price</span>
              <Input type="number" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} required className="rounded-xl" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Original price</span>
              <Input type="number" value={form.originalPrice} onChange={(event) => setForm((prev) => ({ ...prev, originalPrice: event.target.value }))} className="rounded-xl" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Discount</span>
              <Input value={form.discount} onChange={(event) => setForm((prev) => ({ ...prev, discount: event.target.value }))} placeholder="40% OFF" className="rounded-xl" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Category</span>
              <select
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                disabled={loadingCategories || categoryOptions.length === 0}
                required
              >
                <option value="">{loadingCategories ? 'Loading categories...' : 'Select a category'}</option>
                {categoryOptions.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Sizes</span>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {(form.category && categoryOptions.find((option) => option._id === form.category)?.slug?.toLowerCase() === "shoes" ? shoeSizes : standardSizes).map((size) => {
                    const selected = form.sizes
                      .split(",")
                      .map((item) => item.trim())
                      .includes(size);

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          const selectedSizes = form.sizes
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean);

                          const updatedSizes = selectedSizes.includes(size)
                            ? selectedSizes.filter((item) => item !== size)
                            : [...selectedSizes, size];

                          setForm((prev) => ({ ...prev, sizes: updatedSizes.join(", ") }));
                        }}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                          selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <Input
                  value={form.sizes}
                  onChange={(event) => setForm((prev) => ({ ...prev, sizes: event.target.value }))}
                  placeholder="Or type custom sizes separated by commas"
                  className="rounded-xl text-xs"
                />
              </div>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Stock</span>
              <Input type="number" value={form.stock} onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))} required className="rounded-xl" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Status</span>
              <select
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))}
              >
                <option value="active">Active</option>
                <option value="sold">Sold</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Choose images</span>
              <Input type="file" accept="image/*" multiple onChange={handleFileChange} className="rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700" />
              {uploading ? <p className="mt-1 text-xs text-indigo-600 animate-pulse">Processing images…</p> : null}
            </label>
          </div>

          {selectedPreviews.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Image Previews</p>
              <div className="grid grid-cols-4 gap-2">
                {selectedPreviews.map((preview, index) => (
                  <img key={`${preview}-${index}`} src={preview} alt="Preview" className="h-20 w-full rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                ))}
              </div>
            </div>
          )}

          {message ? <p className="text-sm font-medium text-indigo-600">{message}</p> : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={submitting || !isAdmin} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6">
              {submitting ? "Creating..." : "Add Product"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/profile")} className="rounded-xl">Back to Profile</Button>
            <Button type="button" variant="secondary" onClick={() => setLocation("/products")} className="rounded-xl">View Catalog</Button>
          </div>
        </form>
      </div>
    </DefaultLayout>
  );
}
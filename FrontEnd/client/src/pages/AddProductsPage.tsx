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
            if (!response.ok) {
              return null;
            }

            const uploadResponse = await fetch(payload.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });

            if (!uploadResponse.ok) {
              return null;
            }

            return payload.finalImageUrl;
          } catch {
            return null;
          }
        })
      );

      const validCloudUrls = cloudReadyFiles.filter((value): value is string => Boolean(value));
      setImageUrls((current) => [...current, ...validCloudUrls]);

      if (validCloudUrls.length === 0) {
        setMessage("Local image previews are ready and will be stored in MongoDB as data URLs.");
      } else {
        setMessage("Images are ready. Cloud URLs were saved when available; local previews remain stored in MongoDB.");
      }
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
    <DefaultLayout title="Add Product" subtitle="Create inventory entries for the storefront">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        {!isAdmin ? (
          <div className="mb-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            You need an admin account to create products. Please sign in from the profile page first.
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Product name</span>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Brand</span>
              <Input value={form.brand} onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))} />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Description</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Price</span>
              <Input type="number" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} required />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Original price</span>
              <Input type="number" value={form.originalPrice} onChange={(event) => setForm((prev) => ({ ...prev, originalPrice: event.target.value }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Discount</span>
              <Input value={form.discount} onChange={(event) => setForm((prev) => ({ ...prev, discount: event.target.value }))} placeholder="40% OFF" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Category</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Sizes</span>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
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
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"
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
                  placeholder={((form.category && categoryOptions.find((option) => option._id === form.category)?.slug?.toLowerCase() === "shoes") ? shoeSizes : standardSizes).join(", ")}
                />
              </div>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Colors</span>
              <Input value={form.colors} onChange={(event) => setForm((prev) => ({ ...prev, colors: event.target.value }))} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Stock</span>
              <Input type="number" value={form.stock} onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))} required />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Status</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))}
              >
                <option value="active">Active</option>
                <option value="sold">Sold</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Choose local images</span>
              <Input type="file" accept="image/*" multiple onChange={handleFileChange} />
              {uploading ? <p className="mt-2 text-sm text-muted-foreground">Preparing images…</p> : null}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-sm font-semibold">Image previews</p>
              {selectedPreviews.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {selectedPreviews.map((preview, index) => (
                    <img key={`${preview}-${index}`} src={preview} alt={`Selected product preview ${index + 1}`} className="h-24 w-full rounded-md object-cover" />
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No images selected yet.</p>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Stored image sources</p>
              {imageUrls.length > 0 || selectedPreviews.length > 0 ? (
                <ul className="max-h-32 space-y-2 overflow-auto break-all rounded-md border border-border bg-background p-2">
                  {[...selectedPreviews, ...imageUrls].map((source, index) => (
                    <li key={`${source}-${index}`}>{source.slice(0, 120)}{source.length > 120 ? "…" : ""}</li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-md border border-dashed border-border bg-background p-3">No images stored yet.</p>
              )}
            </div>
          </div>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting || !isAdmin}>
              {submitting ? "Creating..." : "Add product"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/profile")}>Back to profile</Button>
            <Button type="button" variant="secondary" onClick={() => setLocation("/products")}>View catalog</Button>
            <Button type="button" variant="secondary" onClick={() => setLocation("/carousel-manager")}>Manage carousel</Button>
          </div>
        </form>
      </div>
    </DefaultLayout>
  );
}

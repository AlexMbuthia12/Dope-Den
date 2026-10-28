export type CartLineItem = {
  productId: string;
  name: string;
  price: number;
  image?: string | null;
  size?: string | null;
  color?: string | null;
  quantity: number;
};

const CART_STORAGE_KEY = "dopeden-cart";

export function getCartItems(): CartLineItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartLineItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("dopeden-cart-updated"));
}

export function getCartCount() {
  return getCartItems().reduce((total, item) => total + item.quantity, 0);
}

export function addCartItem(item: CartLineItem) {
  const items = getCartItems();
  const existingIndex = items.findIndex(
    (entry) =>
      entry.productId === item.productId &&
      (entry.size || null) === (item.size || null) &&
      (entry.color || null) === (item.color || null)
  );

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + item.quantity,
      price: item.price,
      image: item.image || items[existingIndex].image,
    };
  } else {
    items.push(item);
  }

  saveCartItems(items);
  return items;
}

export function updateCartItemQuantity(productId: string, size: string | null, color: string | null, quantity: number) {
  const items = getCartItems();
  const updated = items
    .map((item) =>
      item.productId === productId && (item.size || null) === (size || null) && (item.color || null) === (color || null)
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    )
    .filter((item) => item.quantity > 0);

  saveCartItems(updated);
  return updated;
}

export function removeCartItem(productId: string, size: string | null, color: string | null) {
  const items = getCartItems().filter(
    (item) => !(item.productId === productId && (item.size || null) === (size || null) && (item.color || null) === (color || null))
  );

  saveCartItems(items);
  return items;
}

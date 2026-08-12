// Pricing helpers shared across the app.
//
// `price` is the final selling price; `showing_price` is the MRP rendered
// struck-through. This mirrors calculateDiscount() in the web portal sections
// (frontend/src/components/portal-sections/ProductGridSection.tsx) so the app and
// website always show the same numbers for the same product.

/** Parses "₹1,299" / "1299" / 1299 into a number. Returns 0 when unparseable. */
export function parsePrice(value?: string | number | null): number {
  if (value === undefined || value === null) return 0;
  return parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
}

export type PriceInfo = {
  /** Final selling price. 0 when the product has no usable price. */
  price: number;
  /** MRP to strike through — only set when it's genuinely higher than `price`. */
  mrp?: number;
  /** Real discount percentage — only set when there's a genuine markdown. */
  discountPct?: number;
};

export function getPriceInfo(
  finalPrice?: string | number | null,
  showingPrice?: string | number | null,
): PriceInfo {
  const price = parsePrice(finalPrice);
  if (price <= 0) return { price: 0 };

  const mrp = parsePrice(showingPrice);
  // No MRP, or MRP not above the selling price -> no fake discount.
  if (!mrp || mrp <= price) return { price };

  const discountPct = Math.round(((mrp - price) / mrp) * 100);
  return {
    price,
    mrp,
    discountPct: discountPct > 0 ? discountPct : undefined,
  };
}

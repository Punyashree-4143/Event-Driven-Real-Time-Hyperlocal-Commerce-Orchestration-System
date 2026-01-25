const CART_KEY = "cart";

/* ---------- HELPERS ---------- */
export const getCart = () => {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
};

const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

/* ---------- PRICE CALCULATOR ---------- */
const getVariantPrice = (basePrice, variant) => {
  if (variant === "250 g") return Math.round(basePrice * 0.25);
  if (variant === "500 g") return Math.round(basePrice * 0.5);
  return basePrice; // 1 kg
};

/* ---------- ADD TO CART ---------- */
export const addToCart = (
  product,
  storeId,
  variant = "1 kg"
) => {
  const cart = getCart();

  const price = getVariantPrice(
    product.price,
    variant
  );

  const index = cart.findIndex(
    (item) =>
      item._id === product._id &&
      item.variant === variant
  );

  if (index >= 0) {
    cart[index].qty += 1;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      image: product.image,
      variant,          // 🔥 250 g / 500 g / 1 kg
      price,            // 🔥 calculated price
      qty: 1,
      storeId: product.storeId || storeId,
    });
  }

  saveCart(cart);
};

/* ---------- INCREASE QTY ---------- */
export const increaseQty = (productId, variant) => {
  const cart = getCart();
  const item = cart.find(
    (p) =>
      p._id === productId &&
      p.variant === variant
  );

  if (item) {
    item.qty += 1;
    saveCart(cart);
  }
};

/* ---------- DECREASE QTY ---------- */
export const decreaseQty = (productId, variant) => {
  let cart = getCart();
  const item = cart.find(
    (p) =>
      p._id === productId &&
      p.variant === variant
  );

  if (!item) return;

  if (item.qty > 1) {
    item.qty -= 1;
  } else {
    cart = cart.filter(
      (p) =>
        !(
          p._id === productId &&
          p.variant === variant
        )
    );
  }

  saveCart(cart);
};

/* ---------- REMOVE ITEM ---------- */
export const removeFromCart = (productId, variant) => {
  const cart = getCart().filter(
    (item) =>
      !(
        item._id === productId &&
        item.variant === variant
      )
  );
  saveCart(cart);
};

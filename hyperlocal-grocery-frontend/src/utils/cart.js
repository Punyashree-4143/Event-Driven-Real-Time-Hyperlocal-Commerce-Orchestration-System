const CART_KEY = "cart";

/* ---------- HELPERS ---------- */
export const getCart = () => {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
};

const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

/* ---------- ADD TO CART ---------- */
export const addToCart = (product, storeId) => {
  const cart = getCart();

  const index = cart.findIndex(
    (item) => item._id === product._id
  );

  if (index >= 0) {
    cart[index].qty += 1;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1,
      // 🔥 GUARANTEE storeId
      storeId: product.storeId || storeId
    });
  }

  saveCart(cart);
};

/* ---------- INCREASE QTY ---------- */
export const increaseQty = (productId) => {
  const cart = getCart();
  const item = cart.find((p) => p._id === productId);

  if (item) {
    item.qty += 1;
    saveCart(cart);
  }
};

/* ---------- DECREASE QTY ---------- */
export const decreaseQty = (productId) => {
  let cart = getCart();
  const item = cart.find((p) => p._id === productId);

  if (item) {
    if (item.qty > 1) {
      item.qty -= 1;
    } else {
      cart = cart.filter((p) => p._id !== productId);
    }
    saveCart(cart);
  }
};

/* ---------- REMOVE ITEM ---------- */
export const removeFromCart = (productId) => {
  const cart = getCart().filter(
    (item) => item._id !== productId
  );
  saveCart(cart);
};

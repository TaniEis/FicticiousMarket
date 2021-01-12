const cartDOM = document.querySelector(".cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartHeader = document.querySelector(".cart-header");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

let cart = [];
const database = 'https://s3.eu-central-1.amazonaws.com/code-challenge-shopping-cart/cart.json';

class Products {
  async getProducts() {
    try {
      let result = await fetch(database);
      let data = await result.json();

      let products = data;
      products = products.map(item => {
        const { id, name, price, image } = item;
        return { id, name, price, image };
      });
      console.log(products);

      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

class Build {
  displayProducts(products) {
    let result = "";
    products.forEach(product => {
      result += `
        <article class="product">
          <div class="img-container">
            <img
              src=${product.image}
              alt="product"
              class="product-img"
            />
          </div>
          <div class="txt-container">
          <h3>${product.name}</h3>
          <h4>€${product.price}</h4>
          <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i>
              add to cart
            </button>
         </div>
        </article>
   `;
    });
    productsDOM.innerHTML = result;
  }
  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttons.forEach(button => {
      let id = button.dataset.id;

      let inCart = cart.find(item => item.id === id);
      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      } else {
        button.addEventListener("click", event => {
          event.target.innerText = "In Cart";
          event.target.disabled = true;
          let cartItem = { ...Storage.getProduct(id), amount: 1 };
          cart = [...cart, cartItem];
          Storage.saveCart(cart);
          this.setCartValues(cart);
          this.addCartItem(cartItem);
        });
      }
    });
  }
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartHeader.innerText = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
            <img src=${item.image} alt="product" />
            <div>
              <h4>${item.name}</h4>
              <h5>€${item.price}</h5>
            </div>
            <div>
                <i class="fas fa-chevron-up" data-id=${item.id}></i>
              <p class="item-amount">
                ${item.amount}
              </p>
                <i class="fas fa-chevron-down" data-id=${item.id}></i>
                <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
    `;
    cartContent.appendChild(div);
  }
 
  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
  }
  populateCart(cart) {
    cart.forEach(item => this.addCartItem(item));
  }
  cartLogic() {
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });
    cartContent.addEventListener("click", event => {
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cart = cart.filter(item => item.id.toString() !== id);
        console.log(cart);

        this.setCartValues(cart);
        Storage.saveCart(cart);
        cartContent.removeChild(removeItem.parentElement.parentElement);
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttons.forEach(button => {
          if (parseInt(button.dataset.id) == id) {
            button.disabled = false;
            button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
          }
        });
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id.toString() == id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find(item => item.id.toString() == id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cart = cart.filter(item => item.id.toString() !== id);
          this.setCartValues(cart);
          Storage.saveCart(cart);
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          const buttons = [...document.querySelectorAll(".bag-btn")];
          buttons.forEach(button => {
            if (parseInt(button.dataset.id) == id) {
              button.disabled = false;
              button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
            }
          });
        }
      }
    });
  }
  clearCart() {
    cart = [];
    this.setCartValues(cart);
    Storage.saveCart(cart);
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttons.forEach(button => {
      button.disabled = false;
      button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
    });
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
  }
}

class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find(product => product.id == id);
  }
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const build = new Build();
  const products = new Products();
  build.setupAPP();

  products
    .getProducts()
    .then(products => {
      build.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      build.getBagButtons();
      build.cartLogic();
    });
});

// search

const inputFilter = document.querySelector(".search-input");
inputFilter.addEventListener('keyup', function() {
  let inputValue = this.value, i;
  let filterList = document.querySelector(".products");
  let filterItem = filterList.querySelectorAll(".txt-container h3");
  for (i = 0; i < filterItem.length; i++) {
      let _this = filterItem[i];
      let phrase = _this.innerHTML; 
    if (phrase.search(new RegExp(inputValue, "i")) < 0) {
      _this.closest(".product").style.cssText = 'animation:fadeOut ease 1s;display:none;';
    } else {
      _this.closest(".product").style.cssText = 'animation:fadeIn ease 1s;display:block;';
    }
  }
});
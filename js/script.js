document.addEventListener('DOMContentLoaded', function(){

    const search = document.querySelector('.search');
    const cartBtn = document.getElementById('cart');
    const wishlistBtn = document.getElementById('wishlist');
    const goodsWrapper = document.querySelector('.goods-wrapper');
    const cart = document.querySelector('.cart');
    const category = document.querySelector('.category');
    const cardCountner = cartBtn.querySelector('.counter');
    const wishlistCountner = wishlistBtn.querySelector('.counter');
    const cartWrapper = document.querySelector('.cart-wrapper');
    const spiner = '<div id="spinner"><div class="spinner-loading"><div><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div></div></div></div>';
    const wishlist = [];
    const goodsBasket = {};

    // Запрос на сервер
    const getGoods = (handler, filter) => {
        fetch('db/db.json')
            .then(response => response.json())
            .then(filter)
            .then(handler);
    };

    // Генерация карточек
    const createCardGoods = (id, title, price, img) => {
        const card = document.createElement('div');
        card.className = 'card-wrapper col-12 col-md-6 col-lg-4 col-xl-3 pb-3';
        card.innerHTML =   `<div class="card">
                                <div class="card-img-wrapper">
                                    <img class="card-img-top" src="${img}" alt="">
                                    <button class="card-add-wishlist ${wishlist.includes(id) ? 'active' : ''}" 
                                        data-goods-id="${id}"></button>
                                </div>
                                <div class="card-body justify-content-between">
                                    <a href="#" class="card-title">${title}</a>
                                    <div class="card-price">${price} ₽</div>
                                    <div>
                                        <button class="card-add-cart" data-goods-id="${id}">Добавить в корзину</button>
                                    </div>
                                </div>
                            </div>`;

        return card;
    };
    
    const createCardGoodsBasket = (id, title, price, img) => {
        const card = document.createElement('div');
        card.className = 'goods';
        card.innerHTML =   `<div class="goods-img-wrapper">
                                <img class="goods-img" src="${img}" alt="">
                            </div>
                            <div class="goods-description">
                                <h2 class="goods-title">${title}</h2>
                                <p class="goods-price">${price} ₽</p>
                            </div>
                            <div class="goods-price-count">
                                <div class="goods-trigger">
                                    <button class="goods-add-wishlist ${wishlist.includes(id) ? 'active' : ''}" data-goods-id="${id}"></button>
                                    <button class="goods-delete" data-goods-id="${id}"></button>
                                </div>
                                <div class="goods-count">${goodsBasket[id]}</div>
                            </div>`;

        return card;
    };

    // Рендер
    const renderCard = goods => {
        goodsWrapper.textContent = '';

        if (goods.length) {
            goods.forEach(({ id, title, price, imgMin }) => {
                goodsWrapper.appendChild(createCardGoods(id, title, price, imgMin));
            });
        } else {
            goodsWrapper.textContent = 'Товар не найден';
        }
    };

    const renderBasket = goods => {
        cartWrapper.textContent = '';
        if (goods.length) {
            goods.forEach(({ id, title, price, imgMin }) => {
                cartWrapper.appendChild(createCardGoodsBasket(id, title, price, imgMin));
            });
        } else {
            cartWrapper.innerHTML = '<div id="cart-empty">Ваша корзина пока пуста</div>';
        }
    };

    // Калькуляция
    const calcTotalPrice = goods => {
        let sum = 0;

        for (const item of goods) {
            sum += item.price * goodsBasket[item.id];
        }

        cart.querySelector('.cart-total>span').textContent = sum.toFixed(2);
    };

    const checkCount = () => {
        wishlistCountner.textContent = wishlist.length;
        cardCountner.textContent = Object.keys(goodsBasket).length;
    };

    // Фильтры
    const showCardBasket = goods => {
        const basketGoods = goods.filter(item => goodsBasket.hasOwnProperty(item.id));
        calcTotalPrice(basketGoods);

        return basketGoods;
    };

    const showWishList = () => {
        getGoods(renderCard, goods => goods.filter(item => wishlist.includes(item.id)));
    };

    const randomSort = item => {
        return item.sort(() => Math.random() - 0.5);
    };

    // Работа с хранилищем
    const getCookie = (name) => {
        let matches = document.cookie.match(new RegExp(
          "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));

        return matches ? decodeURIComponent(matches[1]) : undefined;
    };

    const cookieQuery = get => {
        if (get) {
            if (getCookie('goodsBasket')) {
                Object.assign(goodsBasket, JSON.parse(getCookie('goodsBasket')));
                //goodsBasket = JSON.parse(getCookie('goodsBasket'));
                /*const cookieGoodsBasket = JSON.parse(getCookie('goodsBasket'));
                for (let key in cookieGoodsBasket) {
                    goodsBasket[key] = cookieGoodsBasket[key];
                }*/
            }
            checkCount();
        } else {
            document.cookie = `goodsBasket=${JSON.stringify(goodsBasket)}; max-age=8640e3`;
        }
    };

    const storageQuery = get => {
        if (get) {
            if (localStorage.getItem('wishlist')) {
                // wishlist.splice(0, 0, ...JSON.parse(localStorage.getItem('wishlist')));
                wishlist.push(...JSON.parse(localStorage.getItem('wishlist')));
            }
            checkCount();
        } else {
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
    };

    // События
    const closeCart = (event) => {
        const keyCode = event.code;
        const target = event.target;

        if (target === cart || target.classList.contains('cart-close') || keyCode == 'Escape') {
            cart.style.display = '';
            document.removeEventListener('keyup', closeCart);
        }
    };

    const openCart = (event) => {
        event.preventDefault();
        cartWrapper.innerHTML = spiner;
        cart.style.display = 'flex';
        document.addEventListener('keyup', closeCart);
        getGoods(renderBasket, showCardBasket);
    };

    const chooseCategory = event => {
        event.preventDefault();
        goodsWrapper.innerHTML = spiner;
        const target = event.target;

        if (target.classList.contains('category-item')) {
            const category = target.dataset.category;
            getGoods(renderCard, goods => goods.filter(item => item.category.includes(category)));
        }
    };

    const searchGoods = event => {
        event.preventDefault();
        goodsWrapper.innerHTML = spiner;
        const input = event.target.elements.searchGoods;
        const inputValue = input.value.trim();

        if (inputValue !== '') {
            const searchString = new RegExp(inputValue, 'i');
            getGoods(renderCard, goods => goods.filter(item => searchString.test(item.title)));
        } else {
            search.classList.add('error');
            setTimeout(() => {
                search.classList.remove('error');
            }, 2000);
        }

        input.value = '';
    };

    const toggleWishlist = (id, elem) => {
        if (wishlist.includes(id)) {
            wishlist.splice(wishlist.indexOf(id), 1);
            elem.classList.remove('active');
        } else {
            wishlist.push(id);
            elem.classList.add('active');
        }

        checkCount();
        storageQuery();
    };

    const addBasket = id => {
        if (goodsBasket[id]) {
            goodsBasket[id] += 1;
        } else {
            goodsBasket[id] = 1;
        }

        checkCount();
        cookieQuery();
    };

    const removeGoods = id => {
        delete goodsBasket[id];
        checkCount();
        cookieQuery();
        getGoods(renderBasket, showCardBasket);
    };

    // handler
    const handlerGoods = event => {
        const target = event.target;

        if (target.classList.contains('card-add-wishlist')) {
            toggleWishlist(target.dataset.goodsId, target);
        }

        if (target.classList.contains('card-add-cart')) {
            addBasket(target.dataset.goodsId);
        }
    };

    const handlerBasket = event => {
        const target = event.target;

        if (target.classList.contains('goods-add-wishlist')) {
            toggleWishlist(target.dataset.goodsId, target);
        }

        if (target.classList.contains('goods-delete')) {
            removeGoods(target.dataset.goodsId);
        }
    };

    // иницилизация
    getGoods(renderCard, randomSort);
    storageQuery(true);
    cookieQuery(true);

    cartBtn.addEventListener('click', openCart);
    cart.addEventListener('click', closeCart);
    category.addEventListener('click', chooseCategory);
    search.addEventListener('submit', searchGoods);
    goodsWrapper.addEventListener('click', handlerGoods);
    cartWrapper.addEventListener('click', handlerBasket);
    wishlistBtn.addEventListener('click', showWishList);
});
import { users, orders, reclamations, notifications } from './data.js';

// Счетчик рекламаций по заказам
let reclamationCounters = {};

// Переменные для хранения состояния
let selectedOrder = null;
let selectedFiles = [];
let reclamationCounter = 4;
let currentReclamationType = null;
let itemFiles = {};
let additionalArticles = [];
let isGuestUser = false;

// ФУНКЦИИ (весь ваш JS-код БЕЗ БЛОКА ДАННЫХ)
// ... начинаем с инициализации

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('initial-modal').style.display = 'flex';

    document.getElementById('initial-yes-btn').addEventListener('click', function() {
        document.getElementById('initial-modal').style.display = 'none';
        document.getElementById('login-modal').style.display = 'flex';
    });

    document.getElementById('initial-no-btn').addEventListener('click', function() {
        document.getElementById('initial-modal').style.display = 'none';
        document.getElementById('register-modal').style.display = 'flex';
    });

    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        if (password !== passwordConfirm) {
            document.getElementById('register-error').style.display = 'block';
            return;
        }
        alert('Регистрация успешно завершена! Теперь вы можете войти в систему.');
        document.getElementById('register-modal').style.display = 'none';
        document.getElementById('login-modal').style.display = 'flex';
    });

    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        let displayName = username;
        if (username === 'bio_smart' || username === 'client') {
            displayName = users[username].companyName;
        }
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('user-display-name').textContent = displayName;
        updateLoginBackground();
        loadNotifications();
        loadRecentOrders();
        initializeApplication();
    });
});

function updateLoginBackground() {
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        loginModal.className = 'login-modal mobile';
        registerModal.className = 'login-modal mobile';
    } else {
        loginModal.className = 'login-modal desktop';
        registerModal.className = 'login-modal desktop';
    }
}

window.addEventListener('resize', updateLoginBackground);
window.addEventListener('load', updateLoginBackground);

function detectDevice() {
    const isMobile = {
        android: () => navigator.userAgent.match(/Android/i),
        blackBerry: () => navigator.userAgent.match(/BlackBerry/i),
        iOS: () => navigator.userAgent.match(/iPhone|iPad|iPod/i),
        opera: () => navigator.userAgent.match(/Opera Mini/i),
        windows: () => navigator.userAgent.match(/IEMobile/i),
        any: function() {
            return (this.android() || this.blackBerry() || this.iOS() || this.opera() || this.windows());
        }
    };
    const isTablet = navigator.userAgent.match(/Tablet|iPad/i);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = Math.min(window.screen.width, window.screen.height);
    const isSmallScreen = screenWidth <= 768;
    if ((isMobile.any() || isTablet || isSmallScreen) && isTouchDevice) {
        if (!document.body.classList.contains('mobile-version')) {
            document.body.classList.add('mobile-version');
            document.getElementById('mobile-toggle').textContent = 'Обычная версия';
            if (!isMobile.any() && isTouchDevice) {
                document.getElementById('device-warning').style.display = 'block';
            }
        }
    }
}

function switchToMobile() {
    document.body.classList.add('mobile-version');
    document.getElementById('mobile-toggle').textContent = 'Обычная версия';
    document.getElementById('device-warning').style.display = 'none';
    localStorage.setItem('preferredView', 'mobile');
    if (selectedOrder) {
        showOrderDetails(selectedOrder);
    }
}

function switchToDesktop() {
    document.body.classList.remove('mobile-version');
    document.getElementById('mobile-toggle').textContent = 'Мобильная версия';
    localStorage.setItem('preferredView', 'desktop');
    if (selectedOrder) {
        showOrderDetails(selectedOrder);
    }
}

function loadNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = '';
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">У вас нет новых уведомлений</p>';
        return;
    }
    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
        notificationItem.setAttribute('data-notification-id', notification.id);
        notificationItem.setAttribute('data-reclamation-id', notification.reclamationId);
        const notificationIcon = document.createElement('div');
        notificationIcon.className = `notification-icon ${notification.read ? 'read' : 'unread'}`;
        notificationIcon.textContent = notification.read ? '✓' : '!';
        notificationItem.innerHTML = `
            <div class="notification-title">${notification.title}</div>
            <div class="notification-text">${notification.text}</div>
            <div class="notification-date">${notification.date}</div>
        `;
        notificationItem.insertBefore(notificationIcon, notificationItem.firstChild);
        notificationItem.addEventListener('click', function() {
            notification.read = true;
            notificationItem.classList.remove('unread');
            notificationIcon.className = 'notification-icon read';
            notificationIcon.textContent = '✓';
            if (notification.reclamationId) {
                showPage('list-page');
                setActiveNav(document.getElementById('nav-list'));
                renderReclamations();
                setTimeout(() => {
                    const reclamationRow = document.querySelector(`.reclamation-main-row[data-id="${notification.reclamationId}"]`);
                    if (reclamationRow) {
                        reclamationRow.click();
                    }
                }, 500);
            }
        });
        notificationsList.appendChild(notificationItem);
    });
}

function loadRecentOrders() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';
    const orderNumbers = Object.keys(orders);
    const sortedOrders = orderNumbers
        .sort((a, b) => new Date(orders[b].date.split('.').reverse().join('-')) - new Date(orders[a].date.split('.').reverse().join('-')))
        .slice(0, 10);
    if (sortedOrders.length === 0) {
        ordersList.innerHTML = '<div class="no-orders">У вас пока нет заказов</div>';
        return;
    }
    sortedOrders.forEach(orderNumber => {
        const order = orders[orderNumber];
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.setAttribute('data-order-number', orderNumber);
        const totalAmount = order.totalAmount;
        const productsList = order.products.slice(0, 3).map(product => `
            <div class="order-product">
                <span class="product-name">${product.name}</span>
                <span class="product-quantity">${product.quantity} ${product.unit}</span>
            </div>
        `).join('');
        const additionalProducts = order.products.length > 3 ? `и еще ${order.products.length - 3} товаров` : '';
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-number">${orderNumber}</div>
                <div class="order-date">${order.date}</div>
            </div>
            <div class="order-products">
                ${productsList}
                ${additionalProducts ? `<div class="additional-products">${additionalProducts}</div>` : ''}
            </div>
            <div class="order-total">${totalAmount.toFixed(2)} руб.</div>
        `;
        orderCard.addEventListener('click', function() {
            selectedOrder = orderNumber;
            showPage('create-page');
            setActiveNav(document.getElementById('nav-create'));
            showOrderDetails(orderNumber);
            document.getElementById('order-search').value = orderNumber;
            document.getElementById('order-select').value = orderNumber;
        });
        ordersList.appendChild(orderCard);
    });
}

function initializeApplication() {
    const preferredView = localStorage.getItem('preferredView');
    if (preferredView === 'mobile') {
        document.body.classList.add('mobile-version');
        document.getElementById('mobile-toggle').textContent = 'Обычная версия';
    } else if (preferredView === 'desktop') {
        document.body.classList.remove('mobile-version');
        document.getElementById('mobile-toggle').textContent = 'Мобильная версия';
    } else {
        detectDevice();
    }

    document.getElementById('mobile-toggle').addEventListener('click', function() {
        if (document.body.classList.contains('mobile-version')) {
            switchToDesktop();
        } else {
            switchToMobile();
        }
    });

    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        function setVH() {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }

    initializeReclamationCounters();
    initializeAutocomplete();
    initializeOrderSelect();
    initializeProductSearch();
    initializeProductCodeSearch();
    document.getElementById('add-article-btn').addEventListener('click', function() {
        addArticleItem();
    });
    document.getElementById('notification-close').addEventListener('click', function() {
        document.getElementById('notification-banner').style.display = 'none';
    });

    document.getElementById('nav-main').addEventListener('click', function() {
        showPage('main-page');
        setActiveNav(this);
        loadNotifications();
        loadRecentOrders();
    });
    document.getElementById('nav-create').addEventListener('click', function() {
        showPage('create-page');
        setActiveNav(this);
    });
    document.getElementById('nav-list').addEventListener('click', function() {
        showPage('list-page');
        setActiveNav(this);
        renderReclamations();
    });

    document.getElementById('sub-tab-work').addEventListener('click', function() {
        setActiveSubTab(this);
        renderReclamations('work');
    });
    document.getElementById('sub-tab-done').addEventListener('click', function() {
        setActiveSubTab(this);
        renderReclamations('done');
    });

    document.getElementById('submit-btn').addEventListener('click', function() {
        submitReclamation();
    });

    document.getElementById('modal-ok-btn').addEventListener('click', function() {
        document.getElementById('success-modal').style.display = 'none';
        showPage('list-page');
        setActiveNav(document.getElementById('nav-list'));
        renderReclamations();
    });

    document.getElementById('defect-warning-ok').addEventListener('click', function() {
        document.getElementById('defect-warning-modal').style.display = 'none';
    });

    document.getElementById('file-preview-close').addEventListener('click', function() {
        document.getElementById('file-preview-modal').style.display = 'none';
    });

    document.getElementById('search-reclamations').addEventListener('click', function() {
        searchReclamations();
    });
    document.getElementById('reset-search').addEventListener('click', function() {
        resetSearch();
    });

    renderReclamations();
}

function searchOrderByProductCode(productCode) {
    const foundOrders = [];
    for (const orderNumber in orders) {
        const order = orders[orderNumber];
        const foundProducts = order.products.filter(product => 
            product.code.includes(productCode) || product.name.toLowerCase().includes(productCode.toLowerCase())
        );
        if (foundProducts.length > 0) {
            foundOrders.push({
                orderNumber: orderNumber,
                orderDate: order.date,
                products: foundProducts
            });
        }
    }
    return foundOrders;
}

function initializeProductCodeSearch() {
    const productCodeSearchInput = document.getElementById('product-code-search-input');
    const searchResults = document.getElementById('product-code-search-results');
    productCodeSearchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        searchResults.innerHTML = '';
        if (searchTerm.length < 1) {
            searchResults.style.display = 'none';
            return;
        }
        const foundOrders = searchOrderByProductCode(searchTerm);
        if (foundOrders.length > 0) {
            foundOrders.forEach(order => {
                const resultItem = document.createElement('div');
                resultItem.className = 'order-search-result-item';
                resultItem.innerHTML = `
                    <strong>${order.orderNumber}</strong> (от ${order.orderDate})
                    <br><small>Найдено товаров: ${order.products.length}</small>
                    <br><small>Товары: ${order.products.map(p => p.code + ' - ' + p.name).join(', ')}</small>
                `;
                resultItem.addEventListener('click', function() {
                    selectedOrder = order.orderNumber;
                    document.getElementById('order-search').value = order.orderNumber;
                    document.getElementById('order-select').value = order.orderNumber;
                    showOrderDetails(order.orderNumber);
                    searchResults.style.display = 'none';
                    productCodeSearchInput.value = '';
                });
                searchResults.appendChild(resultItem);
            });
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!productCodeSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

function initializeProductSearch() {
    const productSearchInput = document.getElementById('product-code-search');
    const searchResults = document.getElementById('product-search-results');
    productSearchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        searchResults.innerHTML = '';
        if (searchTerm.length < 1 || !selectedOrder) {
            searchResults.style.display = 'none';
            return;
        }
        const orderData = orders[selectedOrder];
        const filteredProducts = orderData.products.filter(product => 
            product.code.includes(searchTerm) || product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredProducts.length > 0) {
            filteredProducts.forEach(product => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <strong>${product.code}</strong> - ${product.name}
                    <br><small>Количество: ${product.quantity} ${product.unit}, Цена: ${product.price.toFixed(2)} руб.</small>
                `;
                resultItem.addEventListener('click', function() {
                    highlightProductInTable(product.code);
                    searchResults.style.display = 'none';
                    productSearchInput.value = '';
                });
                searchResults.appendChild(resultItem);
            });
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!productSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

function highlightProductInTable(productCode) {
    document.querySelectorAll('.highlight').forEach(el => {
        el.classList.remove('highlight');
    });
    const rows = document.querySelectorAll('#products-body tr');
    let found = false;
    rows.forEach((row, index) => {
        const codeElement = row.querySelector('.quantity-info');
        if (codeElement && codeElement.textContent.includes(productCode)) {
            row.classList.add('highlight');
            found = true;
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                row.classList.remove('highlight');
                setTimeout(() => {
                    row.classList.add('highlight');
                    setTimeout(() => {
                        row.classList.remove('highlight');
                    }, 1000);
                }, 200);
            }, 100);
        }
    });

    if (document.body.classList.contains('mobile-version')) {
        const mobileCards = document.querySelectorAll('.mobile-product-card');
        mobileCards.forEach(card => {
            const details = card.querySelector('.mobile-product-details');
            if (details && details.textContent.includes(productCode)) {
                card.classList.add('highlight');
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    card.classList.remove('highlight');
                    setTimeout(() => {
                        card.classList.add('highlight');
                        setTimeout(() => {
                            card.classList.remove('highlight');
                        }, 1000);
                    }, 200);
                }, 100);
            }
        });
    }
    if (!found) {
        alert('Товар с кодом ' + productCode + ' не найден в выбранном заказе.');
    }
}

window.addEventListener('orientationchange', function() {
    setTimeout(detectDevice, 100);
});
window.addEventListener('resize', function() {
    setTimeout(detectDevice, 100);
});

function initializeAutocomplete() {
    const searchInput = document.getElementById('order-search');
    const autocompleteList = document.getElementById('autocomplete-list');
    searchInput.addEventListener('input', function() {
        const value = this.value.trim();
        autocompleteList.innerHTML = '';
        if (value.length < 2) {
            autocompleteList.style.display = 'none';
            return;
        }
        const filteredOrders = Object.keys(orders).filter(orderNumber => 
            orderNumber.toLowerCase().includes(value.toLowerCase())
        );
        if (filteredOrders.length > 0) {
            filteredOrders.forEach(orderNumber => {
                const order = orders[orderNumber];
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = `${orderNumber} (от ${order.date})`;
                item.addEventListener('click', function() {
                    searchInput.value = orderNumber;
                    autocompleteList.style.display = 'none';
                    selectedOrder = orderNumber;
                    showOrderDetails(selectedOrder);
                });
                autocompleteList.appendChild(item);
            });
            autocompleteList.style.display = 'block';
        } else {
            autocompleteList.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !autocompleteList.contains(e.target)) {
            autocompleteList.style.display = 'none';
        }
    });
}

function initializeOrderSelect() {
    const orderSelect = document.getElementById('order-select');
    orderSelect.addEventListener('change', function() {
        if (this.value) {
            selectedOrder = this.value;
            showOrderDetails(selectedOrder);
            document.getElementById('order-search').value = '';
        }
    });
}

function initializeReclamationCounters() {
    for (const orderNumber in orders) {
        reclamationCounters[orderNumber] = 0;
    }
    reclamations.forEach(reclamation => {
        const baseOrderNumber = reclamation.orderNumber;
        if (reclamationCounters.hasOwnProperty(baseOrderNumber)) {
            reclamationCounters[baseOrderNumber]++;
        }
    });
}

function addArticleItem() {
    const articleItems = document.getElementById('article-items');
    const articleIndex = additionalArticles.length;
    const articleItem = document.createElement('div');
    articleItem.className = 'article-item';
    articleItem.setAttribute('data-index', articleIndex);
    articleItem.innerHTML = `
        <div class="article-item-header">
            <div class="article-item-name">Артикул #${articleIndex + 1}</div>
            <div class="article-remove" data-index="${articleIndex}">✕</div>
        </div>
        <div class="article-item-details">
            <div class="article-form-group">
                <label for="article-code-${articleIndex}">Код товара:</label>
                <input type="text" id="article-code-${articleIndex}" class="article-code" data-index="${articleIndex}" placeholder="Введите код товара">
            </div>
            <div class="article-form-group">
                <label for="article-name-${articleIndex}">Наименование товара:</label>
                <input type="text" id="article-name-${articleIndex}" class="article-name" data-index="${articleIndex}" placeholder="Введите наименование товара">
            </div>
            <div class="article-form-group">
                <label for="article-quantity-${articleIndex}">Количество:</label>
                <input type="number" id="article-quantity-${articleIndex}" class="article-quantity" data-index="${articleIndex}" min="1" value="1">
            </div>
        </div>
        <div class="excess-description-section" id="excess-description-${articleIndex}">
            <h4>Опишите, какой товар поступил лишним</h4>
            <textarea class="excess-description-text" id="excess-description-text-${articleIndex}" placeholder="Опишите подробно товар, который поступил к вам излишком, но которого нет в данном заказе..."></textarea>
            <div class="excess-files-section">
                <button type="button" class="item-attach-btn excess-attach-btn" data-index="${articleIndex}">Прикрепить фотографии товара</button>
                <input type="file" class="item-file-input excess-file-input" data-index="${articleIndex}" multiple style="display: none" accept="image/*">
                <div class="excess-files-warning">Для излишка необходимо прикрепить фотографии товара</div>
                <div class="item-files-container" data-index="excess-${articleIndex}">
                    <div class="item-file-list" data-index="excess-${articleIndex}"></div>
                </div>
            </div>
        </div>
        <div class="excess-identified-section" id="excess-identified-${articleIndex}">
            <h4>Товар идентифицирован</h4>
            <p>Если вы знаете код и наименование товара, заполните поля выше. В противном случае опишите товар в поле ниже.</p>
        </div>
    `;
    articleItems.appendChild(articleItem);
    if (!itemFiles[`excess-${articleIndex}`]) {
        itemFiles[`excess-${articleIndex}`] = [];
    }
    additionalArticles.push({
        code: '',
        name: '',
        quantity: 1,
        description: '',
        unit: 'шт',
        reason: 'excess'
    });
    const codeInput = articleItem.querySelector('.article-code');
    const nameInput = articleItem.querySelector('.article-name');
    const quantityInput = articleItem.querySelector('.article-quantity');
    const descriptionInput = articleItem.querySelector('.excess-description-text');
    const removeBtn = articleItem.querySelector('.article-remove');
    const attachBtn = articleItem.querySelector('.excess-attach-btn');
    const fileInput = articleItem.querySelector('.excess-file-input');
    const descriptionSection = articleItem.querySelector(`#excess-description-${articleIndex}`);
    const identifiedSection = articleItem.querySelector(`#excess-identified-${articleIndex}`);
    descriptionSection.style.display = 'block';
    identifiedSection.style.display = 'none';
    codeInput.addEventListener('input', function() {
        const index = parseInt(this.getAttribute('data-index'));
        additionalArticles[index].code = this.value;
        if (this.value && nameInput.value) {
            descriptionSection.style.display = 'none';
            identifiedSection.style.display = 'block';
        } else {
            descriptionSection.style.display = 'block';
            identifiedSection.style.display = 'none';
        }
    });
    nameInput.addEventListener('input', function() {
        const index = parseInt(this.getAttribute('data-index'));
        additionalArticles[index].name = this.value;
        if (this.value && codeInput.value) {
            descriptionSection.style.display = 'none';
            identifiedSection.style.display = 'block';
        } else {
            descriptionSection.style.display = 'block';
            identifiedSection.style.display = 'none';
        }
    });
    quantityInput.addEventListener('input', function() {
        const index = parseInt(this.getAttribute('data-index'));
        additionalArticles[index].quantity = parseInt(this.value) || 0;
    });
    descriptionInput.addEventListener('input', function() {
        const index = parseInt(this.getAttribute('data-index'));
        additionalArticles[index].description = this.value;
    });
    removeBtn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        removeArticleItem(index);
    });
    attachBtn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        fileInput.click();
    });
    fileInput.addEventListener('change', function(e) {
        const index = parseInt(this.getAttribute('data-index'));
        handleItemFileSelection(`excess-${index}`, e.target.files);
    });
}

function removeArticleItem(index) {
    const articleItem = document.querySelector(`.article-item[data-index="${index}"]`);
    if (articleItem) {
        articleItem.remove();
    }
    additionalArticles.splice(index, 1);
    delete itemFiles[`excess-${index}`];
    document.querySelectorAll('.article-item').forEach((item, newIndex) => {
        item.setAttribute('data-index', newIndex);
        const header = item.querySelector('.article-item-name');
        const removeBtn = item.querySelector('.article-remove');
        const codeInput = item.querySelector('.article-code');
        const nameInput = item.querySelector('.article-name');
        const quantityInput = item.querySelector('.article-quantity');
        const descriptionInput = item.querySelector('.excess-description-text');
        const attachBtn = item.querySelector('.excess-attach-btn');
        const fileInput = item.querySelector('.excess-file-input');
        const descriptionSection = item.querySelector('.excess-description-section');
        const identifiedSection = item.querySelector('.excess-identified-section');
        if (header) header.textContent = `Артикул #${newIndex + 1}`;
        if (removeBtn) removeBtn.setAttribute('data-index', newIndex);
        if (codeInput) codeInput.setAttribute('data-index', newIndex);
        if (nameInput) nameInput.setAttribute('data-index', newIndex);
        if (quantityInput) quantityInput.setAttribute('data-index', newIndex);
        if (descriptionInput) descriptionInput.setAttribute('data-index', newIndex);
        if (attachBtn) attachBtn.setAttribute('data-index', newIndex);
        if (fileInput) fileInput.setAttribute('data-index', newIndex);
        if (descriptionSection) descriptionSection.id = `excess-description-${newIndex}`;
        if (identifiedSection) identifiedSection.id = `excess-identified-${newIndex}`;
        if (itemFiles[`excess-${newIndex + 1}`]) {
            itemFiles[`excess-${newIndex}`] = itemFiles[`excess-${newIndex + 1}`];
            delete itemFiles[`excess-${newIndex + 1}`];
            const fileList = item.querySelector('.item-file-list');
            if (fileList) fileList.setAttribute('data-index', `excess-${newIndex}`);
            const filesContainer = item.querySelector('.item-files-container');
            if (filesContainer) filesContainer.setAttribute('data-index', `excess-${newIndex}`);
        }
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function setActiveNav(activeBtn) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

function setActiveSubTab(activeTab) {
    document.querySelectorAll('.nav-sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    activeTab.classList.add('active');
}

function searchReclamations() {
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const productSearch = document.getElementById('product-search').value.trim().toLowerCase();
    const currentFilter = document.querySelector('.nav-sub-tab.active').id === 'sub-tab-work' ? 'work' : 'done';
    let filteredReclamations = reclamations;
    if (currentFilter === 'work') {
        filteredReclamations = filteredReclamations.filter(rec => rec.status === 'inwork');
    } else if (currentFilter === 'done') {
        filteredReclamations = filteredReclamations.filter(rec => rec.status === 'resolved');
    }
    if (dateFrom) {
        filteredReclamations = filteredReclamations.filter(rec => {
            const recDate = new Date(rec.date.split('.').reverse().join('-'));
            const fromDate = new Date(dateFrom);
            return recDate >= fromDate;
        });
    }
    if (dateTo) {
        filteredReclamations = filteredReclamations.filter(rec => {
            const recDate = new Date(rec.date.split('.').reverse().join('-'));
            const toDate = new Date(dateTo);
            return recDate <= toDate;
        });
    }
    if (productSearch) {
        filteredReclamations = filteredReclamations.filter(rec => {
            return rec.items.some(item => item.name.toLowerCase().includes(productSearch));
        });
    }
    renderFilteredReclamations(filteredReclamations, currentFilter);
}

function renderFilteredReclamations(filteredReclamations, filter) {
    const reclamationsList = document.getElementById('reclamations-list');
    const mobileReclamationsList = document.getElementById('mobile-reclamations-list');
    reclamationsList.innerHTML = '';
    mobileReclamationsList.innerHTML = '';
    if (filteredReclamations.length === 0) {
        const noDataMessage = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p style="font-size: 16px;">По вашему запросу рекламаций не найдено</p>
            </div>
        `;
        reclamationsList.innerHTML = `<tr><td colspan="8">${noDataMessage}</td></tr>`;
        mobileReclamationsList.innerHTML = noDataMessage;
        return;
    }
    filteredReclamations.forEach(rec => {
        renderDesktopReclamation(rec, reclamationsList, filter);
        renderMobileReclamation(rec, mobileReclamationsList, filter);
    });
}

function resetSearch() {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('product-search').value = '';
    renderReclamations();
}

function showOrderDetails(orderNumber) {
    const orderDetails = document.getElementById('order-details');
    const productsTable = document.getElementById('products-table').querySelector('tbody');
    const mobileProductsVertical = document.getElementById('mobile-products-vertical');
    const totalPriceElement = document.getElementById('total-order-price');
    const orderDateElement = document.getElementById('order-date');
    productsTable.innerHTML = '';
    mobileProductsVertical.innerHTML = '';
    const orderData = orders[orderNumber];
    const orderItems = orderData.products;
    let totalPrice = 0;
    orderItems.forEach((item, index) => {
        const row = document.createElement('tr');
        const itemTotal = item.quantity * item.price;
        totalPrice += itemTotal;
        if (!itemFiles[index]) {
            itemFiles[index] = [];
        }
        row.innerHTML = `
            <td>${item.name} <br><span class="quantity-info">Код: ${item.code}, Доступно: <span class="max-quantity">${item.maxQuantity}</span> ${item.unit}</span></td>
            <td>${item.quantity} ${item.unit}</td>
            <td class="price-column">${item.price.toFixed(2)} руб.</td>
            <td class="price-column">${itemTotal.toFixed(2)} руб.</td>
            <td class="reason-column">
                <div class="reason-tiles">
                    <div class="reason-tile" data-reason="shortage" data-index="${index}">Недостача</div>
                    <div class="reason-tile" data-reason="excess" data-index="${index}">Излишек</div>
                    <div class="reason-tile" data-reason="breakage" data-index="${index}">Бой</div>
                </div>
                <div class="tile-quantity-input" id="tile-quantity-${index}">
                    <input type="number" min="1" max="${item.maxQuantity}" placeholder="Введите количество" data-index="${index}">
                </div>
            </td>
            <td class="files-column">
                <button class="item-attach-btn" data-index="${index}">Прикрепить</button>
                <input type="file" class="item-file-input" data-index="${index}" multiple style="display: none">
                <div class="item-files-container" data-index="${index}">
                    <div class="item-file-list" data-index="${index}"></div>
                </div>
            </td>
        `;
        productsTable.appendChild(row);
    });
    orderItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'mobile-product-card';
        card.setAttribute('data-index', index);
        const itemTotal = item.quantity * item.price;
        card.innerHTML = `
            <div class="mobile-product-header">
                <div class="mobile-product-name">${item.name}</div>
                <div class="mobile-product-details">
                    Код: ${item.code}<br>
                    Доступно: <span class="max-quantity">${item.maxQuantity}</span> ${item.unit}<br>
                    В заказе: ${item.quantity} ${item.unit}<br>
                    Цена: ${item.price.toFixed(2)} руб./${item.unit}<br>
                    <div class="mobile-product-price">Сумма: ${itemTotal.toFixed(2)} руб.</div>
                </div>
            </div>
            <div class="mobile-reason-section">
                <div class="mobile-reason-title">Причина рекламации:</div>
                <div class="mobile-reason-options">
                    <div class="mobile-reason-option">
                        <button class="mobile-reason-btn" data-reason="shortage" data-index="${index}">Недостача</button>
                    </div>
                    <div class="mobile-reason-option">
                        <button class="mobile-reason-btn" data-reason="excess" data-index="${index}">Излишек</button>
                    </div>
                    <div class="mobile-reason-option">
                        <button class="mobile-reason-btn" data-reason="breakage" data-index="${index}">Бой</button>
                    </div>
                </div>
                <div class="mobile-quantity-input" id="mobile-quantity-${index}">
                    <label>Количество:</label>
                    <input type="number" class="mobile-quantity" data-index="${index}" min="1" max="${item.maxQuantity}" placeholder="0">
                </div>
                <div class="mobile-files-section" id="mobile-files-${index}" style="display: none; margin-top: 10px;">
                    <button class="item-attach-btn" data-index="${index}">Прикрепить файлы</button>
                    <input type="file" class="item-file-input" data-index="${index}" multiple style="display: none">
                    <div class="item-file-list" data-index="${index}"></div>
                </div>
            </div>
        `;
        mobileProductsVertical.appendChild(card);
    });
    totalPriceElement.textContent = orderData.totalAmount.toFixed(2);
    orderDateElement.textContent = orderData.date;
    orderDetails.style.display = 'block';
    currentReclamationType = null;
    document.querySelectorAll('.reason-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const reason = this.getAttribute('data-reason');
            const item = orderItems[index];
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                document.querySelector(`#tile-quantity-${index}`).style.display = 'none';
                updateReclamationCost();
                return;
            }
            document.querySelectorAll(`.reason-tile[data-index="${index}"]`).forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const quantityInput = document.querySelector(`#tile-quantity-${index}`);
            quantityInput.style.display = 'block';
            const input = quantityInput.querySelector('input');
            input.focus();
            input.setAttribute('max', reason === 'excess' ? '1000' : item.maxQuantity);
            updateReclamationCost();
            checkAttachmentRequirement();
        });
    });
    document.querySelectorAll('.tile-quantity-input input').forEach(input => {
        input.addEventListener('input', function() {
            const index = this.getAttribute('data-index');
            const maxQuantity = parseInt(this.getAttribute('max'));
            const value = parseInt(this.value) || 0;
            if (value > maxQuantity) this.value = maxQuantity;
            updateReclamationCost();
        });
    });
    document.querySelectorAll('.mobile-reason-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            document.querySelectorAll(`.mobile-reason-btn[data-index="${index}"]`).forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const quantityInput = document.querySelector(`#mobile-quantity-${index}`);
            quantityInput.style.display = 'block';
            const filesSection = document.querySelector(`#mobile-files-${index}`);
            filesSection.style.display = 'block';
            updateReclamationCost();
            checkAttachmentRequirement();
        });
    });
    document.querySelectorAll('.mobile-quantity').forEach(input => {
        input.addEventListener('input', function() {
            const index = this.getAttribute('data-index');
            const maxQuantity = parseInt(this.getAttribute('max'));
            const value = parseInt(this.value) || 0;
            if (value > maxQuantity) this.value = maxQuantity;
            updateReclamationCost();
        });
    });
    document.querySelectorAll('.item-attach-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const fileInput = document.querySelector(`.item-file-input[data-index="${index}"]`);
            fileInput.click();
        });
    });
    document.querySelectorAll('.item-file-input').forEach(input => {
        input.addEventListener('change', function(e) {
            const index = this.getAttribute('data-index');
            handleItemFileSelection(index, e.target.files);
        });
    });
}

function handleItemFileSelection(index, files) {
    const fileList = document.querySelector(`.item-file-list[data-index="${index}"]`);
    if (!itemFiles[index]) itemFiles[index] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!itemFiles[index].some(f => f.name === file.name && f.size === file.size)) {
            itemFiles[index].push(file);
            const fileItem = document.createElement('div');
            fileItem.className = 'item-file-item';
            fileItem.innerHTML = `
                <span class="file-link" data-file="${file.name}" data-index="${index}">${file.name}</span>
                <span class="item-file-remove" data-index="${index}" data-file-index="${itemFiles[index].length - 1}">✕</span>
            `;
            fileList.appendChild(fileItem);
            fileItem.querySelector('.item-file-remove').addEventListener('click', function() {
                const fileIndex = parseInt(this.getAttribute('data-file-index'));
                itemFiles[index].splice(fileIndex, 1);
                fileList.removeChild(fileItem);
                updateItemFileIndexes(index);
            });
            fileItem.querySelector('.file-link').addEventListener('click', function() {
                const fileName = this.getAttribute('data-file');
                previewFile(fileName);
            });
        }
    }
    const filesContainer = document.querySelector(`.item-files-container[data-index="${index}"]`);
    if (itemFiles[index].length > 0) filesContainer.style.display = 'block';
    checkAttachmentRequirement();
}

function updateItemFileIndexes(index) {
    const fileItems = document.querySelectorAll(`.item-file-item[data-index="${index}"]`);
    fileItems.forEach((item, fileIndex) => {
        item.querySelector('.item-file-remove').setAttribute('data-file-index', fileIndex);
    });
    const filesContainer = document.querySelector(`.item-files-container[data-index="${index}"]`);
    if (itemFiles[index].length === 0) filesContainer.style.display = 'none';
}

function previewFile(fileName) {
    const modal = document.getElementById('file-preview-modal');
    const title = document.getElementById('file-preview-title');
    const body = document.getElementById('file-preview-body');
    title.textContent = `Просмотр файла: ${fileName}`;
    body.innerHTML = '<p>Загрузка файла...</p>';
    const extension = fileName.split('.').pop().toLowerCase();
    setTimeout(() => {
        let content = '';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
            content = `<img src="https://via.placeholder.com/600x400/FFD700/000000?text=Превью+${fileName}" class="file-preview-image" alt="${fileName}">`;
        } else if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension)) {
            content = `<video controls class="file-preview-video"><source src="#" type="video/mp4">Ваш браузер не поддерживает видео.</video>`;
        } else if (extension === 'pdf') {
            content = `<embed src="#" type="application/pdf" class="file-preview-pdf">`;
        } else {
            content = `<div class="file-preview-text">Файл "${fileName}" не может быть просмотрен в браузере. <br>Скачайте его для просмотра.</div>`;
        }
        body.innerHTML = content;
        const downloadLink = document.createElement('a');
        downloadLink.href = '#';
        downloadLink.textContent = 'Скачать файл';
        downloadLink.className = 'file-preview-download';
        downloadLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert(`В реальной системе здесь будет скачивание файла "${fileName}". В демо-версии это действие имитируется.`);
        });
        body.appendChild(downloadLink);
    }, 1000);
    modal.style.display = 'flex';
}

function checkAttachmentRequirement() {
    let breakageChecked = false;
    let excessChecked = false;
    if (document.body.classList.contains('mobile-version')) {
        document.querySelectorAll('.mobile-reason-btn.active').forEach(button => {
            const reason = button.getAttribute('data-reason');
            if (reason === 'breakage') breakageChecked = true;
            if (reason === 'excess') excessChecked = true;
        });
    } else {
        document.querySelectorAll('.reason-tile.active').forEach(tile => {
            const reason = tile.getAttribute('data-reason');
            if (reason === 'breakage') breakageChecked = true;
            if (reason === 'excess') excessChecked = true;
        });
    }
    let hasRequiredFiles = true;
    if (breakageChecked) {
        const checkedItems = [];
        if (document.body.classList.contains('mobile-version')) {
            document.querySelectorAll('.mobile-reason-btn.active').forEach(button => {
                const index = button.getAttribute('data-index');
                if (button.getAttribute('data-reason') === 'breakage') checkedItems.push(index);
            });
        } else {
            document.querySelectorAll('.reason-tile.active').forEach(tile => {
                const index = tile.getAttribute('data-index');
                if (tile.getAttribute('data-reason') === 'breakage') checkedItems.push(index);
            });
        }
        hasRequiredFiles = checkedItems.every(index => itemFiles[index] && itemFiles[index].length > 0);
    }
    if (excessChecked || additionalArticles.length > 0) {
        let excessHasFiles = true;
        additionalArticles.forEach((article, index) => {
            if (!itemFiles[`excess-${index}`] || itemFiles[`excess-${index}`].length === 0) excessHasFiles = false;
        });
        if (!excessHasFiles) {
            alert('Для позиций с отмеченным "Излишком" необходимо прикрепить фотографии товара!');
            return false;
        }
    }
    if (breakageChecked && !hasRequiredFiles) {
        alert('Для позиций с отмеченным "Боем" необходимо прикрепить файлы!');
        return false;
    }
    return true;
}

function updateReclamationCost() {
    let totalCost = 0;
    if (document.body.classList.contains('mobile-version')) {
        document.querySelectorAll('.mobile-product-card').forEach(card => {
            const index = card.getAttribute('data-index');
            const activeButton = card.querySelector('.mobile-reason-btn.active');
            const quantityInput = card.querySelector('.mobile-quantity');
            if (activeButton && quantityInput && quantityInput.value) {
                const quantity = parseInt(quantityInput.value) || 0;
                const orderItems = orders[selectedOrder].products;
                const item = orderItems[index];
                totalCost += quantity * item.price;
            }
        });
    } else {
        const orderItems = orders[selectedOrder].products;
        orderItems.forEach((item, index) => {
            const activeTile = document.querySelector(`.reason-tile.active[data-index="${index}"]`);
            const quantityInput = document.querySelector(`#tile-quantity-${index} input`);
            if (activeTile && quantityInput && quantityInput.value) {
                const quantity = parseInt(quantityInput.value) || 0;
                totalCost += quantity * item.price;
            }
        });
    }
    document.getElementById('reclamation-total').textContent = totalCost.toFixed(2);
}

function submitReclamation() {
    if (!selectedOrder) {
        alert('Пожалуйста, выберите номер заказа.');
        return;
    }
    let hasSelectedItems = false;
    if (document.body.classList.contains('mobile-version')) {
        hasSelectedItems = document.querySelectorAll('.mobile-reason-btn.active').length > 0;
    } else {
        hasSelectedItems = document.querySelectorAll('.reason-tile.active').length > 0;
    }
    if (!hasSelectedItems && additionalArticles.length === 0) {
        alert('Пожалуйста, выберите хотя бы один товар для рекламации или добавьте артикул излишка.');
        return;
    }
    if (!checkAttachmentRequirement()) return;
    const comment = document.getElementById('reclamation-comment').value.trim();
    const reclamationNumber = orders[selectedOrder].reclamationNumber;
    const reclamationData = {
        id: reclamationCounter++,
        number: reclamationNumber,
        date: new Date().toLocaleDateString('ru-RU'),
        status: 'inwork',
        resolution: 'На рассмотрении',
        responsible: 'Рубцов Р.А.',
        amount: parseFloat(document.getElementById('reclamation-total').textContent),
        tags: [],
        orderNumber: selectedOrder,
        comment: comment,
        files: [],
        items: [],
        communication: []
    };
    const orderItems = orders[selectedOrder].products;
    if (document.body.classList.contains('mobile-version')) {
        document.querySelectorAll('.mobile-product-card').forEach(card => {
            const index = card.getAttribute('data-index');
            const activeButton = card.querySelector('.mobile-reason-btn.active');
            const quantityInput = card.querySelector('.mobile-quantity');
            if (activeButton && quantityInput && quantityInput.value) {
                const reason = activeButton.getAttribute('data-reason');
                const quantity = parseInt(quantityInput.value) || 0;
                const item = orderItems[index];
                const reclamationItem = {
                    name: item.name,
                    code: item.code,
                    quantity: quantity,
                    reason: reason,
                    price: item.price,
                    unit: item.unit,
                    resolution: 'На рассмотрении',
                    files: itemFiles[index] ? itemFiles[index].map(file => file.name) : []
                };
                reclamationData.items.push(reclamationItem);
                if (itemFiles[index]) reclamationData.files.push(...itemFiles[index].map(file => file.name));
                switch(reason) {
                    case 'shortage': reclamationData.tags.push('Недостача'); break;
                    case 'excess': reclamationData.tags.push('Излишек'); break;
                    case 'breakage': reclamationData.tags.push('Бой'); break;
                }
            }
        });
    } else {
        orderItems.forEach((item, index) => {
            const activeTile = document.querySelector(`.reason-tile.active[data-index="${index}"]`);
            const quantityInput = document.querySelector(`#tile-quantity-${index} input`);
            if (activeTile && quantityInput && quantityInput.value) {
                const reason = activeTile.getAttribute('data-reason');
                const quantity = parseInt(quantityInput.value) || 0;
                const reclamationItem = {
                    name: item.name,
                    code: item.code,
                    quantity: quantity,
                    reason: reason,
                    price: item.price,
                    unit: item.unit,
                    resolution: 'На рассмотрении',
                    files: itemFiles[index] ? itemFiles[index].map(file => file.name) : []
                };
                reclamationData.items.push(reclamationItem);
                if (itemFiles[index]) reclamationData.files.push(...itemFiles[index].map(file => file.name));
                switch(reason) {
                    case 'shortage': reclamationData.tags.push('Недостача'); break;
                    case 'excess': reclamationData.tags.push('Излишек'); break;
                    case 'breakage': reclamationData.tags.push('Бой'); break;
                }
            }
        });
    }
    additionalArticles.forEach((article, index) => {
        if ((article.code && article.name && article.quantity > 0) || article.description) {
            const reclamationItem = {
                name: article.name || 'Неидентифицированный товар',
                code: article.code || 'НЕТ',
                quantity: article.quantity,
                reason: 'excess',
                price: 0,
                unit: article.unit,
                resolution: 'На рассмотрении',
                files: itemFiles[`excess-${index}`] ? itemFiles[`excess-${index}`].map(file => file.name) : [],
                description: article.description || '',
                isAdditional: true
            };
            reclamationData.items.push(reclamationItem);
            if (itemFiles[`excess-${index}`]) reclamationData.files.push(...itemFiles[`excess-${index}`].map(file => file.name));
            if (!reclamationData.tags.includes('Излишек')) reclamationData.tags.push('Излишек');
        }
    });
    reclamationData.tags = [...new Set(reclamationData.tags)];
    reclamationData.files = [...new Set(reclamationData.files)];
    reclamations.unshift(reclamationData);
    updateAvailableQuantities(selectedOrder, reclamationData.items);
    notifications.unshift({
        id: notifications.length + 1,
        title: "Рекламация создана",
        text: `Ваша рекламация ${reclamationData.number} успешно создана и отправлена на рассмотрение`,
        date: new Date().toLocaleString('ru-RU'),
        type: "created",
        reclamationId: reclamationData.id,
        read: false
    });
    document.getElementById('reclamation-number').textContent = reclamationData.number;
    document.getElementById('success-modal').style.display = 'flex';
    resetForm();
    loadNotifications();
}

function updateAvailableQuantities(orderNumber, reclamationItems) {
    reclamationItems.forEach(reclamationItem => {
        if (!reclamationItem.isAdditional) {
            const orderItem = orders[orderNumber].products.find(item => item.code === reclamationItem.code);
            if (orderItem) {
                orderItem.maxQuantity -= reclamationItem.quantity;
                if (orderItem.maxQuantity < 0) orderItem.maxQuantity = 0;
            }
        }
    });
}

function resetForm() {
    document.getElementById('order-search').value = '';
    document.getElementById('order-select').value = '';
    document.getElementById('order-details').style.display = 'none';
    document.getElementById('reclamation-comment').value = '';
    selectedFiles = [];
    itemFiles = {};
    selectedOrder = null;
    currentReclamationType = null;
    additionalArticles = [];
    document.getElementById('article-items').innerHTML = '';
}

function renderReclamations(filter = 'work') {
    const reclamationsList = document.getElementById('reclamations-list');
    const mobileReclamationsList = document.getElementById('mobile-reclamations-list');
    reclamationsList.innerHTML = '';
    mobileReclamationsList.innerHTML = '';
    let filteredReclamations = reclamations;
    if (filter === 'work') {
        filteredReclamations = reclamations.filter(rec => rec.status === 'inwork');
    } else if (filter === 'done') {
        filteredReclamations = reclamations.filter(rec => rec.status === 'resolved');
    }
    if (filteredReclamations.length === 0) {
        const noDataMessage = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p style="font-size: 16px;">У вас нет ${filter === 'work' ? 'текущих' : 'завершенных'} рекламаций</p>
            </div>
        `;
        reclamationsList.innerHTML = `<tr><td colspan="8">${noDataMessage}</td></tr>`;
        mobileReclamationsList.innerHTML = noDataMessage;
        return;
    }
    filteredReclamations.forEach(rec => {
        renderDesktopReclamation(rec, reclamationsList, filter);
        renderMobileReclamation(rec, mobileReclamationsList, filter);
    });
}

function renderDesktopReclamation(rec, container, filter) {
    const mainRow = document.createElement('tr');
    mainRow.className = 'reclamation-row reclamation-main-row';
    mainRow.setAttribute('data-id', rec.id);
    let statusClass = '';
    let statusText = '';
    if (rec.status === 'inwork') {
        statusClass = 'status-inwork';
        statusText = 'В работе';
    } else if (rec.status === 'resolved') {
        statusClass = 'status-resolved';
        statusText = 'Завершено';
    }
    mainRow.innerHTML = `
        <td class="expand-icon">+</td>
        <td>${rec.number}</td>
        <td>${rec.date}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td>${rec.resolution}</td>
        <td>${rec.responsible}</td>
        <td>${rec.amount.toFixed(2)} руб.</td>
        <td>${rec.tags.map(tag => `<span class="hashtag">#${tag}</span>`).join('')}</td>
    `;
    container.appendChild(mainRow);
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'reclamation-row reclamation-details-row';
    detailsRow.setAttribute('data-id', rec.id);
    detailsRow.style.display = 'none';
    const detailsCell = document.createElement('td');
    detailsCell.className = 'reclamation-details-cell';
    detailsCell.colSpan = 8;
    const detailsContent = document.createElement('div');
    detailsContent.className = 'reclamation-details-content';
    detailsContent.innerHTML = `
        <div class="details-grid">
            <div class="details-info">
                <h4>Информация о рекламации</h4>
                <p><strong>Номер заказа:</strong> ${rec.orderNumber}</p>
                <p><strong>Дата создания:</strong> ${rec.date}</p>
                <p><strong>Статус:</strong> ${statusText}</p>
                <p><strong>Способ урегулирования:</strong> ${rec.resolution}</p>
                <p><strong>Ответственный:</strong> ${rec.responsible}</p>
                <p><strong>Комментарий:</strong> ${rec.comment || 'Не указан'}</p>
            </div>
            <div class="details-info">
                <h4>Финансовая информация</h4>
                <p><strong>Сумма рекламации:</strong> ${rec.amount.toFixed(2)} руб.</p>
                <p><strong>Количество позиций:</strong> ${rec.items.length}</p>
                <p><strong>Теги:</strong> ${rec.tags.join(', ')}</p>
                <p><strong>Файлов прикреплено:</strong> ${rec.files ? rec.files.length : 0}</p>
            </div>
        </div>
        <div class="details-section">
            <h4>Товары в рекламации</h4>
            <div class="mobile-table-container">
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Наименование товара</th>
                            <th>Код товара</th>
                            <th>Количество</th>
                            <th>Причина</th>
                            <th>Способ урегулирования</th>
                            <th>Цена за ед.</th>
                            <th>Сумма</th>
                            <th>Файлы</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rec.items.map(item => `
                            <tr>
                                <td>${item.name}${item.description ? `<br><small>Описание: ${item.description}</small>` : ''}</td>
                                <td>${item.code}</td>
                                <td>${item.quantity} ${item.unit}</td>
                                <td>${getReasonText(item.reason)}</td>
                                <td>${item.resolution}</td>
                                <td>${item.price > 0 ? item.price.toFixed(2) + ' руб.' : 'Не указана'}</td>
                                <td>${item.price > 0 ? (item.quantity * item.price).toFixed(2) + ' руб.' : 'Не указана'}</td>
                                <td>${item.files && item.files.length > 0 ? item.files.map(file => `<div><span class="file-link" data-file="${file}">${file}</span></div>`).join('') : 'Нет файлов'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ${rec.files && rec.files.length > 0 ? `
        <div class="details-section">
            <h4>Прикрепленные файлы</h4>
            <ul class="files-list">
                ${rec.files.map(file => `<li><span class="file-link" data-file="${file}">${file}</span></li>`).join('')}
            </ul>
        </div>
        ` : ''}
        <div class="communication-section">
            <h4>Переписка по рекламации</h4>
            ${rec.communication.length > 0 ? 
                rec.communication.map(msg => `
                    <div class="message ${msg.sender.includes('отдел качества') ? 'support-message' : 'client-message'}">
                        <div class="message-sender">${msg.sender}</div>
                        <div class="message-text">${msg.text}</div>
                        <div class="message-date">${msg.date}</div>
                        ${msg.files && msg.files.length > 0 ? `
                            <div class="communication-file-list">
                                <p><strong>Прикрепленные файлы:</strong></p>
                                <ul class="files-list">
                                    ${msg.files.map(file => `<li><span class="file-link" data-file="${file}">${file}</span></li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `).join('') : 
                '<p>Переписка по рекламации отсутствует.</p>'
            }
            <div class="message-form">
                <textarea class="message-input" placeholder="Введите ваш ответ..."></textarea>
                <div class="communication-file-attachment">
                    <input type="file" class="communication-file-input" multiple style="display: none">
                    <button class="attach-btn communication-attach-btn">Прикрепить файлы</button>
                    <div class="communication-file-list"></div>
                </div>
                <button class="send-btn">Отправить</button>
            </div>
        </div>
    `;
    detailsCell.appendChild(detailsContent);
    detailsRow.appendChild(detailsCell);
    container.appendChild(detailsRow);
    mainRow.addEventListener('click', function() {
        const detailsRow = document.querySelector(`.reclamation-details-row[data-id="${rec.id}"]`);
        const expandIcon = this.querySelector('.expand-icon');
        if (detailsRow.style.display === 'none') {
            document.querySelectorAll('.reclamation-details-row').forEach(row => row.style.display = 'none');
            document.querySelectorAll('.expand-icon').forEach(icon => icon.textContent = '+');
            detailsRow.style.display = 'table-row';
            expandIcon.textContent = '-';
        } else {
            detailsRow.style.display = 'none';
            expandIcon.textContent = '+';
        }
    });
    detailsContent.querySelectorAll('.file-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.stopPropagation();
            const fileName = this.getAttribute('data-file');
            previewFile(fileName);
        });
    });
    const sendBtn = detailsContent.querySelector('.send-btn');
    const messageInput = detailsContent.querySelector('.message-input');
    const communicationFileInput = detailsContent.querySelector('.communication-file-input');
    const communicationAttachBtn = detailsContent.querySelector('.communication-attach-btn');
    const communicationFileList = detailsContent.querySelector('.communication-file-list');
    let communicationFiles = [];
    communicationAttachBtn.addEventListener('click', function() {
        communicationFileInput.click();
    });
    communicationFileInput.addEventListener('change', function(e) {
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            if (!communicationFiles.some(f => f.name === file.name && f.size === file.size)) {
                communicationFiles.push(file);
            }
        }
        updateCommunicationFileList();
        this.value = '';
    });
    function updateCommunicationFileList() {
        communicationFileList.innerHTML = '';
        if (communicationFiles.length === 0) return;
        communicationFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `<span>${file.name}</span><span class="file-remove" data-index="${index}">✕</span>`;
            communicationFileList.appendChild(fileItem);
            fileItem.querySelector('.file-remove').addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                communicationFiles.splice(idx, 1);
                updateCommunicationFileList();
            });
        });
    }
    sendBtn.addEventListener('click', function() {
        const messageText = messageInput.value.trim();
        if (messageText || communicationFiles.length > 0) {
            rec.communication.push({
                sender: document.getElementById('user-display-name').textContent,
                text: messageText,
                date: new Date().toLocaleString('ru-RU'),
                files: communicationFiles.map(file => file.name)
            });
            renderReclamations(filter);
            messageInput.value = '';
            communicationFiles = [];
            updateCommunicationFileList();
        }
    });
}

function renderMobileReclamation(rec, container, filter) {
    const card = document.createElement('div');
    card.className = 'mobile-reclamation-card';
    card.setAttribute('data-id', rec.id);
    let statusClass = '';
    let statusText = '';
    if (rec.status === 'inwork') {
        statusClass = 'inwork';
        statusText = 'В работе';
    } else if (rec.status === 'resolved') {
        statusClass = 'resolved';
        statusText = 'Завершено';
    }
    card.innerHTML = `
        <div class="mobile-reclamation-header">
            <div class="mobile-reclamation-main-info">
                <div class="mobile-reclamation-number">${rec.number}</div>
                <div class="mobile-reclamation-date">${rec.date}</div>
                <span class="mobile-reclamation-status ${statusClass}">${statusText}</span>
            </div>
            <div class="mobile-reclamation-expand">+</div>
        </div>
        <div class="mobile-reclamation-details">
            <div class="mobile-reclamation-info-grid">
                <div class="mobile-reclamation-info-item">
                    <h4>Основная информация</h4>
                    <p><strong>Заказ:</strong> ${rec.orderNumber}</p>
                    <p><strong>Решение:</strong> ${rec.resolution}</p>
                    <p><strong>Ответственный:</strong> ${rec.responsible}</p>
                    <p><strong>Сумма:</strong> ${rec.amount.toFixed(2)} руб.</p>
                </div>
                <div class="mobile-reclamation-info-item">
                    <h4>Детали</h4>
                    <p><strong>Комментарий:</strong> ${rec.comment || 'Не указан'}</p>
                    <p><strong>Позиций:</strong> ${rec.items.length}</p>
                    <p><strong>Файлов:</strong> ${rec.files ? rec.files.length : 0}</p>
                    <div class="mobile-reclamation-tags">
                        ${rec.tags.map(tag => `<span class="mobile-reclamation-tag">#${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div class="mobile-reclamation-items">
                <h4>Товары в рекламации</h4>
                ${rec.items.map(item => `
                    <div class="mobile-reclamation-item">
                        <div class="mobile-reclamation-item-name">${item.name}</div>
                        <div class="mobile-reclamation-item-details">
                            Код: ${item.code} | 
                            Количество: ${item.quantity} ${item.unit} | 
                            Причина: ${getReasonText(item.reason)} |
                            Способ урегулирования: ${item.resolution} |
                            ${item.price > 0 ? `Сумма: ${(item.quantity * item.price).toFixed(2)} руб.` : 'Сумма: Не указана'}
                        </div>
                        ${item.description ? `<div class="mobile-reclamation-item-description"><strong>Описание:</strong> ${item.description}</div>` : ''}
                        ${item.files && item.files.length > 0 ? `
                            <div class="mobile-reclamation-files">
                                <p><strong>Файлы:</strong></p>
                                <ul class="mobile-file-list">
                                    ${item.files.map(file => `<li class="mobile-file-item"><span class="mobile-file-link" data-file="${file}">${file}</span></li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ${rec.files && rec.files.length > 0 ? `
            <div class="mobile-reclamation-files">
                <h4>Прикрепленные файлы</h4>
                <ul class="mobile-file-list">
                    ${rec.files.map(file => `<li class="mobile-file-item"><span class="mobile-file-link" data-file="${file}">${file}</span></li>`).join('')}
                </ul>
            </div>
            ` : ''}
            <div class="mobile-communication-section">
                <h4>Переписка</h4>
                ${rec.communication.length > 0 ? 
                    rec.communication.map(msg => `
                        <div class="mobile-message ${msg.sender.includes('отдел качества') ? 'mobile-support-message' : 'mobile-client-message'}">
                            <div class="mobile-message-sender">${msg.sender}</div>
                            <div class="mobile-message-text">${msg.text}</div>
                            <div class="mobile-message-date">${msg.date}</div>
                        </div>
                    `).join('') : 
                    '<p>Переписка по рекламации отсутствует.</p>'
                }
                <div class="mobile-message-form">
                    <textarea class="mobile-message-input" placeholder="Введите ваш ответ..."></textarea>
                    <button class="mobile-send-btn">Отправить сообщение</button>
                </div>
            </div>
        </div>
    `;
    container.appendChild(card);
    const header = card.querySelector('.mobile-reclamation-header');
    const expandIcon = card.querySelector('.mobile-reclamation-expand');
    const details = card.querySelector('.mobile-reclamation-details');
    header.addEventListener('click', function() {
        if (details.style.display === 'none' || !details.style.display) {
            document.querySelectorAll('.mobile-reclamation-details').forEach(d => d.style.display = 'none');
            document.querySelectorAll('.mobile-reclamation-expand').forEach(i => i.textContent = '+');
            details.style.display = 'block';
            expandIcon.textContent = '-';
        } else {
            details.style.display = 'none';
            expandIcon.textContent = '+';
        }
    });
    card.querySelectorAll('.mobile-file-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.stopPropagation();
            const fileName = this.getAttribute('data-file');
            previewFile(fileName);
        });
    });
    const sendBtn = card.querySelector('.mobile-send-btn');
    const messageInput = card.querySelector('.mobile-message-input');
    sendBtn.addEventListener('click', function() {
        const messageText = messageInput.value.trim();
        if (messageText) {
            rec.communication.push({
                sender: document.getElementById('user-display-name').textContent,
                text: messageText,
                date: new Date().toLocaleString('ru-RU'),
                files: []
            });
            renderReclamations(filter);
            messageInput.value = '';
        }
    });
}

function getReasonText(reason) {
    if (reason === 'shortage') return 'Недостача';
    if (reason === 'excess') return 'Излишек';
    if (reason === 'breakage') return 'Бой';
    return reason;
}

(() => {
    'use strict';

    // Configuración general de la tienda
    const TAX_RATE = 0.16;
    const CATALOG = {
        'plan-basic': {
            id: 'plan-basic',
            name: 'Plan NVENTIA BASIC',
            billing: '/ semana',
            price: 400,
            badge: 'BASIC',
            description: 'Hasta 200 activos • Panel básico • 1 usuario'
        },
        'plan-pro': {
            id: 'plan-pro',
            name: 'Plan NVENTIA PRO',
            billing: '/ mes',
            price: 1200,
            badge: 'MÁS POPULAR',
            description: 'Activos ilimitados • Tiempo real • API REST'
        },
        'plan-ultra': {
            id: 'plan-ultra',
            name: 'Plan NVENTIA ULTRA',
            billing: '/ año',
            price: 12000,
            badge: 'ENTERPRISE',
            description: 'Sin límites • SLA 99.9% • Gestor exclusivo'
        },
        'addon-qr': {
            id: 'addon-qr',
            name: 'Kit 500 Etiquetas QR/Metal',
            billing: 'pago único',
            price: 1700,
            badge: 'INSUMO',
            description: 'Etiquetas industriales homologadas'
        },
        'addon-scanner': {
            id: 'addon-scanner',
            name: 'Terminal Lector RFID/QR',
            billing: 'pago único',
            price: 6400,
            badge: 'HARDWARE',
            description: 'Escáner inalámbrico sincronizable'
        },
        'addon-migration': {
            id: 'addon-migration',
            name: 'Migración y Homologación',
            billing: 'servicio',
            price: 5000,
            badge: 'SERVICIO',
            description: 'Carga y normalización inicial de datos'
        }
    };

    // La selección actual vive aquí mientras el usuario navega por la página
    let cart = [];
    let lastOrder = null;
    let toastTimeout;

    const getElement = (id) => document.getElementById(id);

    function formatCurrency(amount) {
        return amount.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        });
    }

    function getTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * TAX_RATE;
        return { subtotal, tax, total: subtotal + tax };
    }

    // Protege el contenido generado a partir de datos escritos por el usuario
    function escapeHtml(value) {
        const element = document.createElement('div');
        element.textContent = value;
        return element.innerHTML;
    }

    function addToCart(productId) {
        const product = CATALOG[productId];
        if (!product) return;

        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        updateCartUI();
        showToast(`${product.name} agregado`, `${formatCurrency(product.price)} ${product.billing}`);

        const badge = getElement('cart-badge');
        badge.classList.remove('badge-pop');
        void badge.offsetWidth;
        badge.classList.add('badge-pop');
    }

    function updateQuantity(productId, delta) {
        const index = cart.findIndex(item => item.id === productId);
        if (index === -1) return;

        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        updateCartUI();
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCartUI();
    }

    function updateCartUI() {
        // Mantiene sincronizado el contador y el detalle visible del carrito
        const badge = getElement('cart-badge');
        const subtitle = getElement('cart-subtitle');
        const container = getElement('cart-items-container');
        const footer = getElement('cart-footer');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        badge.textContent = totalItems;
        subtitle.textContent = totalItems === 1
            ? '1 artículo seleccionado'
            : `${totalItems} artículos seleccionados`;

        if (cart.length === 0) {
            footer.classList.add('hidden');
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                    <div class="w-16 h-16 rounded-2xl bg-slate-200/70 text-nventia-gray flex items-center justify-center mb-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                    <h4 class="font-display font-bold text-base text-nventia-slate mb-1">Aún no has seleccionado un plan</h4>
                    <p class="text-xs text-nventia-gray max-w-xs mb-6">
                        Cuando encuentres el plan adecuado, agrégalo aquí para revisar tu selección.
                    </p>
                    <button type="button" data-action="explore-pricing" class="px-5 py-2.5 rounded-xl bg-nventia-blue text-white text-xs font-bold hover:bg-nventia-blueHover transition">
                        Ver los planes
                    </button>
                </div>
            `;
            return;
        }

        footer.classList.remove('hidden');
        container.innerHTML = cart.map(item => `
            <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col gap-3">
                <div class="flex justify-between items-start gap-2">
                    <div>
                        <span class="inline-block px-2 py-0.5 rounded-md bg-nventia-blueLight text-nventia-blue text-[10px] font-extrabold tracking-wider uppercase mb-1">
                            ${escapeHtml(item.badge)}
                        </span>
                        <h4 class="font-bold text-sm text-nventia-slate">${escapeHtml(item.name)}</h4>
                        <p class="text-xs text-nventia-gray">${escapeHtml(item.description)}</p>
                    </div>
                    <button type="button" data-action="remove" data-product-id="${item.id}" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div class="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                        <button type="button" data-action="decrease" data-product-id="${item.id}" class="w-7 h-7 rounded-lg bg-white text-nventia-slate font-bold text-sm shadow-2xs hover:bg-slate-200 transition">-</button>
                        <span class="w-7 text-center text-xs font-bold text-nventia-slate">${item.quantity}</span>
                        <button type="button" data-action="increase" data-product-id="${item.id}" class="w-7 h-7 rounded-lg bg-white text-nventia-slate font-bold text-sm shadow-2xs hover:bg-slate-200 transition">+</button>
                    </div>
                    <div class="text-right">
                        <span class="font-display font-extrabold text-base text-nventia-slate">${formatCurrency(item.price * item.quantity)}</span>
                        <span class="block text-[10px] text-nventia-gray">${formatCurrency(item.price)} ${escapeHtml(item.billing)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        const { subtotal, tax, total } = getTotals();
        getElement('cart-subtotal').textContent = formatCurrency(subtotal);
        getElement('cart-tax').textContent = formatCurrency(tax);
        getElement('cart-total').textContent = formatCurrency(total);
    }

    function toggleCart(open) {
        // Presenta u oculta el panel lateral con una breve transición
        const drawer = getElement('cart-drawer');
        const backdrop = getElement('cart-backdrop');

        if (open) {
            backdrop.classList.remove('hidden');
            setTimeout(() => {
                backdrop.classList.remove('opacity-0');
                drawer.classList.remove('translate-x-full');
            }, 10);
        } else {
            backdrop.classList.add('opacity-0');
            drawer.classList.add('translate-x-full');
            setTimeout(() => backdrop.classList.add('hidden'), 320);
        }
    }

    function openCheckoutModal() {
        if (cart.length === 0) return;

        // Primero cerramos el resumen y después mostramos el formulario
        toggleCart(false);
        const modal = getElement('checkout-modal');
        getElement('checkout-form-view').classList.remove('hidden');
        getElement('checkout-success-view').classList.add('hidden');

        const { total } = getTotals();
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        getElement('checkout-summary-items').textContent =
            `${totalCount} ${totalCount === 1 ? 'concepto' : 'conceptos'} • Activación inmediata`;
        getElement('checkout-summary-total').textContent = formatCurrency(total);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeCheckoutModal() {
        const modal = getElement('checkout-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    function togglePaymentFields(method) {
        // Enseña únicamente los datos correspondientes al método elegido
        getElement('card-fields').classList.toggle('hidden', method !== 'card');
        getElement('transfer-fields').classList.toggle('hidden', method !== 'transfer');
    }

    function processOrder(event) {
        event.preventDefault();

        // Recopila los datos necesarios para preparar el resumen de la compra
        const name = getElement('cust-name').value.trim();
        const company = getElement('cust-company').value.trim();
        const email = getElement('cust-email').value.trim();
        const taxId = getElement('cust-taxid').value.trim() || 'N/A';
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        const { subtotal, tax, total } = getTotals();
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const orderId = `NV-2026-${randomCode}`;
        const dateStr = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        getElement('order-number-display').textContent = `Orden #${orderId} • ${dateStr}`;

        const itemsHtml = cart.map(item => `
            <div class="flex justify-between text-nventia-slate">
                <span>${item.quantity}x ${escapeHtml(item.name)}</span>
                <span class="font-bold">${formatCurrency(item.price * item.quantity)}</span>
            </div>
        `).join('');

        getElement('receipt-box').innerHTML = `
            <div class="pb-2.5 border-b border-slate-200 flex justify-between">
                <span class="text-nventia-gray">A nombre de:</span>
                <span class="font-bold text-nventia-slate text-right">${escapeHtml(name)} (${escapeHtml(company)})</span>
            </div>
            <div class="pb-2.5 border-b border-slate-200 flex justify-between">
                <span class="text-nventia-gray">Correo:</span>
                <span class="font-semibold text-nventia-blue">${escapeHtml(email)}</span>
            </div>
            <div class="pb-2.5 border-b border-slate-200 flex justify-between">
                <span class="text-nventia-gray">Método de pago:</span>
                <span class="font-semibold text-nventia-slate">${escapeHtml(paymentMethod)}</span>
            </div>
            <div class="space-y-1.5 py-1">${itemsHtml}</div>
            <div class="pt-2.5 border-t border-slate-200 space-y-1">
                <div class="flex justify-between text-nventia-gray"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>
                <div class="flex justify-between text-nventia-gray"><span>IVA (16%):</span><span>${formatCurrency(tax)}</span></div>
                <div class="flex justify-between text-sm font-extrabold text-nventia-slate pt-1">
                    <span>Total Pagado:</span><span class="text-nventia-blue">${formatCurrency(total)}</span>
                </div>
            </div>
        `;

        lastOrder = {
            orderId,
            date: dateStr,
            name,
            company,
            email,
            taxId,
            paymentMethod,
            items: cart.map(({ name: itemName, quantity, price }) => ({
                name: itemName,
                quantity,
                price
            })),
            subtotal,
            tax,
            total
        };

        getElement('checkout-form-view').classList.add('hidden');
        getElement('checkout-success-view').classList.remove('hidden');
        cart = [];
        updateCartUI();
    }

    function generateReceipt() {
        if (!lastOrder) {
            showToast('No hay una compra para descargar', 'Completa una compra antes de generar el comprobante');
            return;
        }

        if (!window.jspdf || typeof window.jspdf.jsPDF !== 'function') {
            showToast('No se pudo generar el PDF', 'Recarga la página e inténtalo de nuevo');
            return;
        }

        const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 18;
        const contentWidth = pageWidth - margin * 2;
        let y = 22;

        pdf.setProperties({
            title: `Comprobante ${lastOrder.orderId}`,
            subject: 'Comprobante de compra NVENTIA',
            author: 'NVENTIA'
        });

        function ensureSpace(height) {
            if (y + height > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }
        }

        function addDetail(label, value) {
            const labelWidth = 42;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            const lines = pdf.splitTextToSize(String(value), contentWidth - labelWidth);
            const rowHeight = Math.max(6, lines.length * 5);
            ensureSpace(rowHeight);

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(43, 52, 64);
            pdf.text(label, margin, y);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(71, 85, 105);
            pdf.text(lines, margin + labelWidth, y);
            y += rowHeight + 2;
        }

        function addSectionHeading(title) {
            ensureSpace(12);
            y += 4;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.setTextColor(43, 52, 64);
            pdf.text(title, margin, y);
            y += 7;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(43, 52, 64);
        pdf.text('NVENTIA', margin, y);
        pdf.setFontSize(11);
        pdf.setTextColor(13, 124, 199);
        pdf.text('COMPROBANTE DE COMPRA', pageWidth - margin, y, { align: 'right' });
        y += 7;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(95, 111, 123);
        pdf.text('Control y seguimiento de inventario', margin, y);
        y += 5;
        pdf.setDrawColor(13, 124, 199);
        pdf.setLineWidth(0.7);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 9;

        addDetail('Orden:', lastOrder.orderId);
        addDetail('Fecha:', lastOrder.date);

        addSectionHeading('Datos del cliente');
        addDetail('Nombre:', lastOrder.name);
        addDetail('Empresa:', lastOrder.company);
        addDetail('Correo:', lastOrder.email);
        addDetail('RFC / ID fiscal:', lastOrder.taxId);
        addDetail('Método de pago:', lastOrder.paymentMethod);

        addSectionHeading('Detalle de compra');
        ensureSpace(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(95, 111, 123);
        pdf.text('Cant.', margin, y);
        pdf.text('Descripción', margin + 16, y);
        pdf.text('Precio', pageWidth - margin - 31, y, { align: 'right' });
        pdf.text('Importe', pageWidth - margin, y, { align: 'right' });
        y += 3;
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;

        lastOrder.items.forEach((item) => {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            const descriptionLines = pdf.splitTextToSize(item.name, contentWidth - 80);
            const rowHeight = Math.max(8, descriptionLines.length * 4.5 + 2);
            ensureSpace(rowHeight);

            pdf.setTextColor(43, 52, 64);
            pdf.text(String(item.quantity), margin, y);
            pdf.text(descriptionLines, margin + 16, y);
            pdf.text(formatCurrency(item.price), pageWidth - margin - 31, y, { align: 'right' });
            pdf.text(formatCurrency(item.price * item.quantity), pageWidth - margin, y, { align: 'right' });
            y += rowHeight;
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 5;
        });

        ensureSpace(28);
        y += 2;
        const summaryRows = [
            ['Subtotal:', lastOrder.subtotal],
            ['IVA (16%):', lastOrder.tax],
            ['Total pagado:', lastOrder.total]
        ];

        summaryRows.forEach(([label, amount], index) => {
            pdf.setFont('helvetica', index === 2 ? 'bold' : 'normal');
            pdf.setFontSize(index === 2 ? 12 : 10);
            pdf.setTextColor(index === 2 ? 13 : 71, index === 2 ? 124 : 85, index === 2 ? 199 : 105);
            pdf.text(label, pageWidth - margin - 60, y);
            pdf.text(formatCurrency(amount), pageWidth - margin, y, { align: 'right' });
            y += index === 2 ? 8 : 6;
        });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text('Gracias por elegir NVENTIA.', margin, pageHeight - 12);

        pdf.save(`comprobante-${lastOrder.orderId}.pdf`);
        showToast('Comprobante descargado', 'El PDF de tu compra ya está listo');
    }

    function finishAndReset() {
        closeCheckoutModal();
        getElement('checkout-form').reset();
    }

    function showToast(title, desc) {
        const toast = getElement('toast-notification');
        getElement('toast-title').textContent = title;
        getElement('toast-desc').textContent = desc;
        toast.classList.remove('translate-y-24', 'opacity-0');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('translate-y-24', 'opacity-0');
        }, 3000);
    }

    function toggleMobileMenu() {
        getElement('mobile-menu').classList.toggle('hidden');
    }

    function switchMockupTab(tab) {
        document.querySelectorAll('.mockup-tab').forEach(button => {
            button.classList.remove('bg-nventia-blue', 'text-white', 'font-semibold');
            button.classList.add('text-slate-300', 'font-medium');
        });

        const activeButton = getElement(`tab-${tab}`);
        activeButton.classList.add('bg-nventia-blue', 'text-white', 'font-semibold');
        activeButton.classList.remove('text-slate-300', 'font-medium');

        const metrics = {
            todos: ['1,420 uds', '$482,900'],
            ti: ['890 uds', '$345,200'],
            fijos: ['530 uds', '$137,700']
        };

        const [metricOne, metricTwo] = metrics[tab];
        getElement('mock-metric-1').textContent = metricOne;
        getElement('mock-metric-2').textContent = metricTwo;
    }

    document.addEventListener('click', (event) => {
        // Un único controlador reconoce las acciones marcadas en la interfaz
        const control = event.target.closest('[data-action]');
        if (!control) return;

        const { action, productId, tab } = control.dataset;
        const actions = {
            'open-cart': () => toggleCart(true),
            'close-cart': () => toggleCart(false),
            'toggle-mobile-menu': toggleMobileMenu,
            'add': () => addToCart(productId),
            'remove': () => removeFromCart(productId),
            'decrease': () => updateQuantity(productId, -1),
            'increase': () => updateQuantity(productId, 1),
            'checkout': openCheckoutModal,
            'close-checkout': closeCheckoutModal,
            'generate-receipt': generateReceipt,
            'finish-reset': finishAndReset,
            'switch-tab': () => switchMockupTab(tab),
            'explore-pricing': () => {
                toggleCart(false);
                getElement('precios').scrollIntoView({ behavior: 'smooth' });
            }
        };

        if (actions[action]) actions[action]();
    });

    document.querySelectorAll('input[name="payment-method"]').forEach(input => {
        input.addEventListener('change', () => {
            togglePaymentFields(input.dataset.paymentMethod);
        });
    });

    const dashboardMockup = getElement('dashboard-mockup');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (dashboardMockup && !prefersReducedMotion) {
        const demoTargets = [
            ...dashboardMockup.querySelectorAll('.mockup-tab'),
            getElement('mock-metric-1').parentElement,
            getElement('mock-metric-2').parentElement,
            ...dashboardMockup.querySelectorAll('#mock-asset-list > div')
        ];
        const cursor = document.createElement('span');
        cursor.className = 'demo-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 2.5L19.5 16l-6.3.5-3.1 5.2L5 2.5Z" fill="#0D7CC7" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
        `;
        dashboardMockup.append(cursor);

        let targetIndex = 0;
        let activeTarget;

        function moveDemoCursor() {
            const target = demoTargets[targetIndex];
            const panelBounds = dashboardMockup.getBoundingClientRect();
            const targetBounds = target.getBoundingClientRect();
            const cursorX = targetBounds.left - panelBounds.left + targetBounds.width * 0.55;
            const cursorY = targetBounds.top - panelBounds.top + targetBounds.height * 0.55;

            if (activeTarget) activeTarget.classList.remove('mockup-demo-highlight');
            activeTarget = target;
            activeTarget.classList.add('mockup-demo-highlight');
            dashboardMockup.style.setProperty('--demo-cursor-x', `${cursorX}px`);
            dashboardMockup.style.setProperty('--demo-cursor-y', `${cursorY}px`);
            dashboardMockup.classList.add('is-demo-running');
            cursor.classList.add('is-clicking');
            setTimeout(() => cursor.classList.remove('is-clicking'), 240);

            if (target.matches('.mockup-tab')) {
                switchMockupTab(target.dataset.tab);
            }

            targetIndex = (targetIndex + 1) % demoTargets.length;
            setTimeout(moveDemoCursor, 1200);
        }

        setTimeout(moveDemoCursor, 700);
    }

    getElement('checkout-form').addEventListener('submit', processOrder);
    getElement('cart-backdrop').addEventListener('click', () => toggleCart(false));
    updateCartUI();
})();

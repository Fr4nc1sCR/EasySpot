/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Other/javascript.js to edit this template
 */
/*
 * =========================================================
 * EASYSPOT AI
 * MÓDULO: HISTORIAL DE RESERVAS
 * =========================================================
 */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* =====================================================
       REFERENCIAS DEL DOM
       ===================================================== */

    const searchInput = document.getElementById("historySearch");
    const clearSearchButton = document.getElementById("clearHistorySearch");

    const filterButtons = Array.from(
            document.querySelectorAll(".history-filter")
            );

    const viewButtons = Array.from(
            document.querySelectorAll(".history-view-button")
            );

    const resultsContainer = document.getElementById("historyResults");

    const historyCards = Array.from(
            document.querySelectorAll(".history-card")
            );

    const visibleResultsCounter = document.getElementById(
            "visibleHistoryCount"
            );

    const noResultsContainer = document.getElementById(
            "historyNoResults"
            );

    const resetFiltersButton = document.getElementById(
            "resetHistoryFilters"
            );

    const alertCloseButtons = Array.from(
            document.querySelectorAll(".history-alert-close")
            );

    const copyCodeButtons = Array.from(
            document.querySelectorAll(".history-code-copy")
            );

    const animatedElements = Array.from(
            document.querySelectorAll("[data-animation]")
            );

    /* =====================================================
       ESTADO
       ===================================================== */

    const STORAGE_KEYS = {
        filter: "easyspot-history-filter",
        view: "easyspot-history-view"
    };

    let currentFilter = "TODAS";
    let currentSearch = "";
    let currentView = "grid";

    /* =====================================================
       UTILIDADES
       ===================================================== */

    /**
     * Convierte el texto a una forma más fácil de comparar.
     * Elimina tildes, espacios extra y convierte a minúsculas.
     */
    function normalizeText(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .trim();
    }

    /**
     * Devuelve true cuando existe un valor almacenado.
     */
    function hasStorageValue(key) {

        try {
            return localStorage.getItem(key) !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtiene un valor de localStorage de forma segura.
     */
    function getStorageValue(key) {

        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn(
                    "No fue posible leer la configuración del historial.",
                    error
                    );

            return null;
        }
    }

    /**
     * Guarda un valor en localStorage de forma segura.
     */
    function setStorageValue(key, value) {

        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn(
                    "No fue posible guardar la configuración del historial.",
                    error
                    );
        }
    }

    /**
     * Escapa caracteres para evitar problemas al generar texto.
     */
    function safeText(value) {
        return value === null || value === undefined
                ? ""
                : String(value);
    }

    /* =====================================================
       ANIMACIONES DE ENTRADA
       ===================================================== */

    function initializeAnimations() {

        if (animatedElements.length === 0) {
            return;
        }

        const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
                ).matches;

        if (
                prefersReducedMotion
                || !("IntersectionObserver" in window)
                ) {

            animatedElements.forEach((element) => {
                element.classList.add("is-visible");
            });

            return;
        }

        const observer = new IntersectionObserver(
                (entries, currentObserver) => {

            entries.forEach((entry) => {

                if (!entry.isIntersecting) {
                    return;
                }

                const element = entry.target;
                const index = Number(element.dataset.index || 0);
                const delay = Math.min(index * 70, 420);

                window.setTimeout(() => {
                    element.classList.add("is-visible");
                }, delay);

                currentObserver.unobserve(element);
            });
        },
                {
                    threshold: 0.12,
                    rootMargin: "0px 0px -40px 0px"
                }
        );

        animatedElements.forEach((element) => {
            observer.observe(element);
        });
    }

    /* =====================================================
       FILTRADO Y BÚSQUEDA
       ===================================================== */

    /**
     * Determina si una tarjeta coincide con el filtro activo.
     */
    function matchesStatus(card) {

        if (currentFilter === "TODAS") {
            return true;
        }

        const cardStatus = safeText(card.dataset.status).toUpperCase();

        return cardStatus === currentFilter;
    }

    /**
     * Determina si una tarjeta coincide con la búsqueda.
     */
    function matchesSearch(card) {

        if (currentSearch === "") {
            return true;
        }

        const searchableValues = [
            card.dataset.parkingName,
            card.dataset.reservationCode,
            card.dataset.address,
            card.textContent
        ];

        const searchableText = normalizeText(
                searchableValues.join(" ")
                );

        return searchableText.includes(currentSearch);
    }

    /**
     * Muestra u oculta cada tarjeta.
     */
    function applyFilters() {

        if (historyCards.length === 0) {
            updateResultsCount(0);
            toggleNoResults(false);
            return;
        }

        let visibleCards = 0;

        historyCards.forEach((card) => {

            const shouldShow =
                    matchesStatus(card)
                    && matchesSearch(card);

            card.hidden = !shouldShow;
            card.classList.toggle("is-hidden", !shouldShow);

            if (shouldShow) {
                visibleCards += 1;
            }
        });

        updateResultsCount(visibleCards);
        toggleNoResults(visibleCards === 0);
    }

    /**
     * Actualiza el contador visible.
     */
    function updateResultsCount(count) {

        if (!visibleResultsCounter) {
            return;
        }

        visibleResultsCounter.textContent = String(count);
    }

    /**
     * Controla el estado de “sin resultados”.
     */
    function toggleNoResults(show) {

        if (!noResultsContainer) {
            return;
        }

        noResultsContainer.hidden = !show;
    }

    /**
     * Cambia el filtro activo.
     */
    function setActiveFilter(filterValue, savePreference = true) {

        const validFilters = [
            "TODAS",
            "COMPLETADA",
            "CANCELADA"
        ];

        currentFilter = validFilters.includes(filterValue)
                ? filterValue
                : "TODAS";

        filterButtons.forEach((button) => {

            const isActive =
                    button.dataset.filter === currentFilter;

            button.classList.toggle("active", isActive);
            button.setAttribute(
                    "aria-pressed",
                    String(isActive)
                    );
        });

        if (savePreference) {
            setStorageValue(
                    STORAGE_KEYS.filter,
                    currentFilter
                    );
        }

        applyFilters();
    }

    /**
     * Actualiza la búsqueda.
     */
    function updateSearch(value) {

        currentSearch = normalizeText(value);

        if (clearSearchButton) {
            clearSearchButton.hidden = currentSearch === "";
        }

        applyFilters();
    }

    /**
     * Limpia la búsqueda.
     */
    function clearSearch() {

        if (searchInput) {
            searchInput.value = "";
            searchInput.focus();
        }

        updateSearch("");
    }

    /**
     * Restablece búsqueda y filtros.
     */
    function resetFilters() {

        if (searchInput) {
            searchInput.value = "";
        }

        currentSearch = "";

        if (clearSearchButton) {
            clearSearchButton.hidden = true;
        }

        setActiveFilter("TODAS");
    }

    /* =====================================================
       CAMBIO DE VISTA
       ===================================================== */

    function setHistoryView(view, savePreference = true) {

        currentView = view === "list"
                ? "list"
                : "grid";

        if (resultsContainer) {
            resultsContainer.classList.toggle(
                    "list-view",
                    currentView === "list"
                    );
        }

        viewButtons.forEach((button) => {

            const isActive =
                    button.dataset.view === currentView;

            button.classList.toggle("active", isActive);
            button.setAttribute(
                    "aria-pressed",
                    String(isActive)
                    );
        });

        if (savePreference) {
            setStorageValue(
                    STORAGE_KEYS.view,
                    currentView
                    );
        }
    }

    /* =====================================================
       COPIAR CÓDIGO DE RESERVA
       ===================================================== */

    async function copyTextToClipboard(text) {

        if (
                navigator.clipboard
                && window.isSecureContext
                ) {

            await navigator.clipboard.writeText(text);
            return;
        }

        const temporaryTextArea = document.createElement(
                "textarea"
                );

        temporaryTextArea.value = text;
        temporaryTextArea.setAttribute("readonly", "");
        temporaryTextArea.style.position = "fixed";
        temporaryTextArea.style.opacity = "0";
        temporaryTextArea.style.pointerEvents = "none";

        document.body.appendChild(temporaryTextArea);

        temporaryTextArea.select();
        temporaryTextArea.setSelectionRange(
                0,
                temporaryTextArea.value.length
                );

        const copied = document.execCommand("copy");

        temporaryTextArea.remove();

        if (!copied) {
            throw new Error(
                    "El navegador no permitió copiar el texto."
                    );
        }
    }

    function showCopySuccess(button) {

        const icon = button.querySelector("i");
        const originalTitle = button.getAttribute("title");

        button.classList.add("copied");
        button.setAttribute("title", "Código copiado");

        if (icon) {
            icon.className = "fa-solid fa-check";
        }

        window.setTimeout(() => {

            button.classList.remove("copied");
            button.setAttribute(
                    "title",
                    originalTitle || "Copiar código"
                    );

            if (icon) {
                icon.className = "fa-regular fa-copy";
            }

        }, 1800);
    }

    function showCopyError() {

        if (typeof Swal !== "undefined") {

            Swal.fire({
                icon: "error",
                title: "No se pudo copiar",
                text: "Copia el código manualmente.",
                confirmButtonText: "Entendido"
            });

            return;
        }

        window.alert(
                "No se pudo copiar el código automáticamente."
                );
    }

    /* =====================================================
       CIERRE DE ALERTAS
       ===================================================== */

    function closeAlert(alertElement) {

        if (!alertElement) {
            return;
        }

        alertElement.style.transition =
                "opacity 220ms ease, transform 220ms ease";

        alertElement.style.opacity = "0";
        alertElement.style.transform = "translateY(-8px)";

        window.setTimeout(() => {
            alertElement.remove();
        }, 230);
    }

    /* =====================================================
       TOAST SIMPLE
       ===================================================== */

    function createToast(message, iconClass = "fa-check") {

        const existingToast = document.querySelector(
                ".history-toast"
                );

        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement("div");

        toast.className = "history-toast";

        toast.innerHTML = `
            <span class="history-toast-icon">
                <i class="fa-solid ${iconClass}"></i>
            </span>

            <span>${message}</span>
        `;

        Object.assign(toast.style, {
            position: "fixed",
            right: "22px",
            bottom: "22px",
            zIndex: "9999",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            maxWidth: "320px",
            padding: "13px 16px",
            border: "1px solid rgba(14, 165, 233, 0.22)",
            borderRadius: "14px",
            background: "rgba(15, 23, 42, 0.94)",
            color: "#ffffff",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.24)",
            backdropFilter: "blur(14px)",
            fontSize: "0.82rem",
            fontWeight: "700",
            opacity: "0",
            transform: "translateY(14px)",
            transition: "opacity 220ms ease, transform 220ms ease"
        });

        document.body.appendChild(toast);

        window.requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";
        });

        window.setTimeout(() => {

            toast.style.opacity = "0";
            toast.style.transform = "translateY(14px)";

            window.setTimeout(() => {
                toast.remove();
            }, 230);

        }, 2200);
    }

    /* =====================================================
       EVENTOS
       ===================================================== */

    function bindSearchEvents() {

        if (searchInput) {

            searchInput.addEventListener("input", (event) => {
                updateSearch(event.target.value);
            });

            searchInput.addEventListener("keydown", (event) => {

                if (event.key === "Escape") {
                    clearSearch();
                }
            });
        }

        if (clearSearchButton) {

            clearSearchButton.addEventListener(
                    "click",
                    clearSearch
                    );
        }

        if (resetFiltersButton) {

            resetFiltersButton.addEventListener(
                    "click",
                    resetFilters
                    );
        }
    }

    function bindFilterEvents() {

        filterButtons.forEach((button) => {

            button.addEventListener("click", () => {

                const selectedFilter =
                        safeText(button.dataset.filter)
                        .toUpperCase();

                setActiveFilter(selectedFilter);
            });
        });
    }

    function bindViewEvents() {

        viewButtons.forEach((button) => {

            button.addEventListener("click", () => {

                const selectedView =
                        button.dataset.view;

                setHistoryView(selectedView);
            });
        });
    }

    function bindAlertEvents() {

        alertCloseButtons.forEach((button) => {

            button.addEventListener("click", () => {

                const alertElement =
                        button.closest(".history-alert");

                closeAlert(alertElement);
            });
        });
    }

    function bindCopyEvents() {

        copyCodeButtons.forEach((button) => {

            button.addEventListener("click", async () => {

                const code = safeText(
                        button.dataset.code
                        ).trim();

                if (code === "") {
                    showCopyError();
                    return;
                }

                try {

                    await copyTextToClipboard(code);
                    showCopySuccess(button);
                    createToast(
                            `Código ${code} copiado`
                            );

                } catch (error) {

                    console.error(
                            "Error al copiar el código:",
                            error
                            );

                    showCopyError();
                }
            });
        });
    }

    /* =====================================================
       PARÁMETROS DE URL
       ===================================================== */

    function processUrlParameters() {

        const parameters = new URLSearchParams(
                window.location.search
                );

        const filterParameter = safeText(
                parameters.get("estado")
                ).toUpperCase();

        if (
                filterParameter === "COMPLETADA"
                || filterParameter === "CANCELADA"
                || filterParameter === "TODAS"
                ) {

            setActiveFilter(
                    filterParameter,
                    false
                    );
        }

        const searchParameter = parameters.get("buscar");

        if (
                searchParameter
                && searchInput
                ) {

            searchInput.value = searchParameter;
            updateSearch(searchParameter);
        }
    }

    /* =====================================================
       RESTAURAR PREFERENCIAS
       ===================================================== */

    function restorePreferences() {

        const savedFilter = hasStorageValue(
                STORAGE_KEYS.filter
                )
                ? getStorageValue(STORAGE_KEYS.filter)
                : "TODAS";

        const savedView = hasStorageValue(
                STORAGE_KEYS.view
                )
                ? getStorageValue(STORAGE_KEYS.view)
                : "grid";

        setActiveFilter(
                savedFilter || "TODAS",
                false
                );

        setHistoryView(
                savedView || "grid",
                false
                );
    }

    /* =====================================================
       INICIALIZACIÓN
       ===================================================== */

    function initializeHistoryModule() {

        bindSearchEvents();
        bindFilterEvents();
        bindViewEvents();
        bindAlertEvents();
        bindCopyEvents();

        restorePreferences();
        processUrlParameters();
        initializeAnimations();
        applyFilters();
    }

    initializeHistoryModule();
});
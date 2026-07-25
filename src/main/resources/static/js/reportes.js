/*
 * ============================================================================
 * EASYSPOT AI — REPORTES COMUNITARIOS
 * JavaScript reconstruido desde cero para reportes.html
 * ============================================================================
 */

(() => {
    "use strict";

    /* =========================================================================
       1. CONFIGURACIÓN
       ========================================================================= */

    const CONFIG = {
        maxImageSize: 5 * 1024 * 1024,
        allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
        storageKeys: {
            view: "easyspot-reports-view",
            sort: "easyspot-reports-sort"
        },
        voteEndpoint: reportId =>
            `/reportes/${encodeURIComponent(reportId)}/votar`,
        priorities: {
            ACCIDENTE: {
                label: "Crítica",
                value: "CRITICA"
            },
            SEGURIDAD: {
                label: "Alta",
                value: "ALTA"
            },
            ESPACIO_BLOQUEADO: {
                label: "Alta",
                value: "ALTA"
            },
            PARQUEO_LLENO: {
                label: "Media",
                value: "MEDIA"
            },
            OBRAS: {
                label: "Media",
                value: "MEDIA"
            },
            TRAFICO: {
                label: "Media",
                value: "MEDIA"
            },
            OTRO: {
                label: "Baja",
                value: "BAJA"
            }
        },
        priorityWeight: {
            CRITICA: 4,
            ALTA: 3,
            MEDIA: 2,
            BAJA: 1
        }
    };

    /* =========================================================================
       2. UTILIDADES
       ========================================================================= */

    const $ = (selector, context = document) =>
        context.querySelector(selector);

    const $$ = (selector, context = document) =>
        [...context.querySelectorAll(selector)];

    const normalize = value =>
        String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase();

    const parseNumber = (value, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const clamp = (value, minimum, maximum) =>
        Math.min(Math.max(value, minimum), maximum);

    const escapeHtml = value => {
        const element = document.createElement("div");
        element.textContent = String(value ?? "");
        return element.innerHTML;
    };

    const formatBytes = bytes => {
        if (!Number.isFinite(bytes) || bytes <= 0) {
            return "0 KB";
        }

        if (bytes < 1024 * 1024) {
            return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const getCsrf = () => {
        const token =
            $('meta[name="_csrf"]')?.content ??
            $('input[name="_csrf"]')?.value ??
            "";

        const header =
            $('meta[name="_csrf_header"]')?.content ??
            "X-CSRF-TOKEN";

        return { token, header };
    };

    const isTypingElement = element => {
        const tag = element?.tagName?.toLowerCase();

        return (
            tag === "input" ||
            tag === "textarea" ||
            tag === "select" ||
            element?.isContentEditable
        );
    };

    /* =========================================================================
       3. TOASTS
       ========================================================================= */

    const Toast = {
        container: null,

        ensureContainer() {
            if (this.container?.isConnected) {
                return this.container;
            }

            this.container =
                $("#reportsToastContainer") ??
                document.createElement("div");

            if (!this.container.id) {
                this.container.id = "reportsToastContainer";
                this.container.className = "reports-toast-container";
                this.container.setAttribute("aria-live", "polite");
                document.body.appendChild(this.container);
            }

            return this.container;
        },

        show(message, type = "info", title = "") {
            const icons = {
                success: "fa-solid fa-circle-check",
                error: "fa-solid fa-circle-exclamation",
                warning: "fa-solid fa-triangle-exclamation",
                info: "fa-solid fa-circle-info"
            };

            const titles = {
                success: "Operación realizada",
                error: "Ocurrió un problema",
                warning: "Atención",
                info: "EasySpot AI"
            };

            const toast = document.createElement("article");
            toast.className = `reports-toast reports-toast-${type}`;
            toast.setAttribute(
                "role",
                type === "error" ? "alert" : "status"
            );

            toast.innerHTML = `
                <span class="reports-toast-icon">
                    <i class="${icons[type] ?? icons.info}"></i>
                </span>

                <div class="reports-toast-content">
                    <strong>${escapeHtml(title || titles[type] || titles.info)}</strong>
                    <p>${escapeHtml(message)}</p>
                </div>

                <button
                    type="button"
                    class="reports-toast-close"
                    aria-label="Cerrar notificación"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            this.ensureContainer().appendChild(toast);

            const remove = () => {
                toast.style.opacity = "0";
                toast.style.transform = "translateY(-8px)";

                window.setTimeout(() => {
                    toast.remove();
                }, 220);
            };

            $(".reports-toast-close", toast)?.addEventListener(
                "click",
                remove
            );

            window.setTimeout(remove, 4200);
        }
    };

    /* =========================================================================
       4. MODAL DE CREACIÓN
       ========================================================================= */

    const ReportModal = {
        modal: null,
        form: null,
        previouslyFocused: null,

        init() {
            this.modal = $("#reportModal");
            this.form = $("#reportForm");

            if (!this.modal) {
                return;
            }

            $("#openReportModal")?.addEventListener(
                "click",
                () => this.open()
            );

            $$("[data-open-report-modal]").forEach(button => {
                button.addEventListener("click", () => this.open());
            });

            $$("[data-close-report-modal]", this.modal).forEach(
                element => {
                    element.addEventListener(
                        "click",
                        () => this.close()
                    );
                }
            );

            document.addEventListener("keydown", event => {
                if (
                    event.key === "Escape" &&
                    this.isOpen()
                ) {
                    this.close();
                }
            });
        },

        isOpen() {
            return (
                this.modal?.classList.contains("active") ||
                this.modal?.classList.contains("is-open")
            );
        },

        open() {
            if (!this.modal) {
                return;
            }

            this.previouslyFocused = document.activeElement;

            this.modal.classList.add("active", "is-open");
            this.modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("report-modal-open");

            window.setTimeout(() => {
                $('input[name="tipo"]', this.modal)?.focus();
            }, 180);
        },

        close() {
            if (!this.modal) {
                return;
            }

            this.modal.classList.remove("active", "is-open");
            this.modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("report-modal-open");

            this.previouslyFocused?.focus?.();
        }
    };

    /* =========================================================================
       5. FORMULARIO
       ========================================================================= */

    const ReportForm = {
        form: null,
        title: null,
        description: null,
        location: null,
        parking: null,
        imageInput: null,
        imageObjectUrl: null,

        init() {
            this.form = $("#reportForm");

            if (!this.form) {
                return;
            }

            this.title = $("#reportTitle");
            this.description = $("#reportDescription");
            this.location = $("#reportLocation");
            this.parking = $("#reportParking");
            this.imageInput = $("#reportImage");

            this.initCounters();
            this.initPriority();
            this.initProgress();
            this.initGeolocation();
            this.initImageUpload();
            this.initSubmission();

            this.updateProgress();
        },

        initCounters() {
            const pairs = [
                [this.title, $("#reportTitleCounter")],
                [
                    this.description,
                    $("#reportDescriptionCounter")
                ]
            ];

            pairs.forEach(([field, counter]) => {
                if (!field || !counter) {
                    return;
                }

                const update = () => {
                    counter.textContent = String(field.value.length);
                };

                field.addEventListener("input", update);
                update();
            });
        },

        initPriority() {
            $$('input[name="tipo"]', this.form).forEach(input => {
                input.addEventListener("change", () => {
                    this.updatePriority(input.value);
                    this.updateProgress();
                });
            });
        },

        updatePriority(type) {
            const priority =
                CONFIG.priorities[type] ?? {
                    label: "Pendiente",
                    value: ""
                };

            const text = $("#suggestedPriorityText");
            const badge = $("#suggestedPriorityBadge");
            const container = $("#reportAutoPriority");

            if (text) {
                text.textContent =
                    priority.value
                        ? `Prioridad ${priority.label.toLowerCase()}`
                        : "Selecciona una categoría";
            }

            if (badge) {
                badge.textContent = priority.label;
                badge.dataset.priority = priority.value;
            }

            if (container) {
                container.dataset.priority = priority.value;
            }
        },

        initProgress() {
            const monitoredFields = [
                ...$$('input[name="tipo"]', this.form),
                this.title,
                this.description,
                this.location,
                this.parking,
                this.imageInput
            ].filter(Boolean);

            monitoredFields.forEach(field => {
                field.addEventListener(
                    field.type === "file" ? "change" : "input",
                    () => this.updateProgress()
                );

                field.addEventListener(
                    "change",
                    () => this.updateProgress()
                );
            });
        },

        updateProgress() {
            const typeSelected = Boolean(
                $('input[name="tipo"]:checked', this.form)
            );

            const checks = [
                typeSelected,
                Boolean(this.title?.value.trim()),
                Boolean(this.description?.value.trim()),
                Boolean(
                    this.location?.value.trim() ||
                    this.parking?.value
                ),
                Boolean(this.imageInput?.files?.length)
            ];

            const weights = [25, 20, 25, 25, 5];

            const progress = checks.reduce(
                (total, completed, index) =>
                    total + (completed ? weights[index] : 0),
                0
            );

            const value = $("#reportFormProgressValue");
            const bar = $("#reportFormProgressBar");

            if (value) {
                value.textContent = `${progress}%`;
            }

            if (bar) {
                bar.style.width = `${progress}%`;
            }
        },

        initGeolocation() {
            const button = $("#useCurrentLocation");

            button?.addEventListener("click", () => {
                this.useCurrentLocation(button);
            });
        },

        useCurrentLocation(button) {
            const status = $("#reportLocationStatus");
            const latitude = $("#reportLatitude");
            const longitude = $("#reportLongitude");

            if (!navigator.geolocation) {
                Toast.show(
                    "Tu navegador no permite obtener la ubicación.",
                    "error",
                    "Ubicación no disponible"
                );
                return;
            }

            const originalHtml = button.innerHTML;

            button.disabled = true;
            button.innerHTML = `
                <span>
                    <i class="fa-solid fa-spinner fa-spin"></i>
                </span>
                <div>
                    <strong>Obteniendo ubicación...</strong>
                    <small>Espera unos segundos.</small>
                </div>
            `;

            navigator.geolocation.getCurrentPosition(
                position => {
                    const lat =
                        position.coords.latitude.toFixed(7);

                    const lng =
                        position.coords.longitude.toFixed(7);

                    if (latitude) {
                        latitude.value = lat;
                    }

                    if (longitude) {
                        longitude.value = lng;
                    }

                    if (
                        this.location &&
                        !this.location.value.trim()
                    ) {
                        this.location.value =
                            `Coordenadas: ${lat}, ${lng}`;
                    }

                    if (status) {
                        status.hidden = false;

                        const text = $("span", status);

                        if (text) {
                            text.textContent =
                                "Ubicación obtenida correctamente";
                        }
                    }

                    button.disabled = false;
                    button.innerHTML = originalHtml;

                    this.updateProgress();

                    Toast.show(
                        "Las coordenadas se agregaron al reporte.",
                        "success",
                        "Ubicación obtenida"
                    );
                },
                error => {
                    const messages = {
                        1: "Debes permitir el acceso a tu ubicación.",
                        2: "No fue posible determinar tu ubicación.",
                        3: "La solicitud de ubicación tardó demasiado."
                    };

                    button.disabled = false;
                    button.innerHTML = originalHtml;

                    Toast.show(
                        messages[error.code] ??
                        "No fue posible obtener la ubicación.",
                        "error",
                        "Error de geolocalización"
                    );
                },
                {
                    enableHighAccuracy: true,
                    timeout: 12000,
                    maximumAge: 60000
                }
            );
        },

        initImageUpload() {
            const area = $("#reportUploadArea");
            const removeButton = $("#removeReportImage");

            this.imageInput?.addEventListener(
                "change",
                () => {
                    const file =
                        this.imageInput.files?.[0] ?? null;

                    this.processImage(file);
                }
            );

            removeButton?.addEventListener(
                "click",
                () => this.removeImage()
            );

            if (!area) {
                return;
            }

            ["dragenter", "dragover"].forEach(eventName => {
                area.addEventListener(eventName, event => {
                    event.preventDefault();
                    area.classList.add("is-dragging");
                });
            });

            ["dragleave", "drop"].forEach(eventName => {
                area.addEventListener(eventName, event => {
                    event.preventDefault();
                    area.classList.remove("is-dragging");
                });
            });

            area.addEventListener("drop", event => {
                const file =
                    event.dataTransfer?.files?.[0] ?? null;

                if (!file || !this.imageInput) {
                    return;
                }

                const transfer = new DataTransfer();
                transfer.items.add(file);
                this.imageInput.files = transfer.files;

                this.processImage(file);
            });
        },

        processImage(file) {
            if (!file) {
                this.removeImage();
                return;
            }

            if (!CONFIG.allowedImageTypes.includes(file.type)) {
                Toast.show(
                    "Solo se permiten imágenes PNG, JPG o WEBP.",
                    "error",
                    "Formato no permitido"
                );

                this.removeImage();
                return;
            }

            if (file.size > CONFIG.maxImageSize) {
                Toast.show(
                    "La imagen supera el límite máximo de 5 MB.",
                    "error",
                    "Archivo demasiado grande"
                );

                this.removeImage();
                return;
            }

            if (this.imageObjectUrl) {
                URL.revokeObjectURL(this.imageObjectUrl);
            }

            this.imageObjectUrl = URL.createObjectURL(file);

            const preview = $("#reportImagePreview");
            const image = $("#reportImagePreviewElement");
            const name = $("#reportImageName");
            const size = $("#reportImageSize");

            if (image) {
                image.src = this.imageObjectUrl;
            }

            if (name) {
                name.textContent = file.name;
            }

            if (size) {
                size.textContent = formatBytes(file.size);
            }

            if (preview) {
                preview.hidden = false;
            }

            this.updateProgress();
        },

        removeImage() {
            if (this.imageInput) {
                this.imageInput.value = "";
            }

            if (this.imageObjectUrl) {
                URL.revokeObjectURL(this.imageObjectUrl);
                this.imageObjectUrl = null;
            }

            const preview = $("#reportImagePreview");
            const image = $("#reportImagePreviewElement");

            if (preview) {
                preview.hidden = true;
            }

            if (image) {
                image.removeAttribute("src");
            }

            this.updateProgress();
        },

        initSubmission() {
            this.form.addEventListener("submit", event => {
                const selectedType =
                    $('input[name="tipo"]:checked', this.form);

                if (!selectedType) {
                    event.preventDefault();

                    Toast.show(
                        "Selecciona una categoría para continuar.",
                        "warning",
                        "Categoría requerida"
                    );

                    $('input[name="tipo"]', this.form)?.focus();
                    return;
                }

                if (!this.form.checkValidity()) {
                    event.preventDefault();
                    this.form.reportValidity();
                    return;
                }

                const submit = $("#submitReportButton");

                if (submit) {
                    submit.disabled = true;
                    submit.innerHTML = `
                        <span>
                            <i class="fa-solid fa-spinner fa-spin"></i>
                            Publicando reporte
                        </span>
                    `;
                }
            });
        }
    };

    /* =========================================================================
       6. BÚSQUEDA, FILTROS, ORDEN Y VISTA
       ========================================================================= */

    const ReportsBrowser = {
        container: null,
        cards: [],
        searchInput: null,
        activeFilter: "TODOS",
        sortValue: "RECIENTES",

        init() {
            this.container = $("#reportsResults");
            this.cards = $$(".report-card", this.container ?? document);
            this.searchInput = $("#reportsSearch");

            this.initSearch();
            this.initFilters();
            this.initSort();
            this.initView();
            this.initReset();
            this.assignCardIds();
            this.apply();
        },

        initSearch() {
            const clearButton = $("#clearReportsSearch");

            this.searchInput?.addEventListener("input", () => {
                if (clearButton) {
                    clearButton.hidden =
                        !this.searchInput.value.trim();
                }

                this.apply();
            });

            clearButton?.addEventListener("click", () => {
                if (!this.searchInput) {
                    return;
                }

                this.searchInput.value = "";
                clearButton.hidden = true;
                this.searchInput.focus();
                this.apply();
            });
        },

        initFilters() {
            $$(".reports-filter").forEach(button => {
                button.addEventListener("click", () => {
                    this.activeFilter =
                        button.dataset.filter ?? "TODOS";

                    $$(".reports-filter").forEach(item => {
                        const active = item === button;
                        item.classList.toggle("active", active);
                        item.setAttribute(
                            "aria-pressed",
                            String(active)
                        );
                    });

                    this.apply();
                });
            });
        },

        initSort() {
            const select = $("#reportsSort");
            const stored =
                localStorage.getItem(CONFIG.storageKeys.sort);

            if (
                select &&
                stored &&
                [...select.options].some(
                    option => option.value === stored
                )
            ) {
                select.value = stored;
            }

            this.sortValue = select?.value ?? "RECIENTES";

            select?.addEventListener("change", () => {
                this.sortValue = select.value;

                localStorage.setItem(
                    CONFIG.storageKeys.sort,
                    this.sortValue
                );

                this.apply();
            });
        },

        initView() {
            const buttons = $$(".reports-view-button");
            const stored =
                localStorage.getItem(CONFIG.storageKeys.view) ??
                "grid";

            this.setView(stored);

            buttons.forEach(button => {
                button.addEventListener("click", () => {
                    this.setView(button.dataset.view ?? "grid");
                });
            });
        },

        setView(view) {
            const normalizedView =
                view === "list" ? "list" : "grid";

            this.container?.classList.toggle(
                "reports-list-view",
                normalizedView === "list"
            );

            $$(".reports-view-button").forEach(button => {
                const active =
                    button.dataset.view === normalizedView;

                button.classList.toggle("active", active);
                button.setAttribute(
                    "aria-pressed",
                    String(active)
                );
            });

            localStorage.setItem(
                CONFIG.storageKeys.view,
                normalizedView
            );
        },

        initReset() {
            $("#resetReportsFilters")?.addEventListener(
                "click",
                () => this.reset()
            );
        },

        reset() {
            this.activeFilter = "TODOS";

            if (this.searchInput) {
                this.searchInput.value = "";
            }

            $("#clearReportsSearch")?.setAttribute("hidden", "");

            const allButton =
                $('.reports-filter[data-filter="TODOS"]');

            $$(".reports-filter").forEach(button => {
                const active = button === allButton;
                button.classList.toggle("active", active);
                button.setAttribute(
                    "aria-pressed",
                    String(active)
                );
            });

            const sort = $("#reportsSort");

            if (sort) {
                sort.value = "RECIENTES";
                this.sortValue = "RECIENTES";
            }

            this.apply();
        },

        assignCardIds() {
            this.cards.forEach(card => {
                const id = card.dataset.id;

                if (id) {
                    card.id = `reporte-${id}`;
                }
            });
        },

        cardSearchText(card) {
            return normalize(
                [
                    card.dataset.title,
                    card.dataset.location,
                    $(".report-description", card)?.textContent,
                    $(".report-location strong", card)?.textContent,
                    $(".report-location small", card)?.textContent,
                    $(".report-type-badge", card)?.textContent
                ].join(" ")
            );
        },

        matches(card) {
            const query = normalize(this.searchInput?.value);
            const type = normalize(card.dataset.type);

            const matchesQuery =
                !query ||
                this.cardSearchText(card).includes(query);

            const matchesFilter =
                this.activeFilter === "TODOS" ||
                type === normalize(this.activeFilter);

            return matchesQuery && matchesFilter;
        },

        cardDate(card) {
            const raw =
                $(".relative-time", card)?.dataset.date ?? "";

            const date = new Date(raw);

            return Number.isNaN(date.getTime())
                ? 0
                : date.getTime();
        },

        cardScore(card) {
            return (
                parseNumber(card.dataset.positiveVotes) -
                parseNumber(card.dataset.negativeVotes)
            );
        },

        cardConfidence(card) {
            return parseNumber(
                $(".report-confidence-value", card)
                    ?.textContent
                    ?.replace("%", ""),
                0
            );
        },

        sortCards(cards) {
            const sorted = [...cards];

            sorted.sort((a, b) => {
                switch (this.sortValue) {
                    case "PRIORIDAD":
                        return (
                            (CONFIG.priorityWeight[
                                normalize(b.dataset.priority)
                            ] ?? 0) -
                            (CONFIG.priorityWeight[
                                normalize(a.dataset.priority)
                            ] ?? 0)
                        );

                    case "VOTOS":
                        return this.cardScore(b) - this.cardScore(a);

                    case "CONFIANZA":
                        return (
                            this.cardConfidence(b) -
                            this.cardConfidence(a)
                        );

                    case "RECIENTES":
                    default:
                        return this.cardDate(b) - this.cardDate(a);
                }
            });

            return sorted;
        },

        apply() {
            if (!this.container) {
                this.updateCounter(0);
                return;
            }

            const visible = this.cards.filter(card =>
                this.matches(card)
            );

            const ordered = this.sortCards(visible);

            this.cards.forEach(card => {
                card.hidden = true;
            });

            ordered.forEach(card => {
                card.hidden = false;
                this.container.appendChild(card);
            });

            const noResults = $("#reportsNoResults");

            if (noResults) {
                noResults.hidden = visible.length > 0;
            }

            this.updateCounter(visible.length);
        },

        updateCounter(value) {
            const counter = $("#visibleReportsCount");

            if (counter) {
                counter.textContent = String(value);
            }
        }
    };

    /* =========================================================================
       7. FECHAS RELATIVAS
       ========================================================================= */

    const RelativeTime = {
        formatter: new Intl.RelativeTimeFormat("es", {
            numeric: "auto"
        }),

        init() {
            this.updateAll();

            window.setInterval(
                () => this.updateAll(),
                60000
            );
        },

        updateAll() {
            $$(".relative-time").forEach(element => {
                const date = new Date(element.dataset.date);

                if (Number.isNaN(date.getTime())) {
                    return;
                }

                element.textContent = this.format(date);
                element.title = new Intl.DateTimeFormat(
                    "es-CR",
                    {
                        dateStyle: "medium",
                        timeStyle: "short"
                    }
                ).format(date);
            });
        },

        format(date) {
            const seconds = Math.round(
                (date.getTime() - Date.now()) / 1000
            );

            const ranges = [
                ["year", 31536000],
                ["month", 2592000],
                ["week", 604800],
                ["day", 86400],
                ["hour", 3600],
                ["minute", 60],
                ["second", 1]
            ];

            const [unit, divisor] =
                ranges.find(
                    ([, secondsPerUnit]) =>
                        Math.abs(seconds) >= secondsPerUnit
                ) ?? ["second", 1];

            return this.formatter.format(
                Math.round(seconds / divisor),
                unit
            );
        }
    };

    /* =========================================================================
       8. VOTACIÓN
       ========================================================================= */

    const Voting = {
        pending: new Set(),

        init() {
            document.addEventListener("click", event => {
                const button = event.target.closest(
                    ".report-vote-button"
                );

                if (!button) {
                    return;
                }

                event.preventDefault();
                this.vote(button);
            });
        },

        async vote(button) {
            const reportId = button.dataset.reportId;
            const voteType = button.dataset.vote;

            if (
                !reportId ||
                !["positive", "negative"].includes(voteType) ||
                this.pending.has(reportId)
            ) {
                return;
            }

            const card = button.closest(".report-card");

            if (!card) {
                return;
            }

            this.pending.add(reportId);
            this.setLoading(card, true);

            try {
                const data = await this.request(
                    reportId,
                    voteType
                );

                this.updateCard(card, data, voteType);

                Toast.show(
                    "Tu validación fue registrada correctamente.",
                    "success",
                    "Reporte actualizado"
                );

                ReportsBrowser.apply();
            } catch (error) {
                console.error(error);

                Toast.show(
                    error.message ||
                    "No fue posible registrar el voto.",
                    "error",
                    "Error al votar"
                );
            } finally {
                this.pending.delete(reportId);
                this.setLoading(card, false);
            }
        },

        async request(reportId, voteType) {
            const csrf = getCsrf();
            const headers = {
                "Content-Type":
                    "application/x-www-form-urlencoded;charset=UTF-8",
                Accept: "application/json"
            };

            if (csrf.token) {
                headers[csrf.header] = csrf.token;
            }

            const body = new URLSearchParams({
                tipoVoto:
                    voteType === "positive"
                        ? "POSITIVO"
                        : "NEGATIVO"
            });

            const response = await fetch(
                CONFIG.voteEndpoint(reportId),
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers,
                    body: body.toString()
                }
            );

            if (response.status === 401) {
                throw new Error(
                    "Debes iniciar sesión para votar."
                );
            }

            if (response.status === 403) {
                throw new Error(
                    "Tu sesión expiró o no tienes permiso."
                );
            }

            if (!response.ok) {
                const text = await response.text();

                throw new Error(
                    text.trim() ||
                    "No fue posible actualizar el reporte."
                );
            }

            const contentType =
                response.headers.get("content-type") ?? "";

            return contentType.includes("application/json")
                ? response.json()
                : {};
        },

        updateCard(card, data, requestedVote) {
            let positive =
                data.votosPositivos ??
                data.positiveVotes ??
                data.positivos;

            let negative =
                data.votosNegativos ??
                data.negativeVotes ??
                data.negativos;

            const currentPositive =
                parseNumber(card.dataset.positiveVotes);

            const currentNegative =
                parseNumber(card.dataset.negativeVotes);

            const activeButton = $(
                ".report-vote-button.active",
                card
            );

            const previousVote =
                activeButton?.dataset.vote ?? "";

            let resultingVote =
                data.votoUsuario ??
                data.userVote ??
                data.tipoVoto ??
                "";

            if (
                positive === undefined ||
                negative === undefined
            ) {
                positive = currentPositive;
                negative = currentNegative;

                if (previousVote === requestedVote) {
                    if (requestedVote === "positive") {
                        positive--;
                    } else {
                        negative--;
                    }

                    resultingVote = "";
                } else if (!previousVote) {
                    if (requestedVote === "positive") {
                        positive++;
                    } else {
                        negative++;
                    }

                    resultingVote = requestedVote;
                } else {
                    if (previousVote === "positive") {
                        positive--;
                        negative++;
                    } else {
                        negative--;
                        positive++;
                    }

                    resultingVote = requestedVote;
                }
            }

            positive = Math.max(parseNumber(positive), 0);
            negative = Math.max(parseNumber(negative), 0);

            resultingVote = normalize(resultingVote);

            if (resultingVote === "POSITIVO") {
                resultingVote = "positive";
            } else if (resultingVote === "NEGATIVO") {
                resultingVote = "negative";
            } else if (
                !["positive", "negative"].includes(
                    resultingVote
                )
            ) {
                resultingVote =
                    previousVote === requestedVote
                        ? ""
                        : requestedVote;
            }

            card.dataset.positiveVotes = String(positive);
            card.dataset.negativeVotes = String(negative);

            const score = $(".report-vote-score", card);

            if (score) {
                score.textContent = String(
                    positive - negative
                );
            }

            $$(".report-vote-button", card).forEach(
                voteButton => {
                    const active =
                        voteButton.dataset.vote ===
                        resultingVote;

                    voteButton.classList.toggle(
                        "active",
                        active
                    );

                    voteButton.setAttribute(
                        "aria-pressed",
                        String(active)
                    );
                }
            );

            const total = positive + negative;
            const confidence =
                total === 0
                    ? 50
                    : Math.round(
                        (positive * 100) / total
                    );

            const value = $(
                ".report-confidence-value",
                card
            );

            const progress = $(
                ".report-confidence-progress",
                card
            );

            if (value) {
                value.textContent = `${confidence}%`;
            }

            if (progress) {
                progress.style.width = `${confidence}%`;
            }
        },

        setLoading(card, loading) {
            $$(".report-vote-button", card).forEach(button => {
                button.disabled = loading;
            });
        }
    };

    /* =========================================================================
       9. COMPARTIR Y MENÚ CONTEXTUAL
       ========================================================================= */

    const ReportActions = {
        menu: null,
        trigger: null,

        init() {
            document.addEventListener("click", event => {
                const share = event.target.closest(
                    ".report-action-share"
                );

                if (share) {
                    event.preventDefault();
                    this.share(share);
                    return;
                }

                const menuButton = event.target.closest(
                    ".report-action-menu"
                );

                if (menuButton) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.toggleMenu(menuButton);
                    return;
                }

                const action = event.target.closest(
                    ".report-context-menu [data-action]"
                );

                if (action) {
                    event.preventDefault();
                    this.handleMenuAction(action);
                    return;
                }

                if (
                    this.menu &&
                    !event.target.closest(
                        ".report-context-menu"
                    )
                ) {
                    this.closeMenu();
                }
            });

            window.addEventListener(
                "resize",
                () => this.closeMenu()
            );

            window.addEventListener(
                "scroll",
                () => this.closeMenu(),
                { passive: true }
            );
        },

        getShareData(button) {
            const card = button.closest(".report-card");
            const reportId =
                button.dataset.reportId ??
                card?.dataset.id ??
                "";

            const title =
                button.dataset.title ??
                card?.dataset.title ??
                $("h3", card)?.textContent?.trim() ??
                "Reporte comunitario";

            const url = new URL(window.location.href);
            url.hash = `reporte-${reportId}`;

            return {
                title: `${title} | EasySpot AI`,
                text:
                    "Consulta este reporte comunitario en EasySpot AI.",
                url: url.toString()
            };
        },

        async share(button) {
            const data = this.getShareData(button);

            try {
                if (navigator.share) {
                    await navigator.share(data);
                    return;
                }

                await navigator.clipboard.writeText(data.url);

                Toast.show(
                    "El enlace del reporte fue copiado.",
                    "success",
                    "Enlace copiado"
                );
            } catch (error) {
                if (error?.name === "AbortError") {
                    return;
                }

                Toast.show(
                    "No fue posible compartir el reporte.",
                    "error",
                    "Error al compartir"
                );
            }
        },

        toggleMenu(button) {
            if (this.trigger === button) {
                this.closeMenu();
                return;
            }

            this.closeMenu();
            this.openMenu(button);
        },

        openMenu(button) {
            const card = button.closest(".report-card");
            const reportId =
                button.dataset.reportId ??
                card?.dataset.id ??
                "";

            const menu = document.createElement("div");
            menu.className = "report-context-menu";
            menu.dataset.reportId = reportId;

            menu.innerHTML = `
                <button type="button" data-action="copy">
                    <span>
                        <i class="fa-regular fa-copy"></i>
                    </span>
                    <div>
                        <strong>Copiar enlace</strong>
                        <small>Comparte este reporte</small>
                    </div>
                </button>

                <button type="button" data-action="details">
                    <span>
                        <i class="fa-solid fa-circle-info"></i>
                    </span>
                    <div>
                        <strong>Ver información</strong>
                        <small>Resumen del reporte</small>
                    </div>
                </button>

                <button type="button" data-action="flag">
                    <span>
                        <i class="fa-regular fa-flag"></i>
                    </span>
                    <div>
                        <strong>Reportar contenido</strong>
                        <small>Informar un posible problema</small>
                    </div>
                </button>
            `;

            document.body.appendChild(menu);

            const rect = button.getBoundingClientRect();
            const width = 260;
            const padding = 12;

            const left = clamp(
                rect.right - width,
                padding,
                window.innerWidth - width - padding
            );

            menu.style.left = `${left}px`;
            menu.style.top = `${rect.bottom + 8}px`;

            const menuRect = menu.getBoundingClientRect();

            if (
                menuRect.bottom >
                window.innerHeight - padding
            ) {
                menu.style.top =
                    `${Math.max(
                        padding,
                        rect.top - menuRect.height - 8
                    )}px`;
            }

            this.menu = menu;
            this.trigger = button;
            button.setAttribute("aria-expanded", "true");
        },

        closeMenu() {
            this.trigger?.setAttribute(
                "aria-expanded",
                "false"
            );

            this.menu?.remove();
            this.menu = null;
            this.trigger = null;
        },

        async handleMenuAction(button) {
            const action = button.dataset.action;
            const reportId =
                button.closest(".report-context-menu")
                    ?.dataset.reportId;

            const card = reportId
                ? $(`.report-card[data-id="${CSS.escape(reportId)}"]`)
                : null;

            if (action === "copy") {
                const url = new URL(window.location.href);
                url.hash = `reporte-${reportId}`;

                try {
                    await navigator.clipboard.writeText(
                        url.toString()
                    );

                    Toast.show(
                        "El enlace fue copiado.",
                        "success",
                        "Enlace copiado"
                    );
                } catch {
                    Toast.show(
                        "No fue posible copiar el enlace.",
                        "error"
                    );
                }
            }

            if (action === "details" && card) {
                const title =
                    card.dataset.title ??
                    $("h3", card)?.textContent ??
                    "Reporte comunitario";

                const location =
                    card.dataset.location ??
                    $(".report-location small", card)
                        ?.textContent ??
                    "Ubicación no disponible";

                Toast.show(
                    `${title} · ${location}`,
                    "info",
                    `Reporte #${reportId}`
                );
            }

            if (action === "flag") {
                Toast.show(
                    "La función de moderación se habilitará próximamente.",
                    "info",
                    "Reportar contenido"
                );
            }

            this.closeMenu();
        }
    };

    /* =========================================================================
       10. VISOR DE IMÁGENES
       ========================================================================= */

    const ImageViewer = {
        viewer: null,
        image: null,
        trigger: null,

        init() {
            this.viewer = $("#reportImageViewer");
            this.image = $("#reportImageViewerElement");

            if (!this.viewer || !this.image) {
                return;
            }

            document.addEventListener("click", event => {
                const trigger = event.target.closest(
                    ".report-image-open"
                );

                if (!trigger) {
                    return;
                }

                event.preventDefault();
                this.open(trigger);
            });

            $$("[data-close-image-viewer]", this.viewer)
                .forEach(element => {
                    element.addEventListener(
                        "click",
                        event => {
                            if (
                                element.classList.contains(
                                    "report-image-viewer-backdrop"
                                ) &&
                                event.target !== element
                            ) {
                                return;
                            }

                            this.close();
                        }
                    );
                });

            document.addEventListener("keydown", event => {
                if (
                    event.key === "Escape" &&
                    this.isOpen()
                ) {
                    this.close();
                }
            });
        },

        isOpen() {
            return (
                this.viewer?.classList.contains("active") ||
                this.viewer?.classList.contains("is-open")
            );
        },

        open(trigger) {
            const source = trigger.dataset.image;

            if (!source || !this.viewer || !this.image) {
                return;
            }

            this.trigger = trigger;
            this.image.src = source;

            const card = trigger.closest(".report-card");
            const title =
                card?.dataset.title ??
                $("h3", card)?.textContent ??
                "Evidencia del reporte";

            this.image.alt = `Evidencia ampliada: ${title}`;

            this.viewer.classList.add("active", "is-open");
            this.viewer.setAttribute("aria-hidden", "false");
            document.body.classList.add(
                "report-image-viewer-open"
            );

            $(".report-image-viewer-close", this.viewer)
                ?.focus();
        },

        close() {
            if (!this.viewer || !this.image) {
                return;
            }

            this.viewer.classList.remove("active", "is-open");
            this.viewer.setAttribute("aria-hidden", "true");
            document.body.classList.remove(
                "report-image-viewer-open"
            );

            this.image.removeAttribute("src");
            this.trigger?.focus?.();
            this.trigger = null;
        }
    };

    /* =========================================================================
       11. ALERTAS Y ATAJOS
       ========================================================================= */

    const GeneralUI = {
        init() {
            $$(".reports-alert-close").forEach(button => {
                button.addEventListener("click", () => {
                    button.closest(".reports-alert")?.remove();
                });
            });

            document.addEventListener("keydown", event => {
                if (isTypingElement(event.target)) {
                    return;
                }

                if (
                    event.key.toLowerCase() === "n" &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.altKey
                ) {
                    event.preventDefault();
                    ReportModal.open();
                }

                if (
                    (event.ctrlKey || event.metaKey) &&
                    event.key.toLowerCase() === "k"
                ) {
                    event.preventDefault();
                    $("#reportsSearch")?.focus();
                }
            });

            const hash = window.location.hash;

            if (hash.startsWith("#reporte-")) {
                window.setTimeout(() => {
                    document.querySelector(hash)
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });
                }, 250);
            }
        }
    };

    /* =========================================================================
       12. INICIALIZACIÓN
       ========================================================================= */

    const init = () => {
        ReportModal.init();
        ReportForm.init();
        ReportsBrowser.init();
        RelativeTime.init();
        Voting.init();
        ReportActions.init();
        ImageViewer.init();
        GeneralUI.init();
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }
})();
/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt
 * to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Other/javascript.js
 * to edit this template
 */

let map;
let activeInfoWindow = null;

let userMarker = null;
let userLocation = null;

let searchLocation = null;
let currentSearchRadius = 5;
let searchLocationMarker = null;

let GeocoderClass = null;
let AutocompleteClass = null;
let placesAutocomplete = null;
let placeSelectedFromAutocomplete = false;

let AdvancedMarkerElementClass = null;
let PinElementClass = null;
let RouteClass = null;

let activeRoute = null;
let activeRoutePolylines = [];
let activeRouteParkingId = null;

const markerRegistry = new Map();
const infoWindowRegistry = new Map();
const parkingDataRegistry = new Map();

/*
 * Pesos del algoritmo de recomendación.
 * La suma debe ser igual a 1.
 */
const SMART_SCORE_WEIGHTS = Object.freeze({
    proximity: 0.40,
    availability: 0.30,
    rating: 0.20,
    price: 0.10
});

/*
 * Distancia de referencia para reducir progresivamente
 * la puntuación por cercanía. A 5 km el puntaje de
 * proximidad baja aproximadamente a 37 puntos.
 */
const PROXIMITY_DECAY_KM = 5;

/**
 * Inicializa Google Maps y crea los marcadores
 * usando los datos generados por Thymeleaf.
 */
async function initMap() {

    const mapElement = document.getElementById("googleMap");

    if (!mapElement) {
        console.error("No se encontró el contenedor #googleMap.");
        return;
    }

    try {

        const {Map} = await google.maps.importLibrary("maps");
        const {Geocoder} = await google.maps.importLibrary("geocoding");
        const {Autocomplete} = await google.maps.importLibrary("places");

        const {
            AdvancedMarkerElement,
            PinElement
        } = await google.maps.importLibrary("marker");

        const {Route} = await google.maps.importLibrary("routes");

        AdvancedMarkerElementClass = AdvancedMarkerElement;
        PinElementClass = PinElement;
        RouteClass = Route;
        GeocoderClass = Geocoder;
        AutocompleteClass = Autocomplete;

        const centroSanJose = {
            lat: 9.932542,
            lng: -84.079578
        };

        map = new Map(mapElement, {
            center: centroSanJose,
            zoom: 14,
            mapId: "DEMO_MAP_ID",
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true
        });

        initializePlacesAutocomplete();

        const bounds = new google.maps.LatLngBounds();

        const parkingElements = document.querySelectorAll(
                ".parking-map-item"
                );

        parkingElements.forEach((item) => {

            const parking = readParkingData(item);

            parkingDataRegistry.set(
                    String(parking.id),
                    parking
                    );

            if (!hasValidCoordinates(parking)) {
                console.warn(
                        `El parqueo "${parking.nombre}" no tiene coordenadas válidas.`
                        );
                return;
            }

            const position = {
                lat: parking.latitud,
                lng: parking.longitud
            };

            const pin = createParkingPin(parking);

            const marker = new AdvancedMarkerElement({
                map: map,
                position: position,
                title: parking.nombre,
                content: pin.element,
                zIndex: parking.mejor ? 500 : null
            });

            const infoWindow = new google.maps.InfoWindow({
                content: createInfoWindowContent(parking)
            });

            marker.addListener("click", () => {
                openParkingInfo(
                        parking.id,
                        marker,
                        infoWindow
                        );
            });

            markerRegistry.set(
                    String(parking.id),
                    marker
                    );

            infoWindowRegistry.set(
                    String(parking.id),
                    infoWindow
                    );

            bounds.extend(position);

        });

        adjustMapBounds(bounds);

        connectParkingCards();

        selectRecommendedParking();

        connectMyLocationButton();

        connectRadiusSelector();

        connectExpandRadiusButton();

        /*
         * Se revisa si el usuario escribió una ubicación
         * en el buscador antes de cargar el Dashboard.
         */
        const locationInput = document.getElementById(
                "locationSearchInput"
                );

        const hasSearchLocation =
                Boolean(locationInput?.value.trim());

        if (hasSearchLocation) {

            /*
             * Convierte el texto en coordenadas,
             * centra el mapa y recalcula las distancias.
             */
            await applyGeographicSearch();

            /*
             * También obtenemos el GPS para poder calcular
             * rutas reales desde la posición del usuario,
             * pero no centramos el mapa en esa ubicación.
             */
            locateUser(false);

        } else {

            /*
             * Si el campo está vacío, se usa el GPS
             * como origen principal de búsqueda.
             */
            locateUser(true);
        }

        openParkingFromUrl();

    } catch (error) {

        console.error(
                "Ocurrió un error al inicializar Google Maps:",
                error
                );

        mapElement.innerHTML = `
            <div class="map-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <strong>No se pudo cargar Google Maps</strong>

                <span>
                    Revisa la API key y la consola del navegador.
                </span>

            </div>
        `;
    }
}

/**
 * Convierte los atributos data-* del HTML
 * en un objeto JavaScript.
 */
function readParkingData(item) {

    return {
        id: item.dataset.id || "",
        nombre: item.dataset.nombre || "Parqueo",
        direccion: item.dataset.direccion || "Dirección no disponible",
        latitud: Number(item.dataset.latitud),
        longitud: Number(item.dataset.longitud),
        precio: toFiniteNumber(item.dataset.precio, 0),
        espacios: Math.max(
                0,
                toFiniteNumber(item.dataset.espacios, 0)
                ),
        espaciosTotales: Math.max(
                0,
                toFiniteNumber(item.dataset.espaciosTotales, 0)
                ),
        calificacion: Math.max(
                0,
                toFiniteNumber(item.dataset.calificacion, 0)
                ),
        mejor: item.dataset.mejor === "true",
        distanceMeters: null,
        smartScore: null,
        scoreBreakdown: null
    };
}

/**
 * Verifica que la latitud y longitud sean válidas.
 */
function hasValidCoordinates(parking) {

    return Number.isFinite(parking.latitud)
            && Number.isFinite(parking.longitud)
            && parking.latitud >= -90
            && parking.latitud <= 90
            && parking.longitud >= -180
            && parking.longitud <= 180;
}

/**
 * Construye el contenido visual del InfoWindow.
 */
function createInfoWindowContent(parking) {

    const badge = parking.mejor
            ? `
                <span class="map-info-badge">
                    Recomendado por EasySpot AI
                </span>
              `
            : "";

    const precio = formatNumber(parking.precio);

    const calificacion = Number(
            parking.calificacion || 0
            ).toFixed(1);

    const distanceSection = Number.isFinite(
            parking.distanceMeters
            )
            ? `
                <div class="map-info-distance">

                    <span>
                        <i class="fa-solid fa-location-arrow"></i>
                        ${formatDistance(parking.distanceMeters)}
                    </span>

                    <span>
                        <i class="fa-solid fa-car"></i>
                        ${calculateEstimatedMinutes(
            parking.distanceMeters,
            25
            )} min aprox.
                    </span>

                </div>
              `
            : "";

    return `
        <article class="map-info-window">

            ${badge}

            <h3>
                ${escapeHtml(parking.nombre)}
            </h3>

            <p class="map-info-address">

                <i class="fa-solid fa-location-dot"></i>

                <span>
                    ${escapeHtml(parking.direccion)}
                </span>

            </p>

            <div class="map-info-details">

                <span>
                    ⭐ ${calificacion}
                </span>

                <span>
                    ₡${precio}/hora
                </span>

                <span>
                    ${parking.espacios} espacios
                </span>

            </div>

            ${distanceSection}

            <div class="map-info-actions">

                <button
                    type="button"
                    class="map-route-button"
                    onclick="showRouteToParking('${escapeJavaScriptString(parking.id)}')">

                    <i class="fa-solid fa-route"></i>
                    Ver ruta

                </button>

                <a
                    href="${createReservationUrl(parking.id)}" class="map-info-button">

                    Reservar ahora

                </a>

            </div>

        </article>
    `;
}

/**
 * Ajusta el zoom del mapa según la cantidad
 * de parqueos encontrados.
 */
function adjustMapBounds(bounds) {

    if (markerRegistry.size === 0) {
        return;
    }

    if (markerRegistry.size === 1) {

        const firstMarker = markerRegistry
                .values()
                .next()
                .value;

        map.setCenter(firstMarker.position);
        map.setZoom(16);

        return;
    }

    map.fitBounds(bounds, 70);
}

/**
 * Conecta las tarjetas del panel de resultados
 * con los marcadores del mapa.
 */
function connectParkingCards() {

    const cards = document.querySelectorAll(
            ".parking-card"
            );

    cards.forEach((card) => {

        const parkingId = getParkingIdFromCard(card);

        if (!parkingId) {
            return;
        }

        card.addEventListener("click", (event) => {

            /*
             * Evita mover el mapa cuando el usuario
             * presiona un enlace o botón dentro de la tarjeta.
             */
            if (event.target.closest("a, button")) {
                return;
            }

            focusParkingOnMap(parkingId);

        });

        card.addEventListener("mouseenter", () => {

            const marker = markerRegistry.get(parkingId);

            if (marker) {
                marker.zIndex = 1000;
            }

        });

        card.addEventListener("mouseleave", () => {

            const marker = markerRegistry.get(parkingId);

            if (marker) {

                const cardIsRecommended = card.classList.contains(
                        "recommended"
                        );

                marker.zIndex = cardIsRecommended ? 500 : null;
            }

        });

    });
}

/**
 * Obtiene el ID del parqueo asociado a una tarjeta.
 */
function getParkingIdFromCard(card) {

    if (!card) {
        return "";
    }

    return String(
            card.dataset.parkingId
            || card.dataset.parqueoCard
            || ""
            );
}

/**
 * Mueve el mapa hacia un parqueo
 * y abre su InfoWindow.
 */
function focusParkingOnMap(parkingId) {

    const marker = markerRegistry.get(
            String(parkingId)
            );

    const infoWindow = infoWindowRegistry.get(
            String(parkingId)
            );

    if (!marker || !infoWindow) {
        return;
    }

    map.panTo(marker.position);
    map.setZoom(17);

    openParkingInfo(
            parkingId,
            marker,
            infoWindow
            );
}

/**
 * Abre el popup blanco del parqueo seleccionado.
 */
function openParkingInfo(
        parkingId,
        marker,
        infoWindow
        ) {

    if (!map || !marker || !infoWindow) {
        console.warn(
                "No fue posible abrir la información del parqueo:",
                parkingId
                );
        return;
    }

    /*
     * Cierra el popup que estuviera abierto anteriormente.
     */
    if (activeInfoWindow
            && activeInfoWindow !== infoWindow) {

        activeInfoWindow.close();
    }

    /*
     * Cierra el panel de ruta activo para que
     * no cubra la información del parqueo.
     */
    clearActiveRoute();

    /*
     * Actualiza el contenido por si la distancia
     * del parqueo cambió luego de obtener ubicación.
     */
    const parking = parkingDataRegistry.get(
            String(parkingId)
            );

    if (parking) {

        infoWindow.setContent(
                createInfoWindowContent(parking)
                );
    }

    /*
     * Abre el InfoWindow sobre el marcador.
     */
    infoWindow.open({
        map: map,
        anchor: marker,
        shouldFocus: false
    });

    activeInfoWindow = infoWindow;

    /*
     * Resalta la tarjeta correspondiente.
     */
    highlightCard(parkingId);
}

/**
 * Resalta la tarjeta correspondiente
 * al marcador seleccionado.
 */
function highlightCard(parkingId) {

    const cards = document.querySelectorAll(
            ".parking-card"
            );

    cards.forEach((card) => {
        card.classList.remove("selected");
    });

    const escapedId = CSS.escape(
            String(parkingId)
            );

    const selectedCard = document.querySelector(
            `.parking-card[data-parking-id="${escapedId}"],
             .parking-card[data-parqueo-card="${escapedId}"]`
            );

    if (!selectedCard) {
        return;
    }

    selectedCard.classList.add("selected");

    selectedCard.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

/**
 * Selecciona automáticamente el parqueo
 * marcado como mejor opción.
 */
function selectRecommendedParking() {

    const recommendedCard = document.querySelector(
            ".parking-card.recommended"
            );

    if (!recommendedCard) {
        return;
    }

    const parkingId = getParkingIdFromCard(
            recommendedCard
            );

    if (!parkingId) {
        return;
    }

    highlightCard(parkingId);
}

/**
 * Conecta el botón flotante de ubicación.
 */
function connectMyLocationButton() {

    const button = document.getElementById(
            "btnMyLocation"
            );

    if (!button) {
        console.warn(
                "No se encontró el botón #btnMyLocation."
                );
        return;
    }

    button.addEventListener("click", () => {

        if (userLocation) {

            centerMapOnUser();

            updateParkingDistances();

            calculateAndApplySmartRecommendation();

            showLocationAccuracy();

            return;
        }

        locateUser(true);

    });
}

/**
 * Solicita la ubicación actual del usuario.
 *
 * @param {boolean} centerMap indica si el mapa
 * debe centrarse al encontrar la ubicación.
 */
function locateUser(centerMap = true) {

    if (!navigator.geolocation) {

        console.warn(
                "Este navegador no permite usar geolocalización."
                );

        showLocationButtonState(
                "error",
                "La geolocalización no está disponible"
                );

        return;
    }

    showLocationButtonState(
            "loading",
            "Buscando tu ubicación..."
            );

    navigator.geolocation.getCurrentPosition(
            (position) => {

        userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
        };

        console.log(
                "Ubicación obtenida:",
                userLocation
                );

        createOrUpdateUserMarker();

        updateParkingDistances();

        calculateAndApplySmartRecommendation();

        showLocationAccuracy();

        showLocationButtonState(
                "success",
                "Mi ubicación"
                );

        if (centerMap && !searchLocation) {
            centerMapOnUser();
        }

        /*
         * Si el usuario llegó desde Favoritos,
         * abre automáticamente la ruta.
         */
        openParkingFromUrl();

    },
            (error) => {

        handleGeolocationError(error);

    },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
    );
}

/**
 * Crea o actualiza el marcador del usuario.
 */
function createOrUpdateUserMarker() {

    if (!map
            || !userLocation
            || !AdvancedMarkerElementClass
            || !PinElementClass) {
        return;
    }

    const markerPosition = {
        lat: userLocation.lat,
        lng: userLocation.lng
    };

    if (userMarker) {
        userMarker.position = markerPosition;
        return;
    }

    const userPin = new PinElementClass({
        background: "#2563eb",
        borderColor: "#1d4ed8",
        glyphColor: "#ffffff",
        glyph: "●",
        scale: 1.15
    });

    userMarker = new AdvancedMarkerElementClass({
        map: map,
        position: markerPosition,
        title: "Tu ubicación",
        content: userPin.element,
        zIndex: 2000
    });
}

/**
 * Centra el mapa sobre la ubicación del usuario.
 */
function centerMapOnUser() {

    if (!map || !userLocation) {
        return;
    }

    if (activeInfoWindow) {
        activeInfoWindow.close();
        activeInfoWindow = null;
    }

    map.panTo({
        lat: userLocation.lat,
        lng: userLocation.lng
    });

    map.setZoom(17);
}

/**
 * Maneja los posibles errores de geolocalización.
 */
function handleGeolocationError(error) {

    let message = "No se pudo obtener tu ubicación.";

    switch (error.code) {

        case error.PERMISSION_DENIED:

            message = "Permiso de ubicación rechazado.";

            console.warn(
                    "El usuario rechazó el permiso de ubicación."
                    );

            break;

        case error.POSITION_UNAVAILABLE:

            message = "Tu ubicación no está disponible.";

            console.warn(
                    "La ubicación del dispositivo no está disponible."
                    );

            break;

        case error.TIMEOUT:

            message = "La búsqueda de ubicación tardó demasiado.";

            console.warn(
                    "Se agotó el tiempo para obtener la ubicación."
                    );

            break;

        default:

            console.error(
                    "Error desconocido de geolocalización:",
                    error
                    );
    }

    showLocationButtonState(
            "error",
            message
            );
}

/**
 * Cambia el estado visual y el texto accesible
 * del botón de ubicación.
 */
function showLocationButtonState(
        state,
        title
        ) {

    const button = document.getElementById(
            "btnMyLocation"
            );

    if (!button) {
        return;
    }

    button.classList.remove(
            "loading",
            "success",
            "error"
            );

    if (state) {
        button.classList.add(state);
    }

    button.title = title;

    button.setAttribute(
            "aria-label",
            title
            );

    const icon = button.querySelector("i");

    if (!icon) {
        return;
    }

    icon.className = "";

    if (state === "loading") {

        icon.classList.add(
                "fa-solid",
                "fa-spinner",
                "fa-spin"
                );

        button.disabled = true;

        return;
    }

    button.disabled = false;

    if (state === "error") {

        icon.classList.add(
                "fa-solid",
                "fa-location-dot"
                );

        return;
    }

    icon.classList.add(
            "fa-solid",
            "fa-location-crosshairs"
            );
}

/**
 * Calcula la distancia entre dos coordenadas
 * utilizando la fórmula de Haversine.
 *
 * El resultado se devuelve en metros.
 */
function calculateDistanceMeters(
        latitude1,
        longitude1,
        latitude2,
        longitude2
        ) {

    const earthRadius = 6371000;

    const latitudeDifference = degreesToRadians(
            latitude2 - latitude1
            );

    const longitudeDifference = degreesToRadians(
            longitude2 - longitude1
            );

    const latitude1Radians = degreesToRadians(
            latitude1
            );

    const latitude2Radians = degreesToRadians(
            latitude2
            );

    const haversine =
            Math.sin(latitudeDifference / 2)
            * Math.sin(latitudeDifference / 2)
            + Math.cos(latitude1Radians)
            * Math.cos(latitude2Radians)
            * Math.sin(longitudeDifference / 2)
            * Math.sin(longitudeDifference / 2);

    const centralAngle = 2 * Math.atan2(
            Math.sqrt(haversine),
            Math.sqrt(1 - haversine)
            );

    return earthRadius * centralAngle;
}

/**
 * Convierte grados a radianes.
 */
function degreesToRadians(degrees) {

    return degrees * Math.PI / 180;
}

/**
 * Calcula la distancia de todos los parqueos
 * con respecto a la ubicación del usuario.
 */
function updateParkingDistances() {

    const origin = searchLocation || userLocation;

    if (!origin) {
        return;
    }

    parkingDataRegistry.forEach((parking, parkingId) => {

        if (!hasValidCoordinates(parking)) {
            return;
        }

        const distanceMeters =
                calculateDistanceMeters(
                        origin.lat,
                        origin.lng,
                        parking.latitud,
                        parking.longitud
                        );

        parking.distanceMeters = distanceMeters;

        updateParkingCardDistance(
                parkingId,
                distanceMeters
                );

        refreshParkingInfoWindow(
                parkingId,
                parking
                );
    });

    applyRadiusFilter();
}

function applyRadiusFilter() {

    parkingDataRegistry.forEach((parking, parkingId) => {

        const marker =
                markerRegistry.get(
                        String(parkingId)
                        );

        const card =
                document.querySelector(
                        `.parking-card[data-parking-id="${CSS.escape(String(parkingId))}"]`
                        );

        if (!marker || !card) {
            return;
        }

        const insideRadius =
                parking.distanceMeters <= currentSearchRadius * 1000;

        marker.map =
                insideRadius ? map : null;

        card.style.display =
                insideRadius ? "" : "none";

    });

    updateVisibleResults();

    calculateAndApplySmartRecommendation();

}

/**
 * Actualiza el contador, los espacios disponibles
 * y el mensaje cuando el radio no tiene resultados.
 */
function updateVisibleResults() {

    const cards = Array.from(
            document.querySelectorAll(".parking-card")
            );

    const visibleCards = cards.filter(
            (card) => card.style.display !== "none"
    );

    const parkingCounter = document.getElementById(
            "visibleParkingCount"
            );

    const spacesCounter = document.getElementById(
            "visibleAvailableSpaces"
            );

    const resultsList = document.querySelector(
            ".results-list"
            );

    const emptyResults = document.getElementById(
            "dynamicEmptyResults"
            );

    const emptyMessage = document.getElementById(
            "dynamicEmptyMessage"
            );

    const expandButton = document.getElementById(
            "btnExpandSearchRadius"
            );

    /*
     * Actualiza la cantidad de parqueos visibles.
     */
    if (parkingCounter) {

        parkingCounter.textContent =
                visibleCards.length === 1
                ? "1 parqueo"
                : `${visibleCards.length} parqueos`;
    }

    /*
     * Suma los espacios disponibles.
     */
    const totalVisibleSpaces = visibleCards.reduce(
            (total, card) => {

        const parkingId = getParkingIdFromCard(card);

        const parking = parkingDataRegistry.get(
                String(parkingId)
                );

        return total + (parking?.espacios || 0);

    }, 0);

    if (spacesCounter) {
        spacesCounter.textContent = totalVisibleSpaces;
    }

    /*
     * ¿Hay resultados visibles?
     */
    const hasVisibleResults =
            visibleCards.length > 0;

    if (resultsList) {
        resultsList.hidden = !hasVisibleResults;
    }

    if (emptyResults) {
        emptyResults.hidden = hasVisibleResults;
    }

    /*
     * Mostrar mensaje dinámico cuando no hay resultados.
     */
    if (!hasVisibleResults && emptyMessage) {

        const locationName =
                getCurrentSearchLocationName();

        emptyMessage.textContent =
                `No encontramos parqueos dentro de `
                + `${currentSearchRadius} km de ${locationName}. `
                + `Puedes ampliar el radio o buscar otra ubicación.`;

        if (expandButton) {

            if (currentSearchRadius >= 20) {

                expandButton.style.display = "none";

            } else {

                expandButton.style.display = "";

                let nextRadius;

                switch (currentSearchRadius) {

                    case 2:
                        nextRadius = 5;
                        break;

                    case 5:
                        nextRadius = 10;
                        break;

                    case 10:
                        nextRadius = 20;
                        break;

                    default:
                        nextRadius = null;
                }

                if (nextRadius) {

                    expandButton.innerHTML = `
                        <i class="fa-solid fa-expand"></i>
                        Ampliar búsqueda a ${nextRadius} km
                    `;
                }
            }
        }

    } else {

        /*
         * Si vuelven a aparecer resultados,
         * aseguramos que el botón esté visible.
         */
        if (expandButton) {
            expandButton.style.display = "";
        }

    }

}

/**
 * Permite ampliar rápidamente la búsqueda
 * desde el estado sin resultados.
 */
function connectExpandRadiusButton() {

    const button = document.getElementById(
            "btnExpandSearchRadius"
            );

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {

        let nextRadius = null;

        switch (currentSearchRadius) {

            case 2:
                nextRadius = 5;
                break;

            case 5:
                nextRadius = 10;
                break;

            case 10:
                nextRadius = 20;
                break;

            default:
                return;
        }

        const nextRadio = document.querySelector(
                `input[name="searchRadius"][value="${nextRadius}"]`
                );

        if (!nextRadio) {
            return;
        }

        nextRadio.checked = true;
        currentSearchRadius = nextRadius;

        applyRadiusFilter();

    });
}

/**
 * Actualiza el contenido del InfoWindow para
 * mostrar también la distancia al parqueo.
 */
function refreshParkingInfoWindow(
        parkingId,
        parking
        ) {

    const infoWindow = infoWindowRegistry.get(
            String(parkingId)
            );

    if (!infoWindow) {
        return;
    }

    infoWindow.setContent(
            createInfoWindowContent(parking)
            );
}



/**
 * Agrega la distancia y los tiempos estimados
 * dentro de la tarjeta correspondiente.
 */
function updateParkingCardDistance(
        parkingId,
        distanceMeters
        ) {

    const escapedId = CSS.escape(
            String(parkingId)
            );

    const card = document.querySelector(
            `.parking-card[data-parking-id="${escapedId}"],
             .parking-card[data-parqueo-card="${escapedId}"]`
            );

    if (!card) {
        return;
    }

    let distanceContainer = card.querySelector(
            ".parking-distance-info"
            );

    if (!distanceContainer) {

        distanceContainer =
                document.createElement("div");

        distanceContainer.className =
                "parking-distance-info";

        const featuresContainer = card.querySelector(
                ".parking-features"
                );

        if (featuresContainer) {

            featuresContainer.insertAdjacentElement(
                    "afterend",
                    distanceContainer
                    );

        } else {

            const footer = card.querySelector(
                    ".parking-card-footer"
                    );

            if (footer) {

                footer.insertAdjacentElement(
                        "beforebegin",
                        distanceContainer
                        );

            } else {

                card.appendChild(
                        distanceContainer
                        );
            }
        }
    }

    const walkingMinutes =
            calculateEstimatedMinutes(
                    distanceMeters,
                    5
                    );

    const drivingMinutes =
            calculateEstimatedMinutes(
                    distanceMeters,
                    25
                    );

    distanceContainer.innerHTML = `
        <span class="distance-value">

            <i class="fa-solid fa-location-arrow"></i>

            ${formatDistance(distanceMeters)}

        </span>

        <span>

            <i class="fa-solid fa-person-walking"></i>

            ${walkingMinutes} min

        </span>

        <span>

            <i class="fa-solid fa-car"></i>

            ${drivingMinutes} min

        </span>
    `;
}

/**
 * Estima el tiempo de viaje usando una
 * velocidad promedio expresada en km/h.
 */
function calculateEstimatedMinutes(
        distanceMeters,
        speedKilometersPerHour
        ) {

    if (!Number.isFinite(distanceMeters)
            || distanceMeters <= 0
            || !Number.isFinite(speedKilometersPerHour)
            || speedKilometersPerHour <= 0) {
        return 1;
    }

    const distanceKilometers =
            distanceMeters / 1000;

    const hours =
            distanceKilometers
            / speedKilometersPerHour;

    return Math.max(
            1,
            Math.ceil(hours * 60)
            );
}

/**
 * Formatea la distancia para mostrar metros
 * o kilómetros según corresponda.
 */
function formatDistance(distanceMeters) {

    if (!Number.isFinite(distanceMeters)) {
        return "Distancia no disponible";
    }

    if (distanceMeters < 1000) {
        return `${Math.round(distanceMeters)} m`;
    }

    const distanceKilometers =
            distanceMeters / 1000;

    return `${distanceKilometers.toFixed(1)} km`;
}


/**
 * Calcula la recomendación inteligente cuando ya existe
 * una ubicación válida del usuario.
 *
 * Factores:
 * 40% cercanía
 * 30% disponibilidad
 * 20% calificación
 * 10% precio
 */
function calculateAndApplySmartRecommendation() {

    const origin = searchLocation || userLocation;

    if (!origin || parkingDataRegistry.size === 0) {
        return;
    }

    const radiusMeters =
            currentSearchRadius * 1000;

    const candidates = Array.from(
            parkingDataRegistry.values()
            ).filter((parking) =>
        hasValidCoordinates(parking)
                && Number.isFinite(parking.distanceMeters)
                && parking.distanceMeters <= radiusMeters
                && parking.espacios > 0
    );

    /*
     * Si todos están agotados o no tienen coordenadas,
     * se conserva la recomendación inicial del backend.
     */
    if (candidates.length === 0) {

        clearSmartRecommendation();

        console.warn(`No existen parqueos disponibles dentro de ` + `${currentSearchRadius} km.`);

        return;
    }

    const validPrices = candidates
            .map((parking) => parking.precio)
            .filter((price) => Number.isFinite(price) && price >= 0);

    const minimumPrice = validPrices.length > 0
            ? Math.min(...validPrices)
            : 0;

    const maximumPrice = validPrices.length > 0
            ? Math.max(...validPrices)
            : minimumPrice;

    let recommendedParking = null;

    parkingDataRegistry.forEach((parking) => {

        parking.smartScore = null;
        parking.scoreBreakdown = null;

        if (!candidates.includes(parking)) {
            return;
        }

        const proximityScore = calculateProximityScore(
                parking.distanceMeters
                );

        const availabilityScore = calculateAvailabilityScore(
                parking
                );

        const ratingScore = clamp(
                (parking.calificacion / 5) * 100,
                0,
                100
                );

        const priceScore = calculatePriceScore(
                parking.precio,
                minimumPrice,
                maximumPrice
                );

        const smartScore =
                proximityScore * SMART_SCORE_WEIGHTS.proximity
                + availabilityScore * SMART_SCORE_WEIGHTS.availability
                + ratingScore * SMART_SCORE_WEIGHTS.rating
                + priceScore * SMART_SCORE_WEIGHTS.price;

        parking.smartScore = Math.round(smartScore * 10) / 10;

        parking.scoreBreakdown = {
            proximity: Math.round(proximityScore),
            availability: Math.round(availabilityScore),
            rating: Math.round(ratingScore),
            price: Math.round(priceScore)
        };

        if (!recommendedParking
                || parking.smartScore > recommendedParking.smartScore
                || (
                        parking.smartScore === recommendedParking.smartScore
                        && parking.distanceMeters
                        < recommendedParking.distanceMeters
                        )) {

            recommendedParking = parking;
        }
    });

    if (!recommendedParking) {
        return;
    }

    applyRecommendedParking(recommendedParking.id);
    sortParkingCardsBySmartScore();

    console.table(
            Array.from(parkingDataRegistry.values())
            .filter((parking) =>
                Number.isFinite(parking.smartScore)
            )
            .map((parking) => ({
                    parqueo: parking.nombre,
                    distancia: formatDistance(parking.distanceMeters),
                    espacios: parking.espacios,
                    precio: parking.precio,
                    calificacion: parking.calificacion,
                    smartScore: parking.smartScore
                }))
            );
}

/**
 * Limpia la recomendación cuando no existen
 * parqueos disponibles dentro del radio.
 */
function clearSmartRecommendation() {

    parkingDataRegistry.forEach(
            (parking, parkingId) => {

        parking.mejor = false;
        parking.smartScore = null;
        parking.scoreBreakdown = null;

        updateRecommendedCard(
                parkingId,
                false
                );

        updateParkingMarkerStyle(
                parkingId,
                parking
                );

        refreshParkingInfoWindow(
                parkingId,
                parking
                );
    });

    const assistant = document.getElementById(
            "easyBotRecommendation"
            );

    const parkingName = document.getElementById(
            "easyBotParkingName"
            );

    const reason = document.getElementById(
            "easyBotReason"
            );

    const reserveLink = document.getElementById(
            "easyBotReserveLink"
            );

    const locationName = getCurrentSearchLocationName();

    if (assistant) {
        assistant.classList.add("no-results");
    }

    if (parkingName) {
        parkingName.textContent =
                "No encontré opciones disponibles";
    }

    if (reason) {

        reason.textContent =
                ` dentro de ${currentSearchRadius} km`
                + ` de ${locationName}. Prueba ampliando`
                + ` el radio o cambiando la ubicación.`;
    }

    if (reserveLink) {
        reserveLink.style.display = "none";
    }
}

/**
 * Devuelve un nombre comprensible para
 * el origen actual de la búsqueda.
 */
function getCurrentSearchLocationName() {

    if (searchLocation?.label) {
        return searchLocation.label;
    }

    if (userLocation) {
        return "tu ubicación actual";
    }

    return "la ubicación seleccionada";
}

/**
 * Convierte la distancia en una puntuación de 0 a 100.
 * Utiliza una caída exponencial para evitar que un parqueo
 * de otra provincia gane solamente por tener más espacios.
 */
function calculateProximityScore(distanceMeters) {

    if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
        return 0;
    }

    const distanceKilometers = distanceMeters / 1000;

    return clamp(
            100 * Math.exp(
                    -distanceKilometers / PROXIMITY_DECAY_KM
                    ),
            0,
            100
            );
}

/**
 * Calcula el porcentaje real de espacios disponibles.
 * Cuando no existe un total válido, usa una escala
 * conservadora basada en espacios absolutos.
 */
function calculateAvailabilityScore(parking) {

    if (parking.espacios <= 0) {
        return 0;
    }

    if (parking.espaciosTotales > 0) {

        return clamp(
                (parking.espacios / parking.espaciosTotales) * 100,
                0,
                100
                );
    }

    return clamp(
            parking.espacios * 5,
            0,
            100
            );
}

/**
 * El parqueo más económico recibe 100 puntos y el más caro 0.
 * Si todos tienen el mismo precio, todos reciben 100.
 */
function calculatePriceScore(
        price,
        minimumPrice,
        maximumPrice
        ) {

    if (!Number.isFinite(price) || price < 0) {
        return 0;
    }

    if (maximumPrice <= minimumPrice) {
        return 100;
    }

    return clamp(
            100
            - (
                    (price - minimumPrice)
                    / (maximumPrice - minimumPrice)
                    * 100
                    ),
            0,
            100
            );
}

/**
 * Aplica visualmente la nueva recomendación:
 * tarjeta, badge, marcador, popup y EasyBot.
 */
function applyRecommendedParking(recommendedParkingId) {

    const recommendedId = String(recommendedParkingId);

    parkingDataRegistry.forEach((parking, parkingId) => {

        const isRecommended = parkingId === recommendedId;

        parking.mejor = isRecommended;

        updateRecommendedCard(
                parkingId,
                isRecommended
                );

        updateParkingMarkerStyle(
                parkingId,
                parking
                );

        refreshParkingInfoWindow(
                parkingId,
                parking
                );
    });

    const recommendedParking = parkingDataRegistry.get(
            recommendedId
            );

    if (!recommendedParking) {
        return;
    }

    updateEasyBotRecommendation(
            recommendedParking
            );

    updateRecommendedPrice(
            recommendedParking
            );

    highlightCard(
            recommendedId
            );
}

/**
 * Agrega o elimina el badge de "Mejor opción"
 * de una tarjeta.
 */
function updateRecommendedCard(
        parkingId,
        isRecommended
        ) {

    const card = findParkingCard(parkingId);

    if (!card) {
        return;
    }

    card.classList.toggle(
            "recommended",
            isRecommended
            );

    let badge = card.querySelector(
            ".recommended-badge"
            );

    if (isRecommended && !badge) {

        badge = document.createElement("span");
        badge.className = "recommended-badge";
        badge.textContent = "Mejor opción";

        const imageContainer = card.querySelector(
                ".parking-card-image"
                );

        if (imageContainer) {
            imageContainer.insertAdjacentElement(
                    "afterend",
                    badge
                    );
        } else {
            card.prepend(badge);
        }
    }

    if (!isRecommended && badge) {
        badge.remove();
    }
}

/**
 * Actualiza el pin del mapa al cambiar la recomendación.
 */
function updateParkingMarkerStyle(
        parkingId,
        parking
        ) {

    const marker = markerRegistry.get(
            String(parkingId)
            );

    if (!marker || !PinElementClass) {
        return;
    }

    const pin = createParkingPin(parking);

    marker.content = pin.element;
    marker.zIndex = parking.mejor ? 500 : null;
}

/**
 * Crea el pin de un parqueo respetando su estado recomendado.
 */
function createParkingPin(parking) {

    return new PinElementClass({
        background: parking.mejor
                ? "#22c55e"
                : "#0ea5e9",

        borderColor: parking.mejor
                ? "#15803d"
                : "#0284c7",

        glyphColor: "#ffffff",
        glyph: parking.mejor ? "★" : "P",
        scale: parking.mejor ? 1.25 : 1
    });
}

/**
 * Actualiza el mensaje contextual y el enlace
 * de reserva del asistente EasyBot.
 */
function updateEasyBotRecommendation(parking) {

    const assistant = document.getElementById(
            "easyBotRecommendation"
            );

    const parkingName = document.getElementById(
            "easyBotParkingName"
            );

    const reason = document.getElementById(
            "easyBotReason"
            );

    const reserveLink = document.getElementById(
            "easyBotReserveLink"
            );

    if (!assistant || !parking) {
        return;
    }

    assistant.classList.remove("no-results");

    const visibleParkings =
            Array.from(
                    parkingDataRegistry.values()
                    ).filter((item) =>
        Number.isFinite(item.distanceMeters)
                && item.distanceMeters
                <= currentSearchRadius * 1000
    );

    const availableParkings =
            visibleParkings.filter(
                    (item) => item.espacios > 0
            );

    const locationName =
            getCurrentSearchLocationName();

    const distance =
            formatDistance(
                    parking.distanceMeters
                    );

    const rating =
            Number(
                    parking.calificacion || 0
                    ).toFixed(1);

    const smartScore =
            Number.isFinite(parking.smartScore)
            ? parking.smartScore.toFixed(1)
            : "--";

    if (parkingName) {
        parkingName.textContent = parking.nombre;
    }

    if (reason) {

        const resultsText =
                availableParkings.length === 1
                ? "Encontré 1 parqueo disponible"
                : `Encontré ${availableParkings.length} `
                + "parqueos disponibles";

        reason.textContent =
                `. ${resultsText} dentro de `
                + `${currentSearchRadius} km de ${locationName}. `
                + `Esta es la mejor opción porque está a ${distance}, `
                + `tiene ${parking.espacios} espacios disponibles, `
                + `una calificación de ${rating}★, una tarifa de `
                + `₡${formatNumber(parking.precio)} por hora `
                + `y un Smart Score de ${smartScore} puntos.`;
    }

    if (reserveLink) {

        reserveLink.href =
                createReservationUrl(
                        parking.id
                        );

        reserveLink.style.display = "";
    }

    assistant.dataset.recommendedParkingId =
            String(parking.id);
}

/**
 * Actualiza la cifra de la tarjeta superior.
 */
function updateRecommendedPrice(parking) {

    const priceElement = document.getElementById(
            "recommendedParkingPrice"
            );

    if (!priceElement) {
        return;
    }

    priceElement.textContent =
            `₡${formatNumber(parking.precio)}`;
}

/**
 * Ordena las tarjetas de mayor a menor Smart Score.
 * Las tarjetas sin puntaje quedan al final.
 */
function sortParkingCardsBySmartScore() {

    const resultsList = document.querySelector(
            ".results-list"
            );

    if (!resultsList) {
        return;
    }

    const cards = Array.from(
            resultsList.querySelectorAll(
                    ".parking-card"
                    )
            );

    cards.sort((cardA, cardB) => {

        const parkingA = parkingDataRegistry.get(
                getParkingIdFromCard(cardA)
                );

        const parkingB = parkingDataRegistry.get(
                getParkingIdFromCard(cardB)
                );

        const scoreA = parkingA?.smartScore
                ?? Number.NEGATIVE_INFINITY;

        const scoreB = parkingB?.smartScore
                ?? Number.NEGATIVE_INFINITY;

        if (scoreA !== scoreB) {
            return scoreB - scoreA;
        }

        const distanceA = parkingA?.distanceMeters
                ?? Number.POSITIVE_INFINITY;

        const distanceB = parkingB?.distanceMeters
                ?? Number.POSITIVE_INFINITY;

        return distanceA - distanceB;
    });

    cards.forEach((card, index) => {

        resultsList.appendChild(card);

        card.dataset.smartPosition =
                String(index + 1);
    });
}

/**
 * Localiza una tarjeta por el ID de parqueo.
 */
function findParkingCard(parkingId) {

    const escapedId = CSS.escape(
            String(parkingId)
            );

    return document.querySelector(
            `.parking-card[data-parking-id="${escapedId}"],
             .parking-card[data-parqueo-card="${escapedId}"]`
            );
}

/**
 * Limita un número a un intervalo.
 */
function clamp(value, minimum, maximum) {

    return Math.min(
            maximum,
            Math.max(minimum, value)
            );
}

/**
 * Convierte un valor a número finito.
 */
function toFiniteNumber(value, fallback = 0) {

    const numericValue = Number(value);

    return Number.isFinite(numericValue)
            ? numericValue
            : fallback;
}


/**
 * Ordena las tarjetas visualmente desde el
 * parqueo más cercano hasta el más lejano.
 */
function sortParkingCardsByDistance() {

    const resultsList = document.querySelector(
            ".results-list"
            );

    if (!resultsList) {
        return;
    }

    const cards = Array.from(
            resultsList.querySelectorAll(
                    ".parking-card"
                    )
            );

    cards.sort((cardA, cardB) => {

        const parkingIdA =
                getParkingIdFromCard(cardA);

        const parkingIdB =
                getParkingIdFromCard(cardB);

        const parkingA =
                parkingDataRegistry.get(
                        parkingIdA
                        );

        const parkingB =
                parkingDataRegistry.get(
                        parkingIdB
                        );

        const distanceA =
                parkingA?.distanceMeters
                ?? Number.POSITIVE_INFINITY;

        const distanceB =
                parkingB?.distanceMeters
                ?? Number.POSITIVE_INFINITY;

        return distanceA - distanceB;
    });

    cards.forEach((card, index) => {

        resultsList.appendChild(card);

        card.dataset.distancePosition =
                String(index + 1);
    });
}

/**
 * Muestra un aviso cuando el navegador solo
 * pudo obtener una ubicación aproximada.
 */
function showLocationAccuracy() {

    if (!userLocation
            || !Number.isFinite(
                    userLocation.accuracy
                    )) {
        return;
    }

    const accuracy = userLocation.accuracy;

    console.log(
            `Precisión de geolocalización: ±${Math.round(accuracy)} metros`
            );

    let accuracyMessage =
            document.getElementById(
                    "locationAccuracyMessage"
                    );

    if (accuracy <= 100) {

        if (accuracyMessage) {
            accuracyMessage.remove();
        }

        return;
    }

    if (!accuracyMessage) {

        accuracyMessage =
                document.createElement("div");

        accuracyMessage.id =
                "locationAccuracyMessage";

        accuracyMessage.className =
                "location-accuracy-message";

        const mapContainer =
                document.querySelector(
                        ".map-container"
                        );

        mapContainer?.appendChild(
                accuracyMessage
                );
    }

    accuracyMessage.innerHTML = `
        <i class="fa-solid fa-circle-info"></i>

        <span>
            Ubicación aproximada:
            precisión de ±${formatDistance(accuracy)}.
        </span>

        <button
            type="button"
            aria-label="Cerrar mensaje"
            title="Cerrar">

            <i class="fa-solid fa-xmark"></i>

        </button>
    `;

    const closeButton =
            accuracyMessage.querySelector(
                    "button"
                    );

    closeButton?.addEventListener(
            "click",
            () => {
        accuracyMessage.remove();
    }
    );
}


/**
 * Calcula y muestra una ruta real desde la ubicación
 * del usuario hasta el parqueo seleccionado.
 */
async function showRouteToParking(parkingId) {

    if (activeInfoWindow) {
        activeInfoWindow.close();
        activeInfoWindow = null;
    }

    const parking = parkingDataRegistry.get(
            String(parkingId)
            );

    if (!parking) {
        showRouteError("No se encontró el parqueo seleccionado.");
        return;
    }

    if (!hasValidCoordinates(parking)) {
        showRouteError("El parqueo no tiene coordenadas válidas.");
        return;
    }

    if (!userLocation) {
        showRouteError(
                "Primero debes permitir el acceso a tu ubicación."
                );
        locateUser(false);
        return;
    }

    if (!RouteClass) {
        showRouteError(
                "La biblioteca de rutas todavía no está disponible."
                );
        return;
    }

    showRoutePanelLoading(parking.nombre);
    clearActiveRoute(false);

    try {

        const request = {
            origin: {
                lat: userLocation.lat,
                lng: userLocation.lng
            },
            destination: {
                lat: parking.latitud,
                lng: parking.longitud
            },
            travelMode: "DRIVING",
            routingPreference: "TRAFFIC_AWARE",
            fields: [
                "path",
                "legs",
                "distanceMeters",
                "durationMillis",
                "viewport"
            ]
        };

        const {routes} = await RouteClass.computeRoutes(request);

        if (!Array.isArray(routes) || routes.length === 0) {
            showRouteError("No se encontró una ruta disponible.");
            return;
        }

        activeRoute = routes[0];
        activeRouteParkingId = String(parkingId);

        drawRouteOnMap(activeRoute);
        showRouteInformation(parking, activeRoute);

    } catch (error) {

        console.error("No se pudo calcular la ruta:", error);

        showRouteError(
                "No se pudo calcular la ruta. Revisa la configuración de Routes API y las restricciones de la API key."
                );
    }
}

/**
 * Dibuja la ruta calculada sobre el mapa.
 */
function drawRouteOnMap(route) {

    clearRoutePolylines();

    const polylines = route.createPolylines({
        polylineOptions: {
            strokeColor: "#2563eb",
            strokeOpacity: 0.9,
            strokeWeight: 6,
            zIndex: 100
        }
    });

    polylines.forEach((polyline) => {
        polyline.setMap(map);
    });

    activeRoutePolylines = polylines;

    centerActiveRoute();
}

/**
 * Crea o recupera el panel flotante de la ruta.
 */
function getOrCreateRoutePanel() {

    let routePanel = document.getElementById(
            "activeRoutePanel"
            );

    if (routePanel) {
        return routePanel;
    }

    routePanel = document.createElement("aside");
    routePanel.id = "activeRoutePanel";
    routePanel.className = "active-route-panel";

    const mapContainer = document.querySelector(
            ".map-container"
            );

    mapContainer?.appendChild(routePanel);

    return routePanel;
}

/**
 * Muestra el estado de carga mientras se calcula la ruta.
 */
function showRoutePanelLoading(parkingName) {

    const routePanel = getOrCreateRoutePanel();

    routePanel.classList.add("visible");

    routePanel.innerHTML = `
        <div class="route-panel-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <div>
                <strong>Calculando ruta</strong>
                <span>Destino: ${escapeHtml(parkingName)}</span>
            </div>

        </div>
    `;
}

/**
 * Muestra distancia, duración y acciones de la ruta.
 */
function showRouteInformation(parking, route) {

    const routePanel = getOrCreateRoutePanel();

    const distanceText = formatDistance(
            getRouteDistanceMeters(route)
            );

    const durationText = formatRouteDuration(
            getRouteDurationMillis(route)
            );

    routePanel.classList.add("visible");

    routePanel.innerHTML = `
        <div class="route-panel-header">

            <div class="route-panel-icon">
                <i class="fa-solid fa-route"></i>
            </div>

            <div>
                <span>Ruta seleccionada</span>
                <strong>${escapeHtml(parking.nombre)}</strong>
            </div>

            <button
                type="button"
                class="route-panel-close"
                aria-label="Ocultar ruta"
                title="Ocultar ruta"
                onclick="clearActiveRoute()">

                <i class="fa-solid fa-xmark"></i>

            </button>

        </div>

        <div class="route-panel-details">

            <div>
                <i class="fa-solid fa-road"></i>
                <span>Distancia</span>
                <strong>${distanceText}</strong>
            </div>

            <div>
                <i class="fa-solid fa-car"></i>
                <span>Duración</span>
                <strong>${durationText}</strong>
            </div>

        </div>

        <div class="route-panel-actions">

            <button
                type="button"
                onclick="centerActiveRoute()">

                <i class="fa-solid fa-expand"></i>
                Ver ruta completa

            </button>

            <a
                href="${createGoogleMapsNavigationUrl(parking)}"
                target="_blank"
                rel="noopener noreferrer">

                <i class="fa-solid fa-diamond-turn-right"></i>
                Abrir en Google Maps

            </a>

        </div>
    `;
}

/**
 * Devuelve la distancia total de la ruta en metros.
 */
function getRouteDistanceMeters(route) {

    if (Number.isFinite(route.distanceMeters)) {
        return route.distanceMeters;
    }

    if (!Array.isArray(route.legs)) {
        return Number.NaN;
    }

    return route.legs.reduce((total, leg) => {

        const distance = Number(leg.distanceMeters);

        return total + (
                Number.isFinite(distance) ? distance : 0
                );

    }, 0);
}

/**
 * Devuelve la duración total de la ruta en milisegundos.
 */
function getRouteDurationMillis(route) {

    if (Number.isFinite(route.durationMillis)) {
        return route.durationMillis;
    }

    if (!Array.isArray(route.legs)) {
        return Number.NaN;
    }

    return route.legs.reduce((total, leg) => {

        const duration = Number(leg.durationMillis);

        return total + (
                Number.isFinite(duration) ? duration : 0
                );

    }, 0);
}

/**
 * Formatea una duración expresada en milisegundos.
 */
function formatRouteDuration(durationMillis) {

    const numericDuration = Number(durationMillis);

    if (!Number.isFinite(numericDuration)
            || numericDuration <= 0) {
        return "No disponible";
    }

    const totalMinutes = Math.max(
            1,
            Math.round(numericDuration / 60000)
            );

    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return remainingMinutes === 0
            ? `${hours} h`
            : `${hours} h ${remainingMinutes} min`;
}

/**
 * Elimina la ruta dibujada y, opcionalmente,
 * oculta el panel informativo.
 */
function clearActiveRoute(hidePanel = true) {

    clearRoutePolylines();

    activeRoute = null;
    activeRouteParkingId = null;

    if (!hidePanel) {
        return;
    }

    const routePanel = document.getElementById(
            "activeRoutePanel"
            );

    routePanel?.classList.remove("visible");
}

/**
 * Elimina del mapa todas las polilíneas activas.
 */
function clearRoutePolylines() {

    activeRoutePolylines.forEach((polyline) => {
        polyline.setMap(null);
    });

    activeRoutePolylines = [];
}

/**
 * Ajusta el mapa para mostrar la ruta completa.
 */
function centerActiveRoute() {

    if (!map || !activeRoute) {
        return;
    }

    const padding = {
        top: 120,
        right: 80,
        bottom: 100,
        left: 430
    };

    if (activeRoute.viewport) {

        map.fitBounds(
                activeRoute.viewport,
                padding
                );

        return;
    }

    if (activeRoutePolylines.length === 0) {
        return;
    }

    const bounds = new google.maps.LatLngBounds();

    activeRoutePolylines.forEach((polyline) => {

        const path = polyline.getPath();

        path.forEach((coordinate) => {
            bounds.extend(coordinate);
        });
    });

    map.fitBounds(bounds, padding);
}

/**
 * Construye el enlace externo de navegación.
 */
function createGoogleMapsNavigationUrl(parking) {

    const parameters = new URLSearchParams({
        api: "1",
        destination: `${parking.latitud},${parking.longitud}`,
        travelmode: "driving"
    });

    if (userLocation) {
        parameters.set(
                "origin",
                `${userLocation.lat},${userLocation.lng}`
                );
    }

    return `https://www.google.com/maps/dir/?${parameters.toString()}`;
}

/**
 * Muestra un error dentro del panel de ruta.
 */
function showRouteError(message) {

    const routePanel = getOrCreateRoutePanel();

    routePanel.classList.add("visible");

    routePanel.innerHTML = `
        <div class="route-panel-error">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <div>
                <strong>No se pudo mostrar la ruta</strong>
                <span>${escapeHtml(message)}</span>
            </div>

            <button
                type="button"
                aria-label="Cerrar mensaje"
                onclick="clearActiveRoute()">

                <i class="fa-solid fa-xmark"></i>

            </button>

        </div>
    `;
}

/**
 * Escapa un valor insertado dentro de una cadena
 * JavaScript incluida en HTML dinámico.
 */
function escapeJavaScriptString(value) {

    return String(value ?? "")
            .replaceAll("\\", "\\\\")
            .replaceAll("'", "\\'")
            .replaceAll("\n", "\\n")
            .replaceAll("\r", "\\r");
}

/**
 * Formatea precios en formato de Costa Rica.
 */
function formatNumber(value) {

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "0";
    }

    return new Intl.NumberFormat("es-CR", {
        maximumFractionDigits: 0
    }).format(numericValue);
}

/**
 * Evita insertar HTML no deseado dentro
 * del contenido generado dinámicamente.
 */
function escapeHtml(value) {

    const element = document.createElement("div");

    element.textContent = value ?? "";

    return element.innerHTML;
}

/**
 * Configura Google Places Autocomplete sobre el buscador.
 *
 * Características:
 * - Restringe las sugerencias a Costa Rica.
 * - Prioriza resultados del Valle Central.
 * - Obtiene las coordenadas exactas del lugar seleccionado.
 */
function initializePlacesAutocomplete() {

    const input = document.getElementById(
            "locationSearchInput"
            );

    if (!input) {

        console.warn(
                "No se encontró el campo #locationSearchInput."
                );

        return;
    }

    if (!AutocompleteClass) {

        console.warn(
                "Google Places todavía no está disponible."
                );

        return;
    }

    /*
     * Límites aproximados del Valle Central.
     *
     * No se utiliza strictBounds porque queremos
     * priorizar esta zona, pero seguir permitiendo
     * búsquedas en todo Costa Rica.
     */
    const valleCentralBounds =
            new google.maps.LatLngBounds(
                    {
                        lat: 9.70,
                        lng: -84.35
                    },
                    {
                        lat: 10.20,
                        lng: -83.75
                    }
            );

    placesAutocomplete =
            new AutocompleteClass(
                    input,
                    {
                        bounds: valleCentralBounds,

                        /*
                         * false significa que el Valle Central
                         * será una preferencia y no una
                         * restricción absoluta.
                         */
                        strictBounds: false,

                        /*
                         * Solo aparecen lugares ubicados
                         * dentro de Costa Rica.
                         */
                        componentRestrictions: {
                            country: "cr"
                        },

                        /*
                         * Solicitamos únicamente los datos
                         * que EasySpot realmente necesita.
                         */
                        fields: [
                            "place_id",
                            "name",
                            "formatted_address",
                            "geometry"
                        ]
                    }
            );

    placesAutocomplete.addListener(
            "place_changed",
            handleAutocompletePlaceSelected
            );

    /*
     * Si el usuario modifica manualmente el texto después
     * de seleccionar una sugerencia, invalidamos la
     * selección anterior.
     */
    input.addEventListener("input", () => {

        placeSelectedFromAutocomplete = false;

    });
}

/**
 * Procesa el lugar seleccionado en las sugerencias
 * de Google Places Autocomplete.
 */
function handleAutocompletePlaceSelected() {

    if (!placesAutocomplete) {
        return;
    }

    const place = placesAutocomplete.getPlace();

    if (!place?.geometry?.location) {

        placeSelectedFromAutocomplete = false;

        showSearchLocationMessage(
                "Selecciona una ubicación de la lista de sugerencias.",
                true
                );

        return;
    }

    const latitude =
            place.geometry.location.lat();

    const longitude =
            place.geometry.location.lng();

    const label =
            place.formatted_address
            || place.name
            || "Ubicación seleccionada";

    searchLocation = {
        lat: latitude,
        lng: longitude,
        label: label,
        placeId: place.place_id || null
    };

    placeSelectedFromAutocomplete = true;

    const input = document.getElementById(
            "locationSearchInput"
            );

    /*
     * Conservamos un nombre entendible en el formulario.
     * Este valor seguirá viajando al backend como q.
     */
    if (input) {

        input.value =
                place.name
                || place.formatted_address
                || input.value;
    }

    createOrUpdateSearchLocationMarker();

    updateParkingDistances();

    calculateAndApplySmartRecommendation();

    map.panTo({
        lat: latitude,
        lng: longitude
    });

    map.setZoom(15);

    showSearchLocationMessage(
            `Ubicación seleccionada: ${label}.`
            );
}

/**
 * Convierte una ubicación escrita por el usuario
 * en coordenadas mediante Google Geocoding.
 */
async function geocodeSearchLocation(searchText) {

    if (!GeocoderClass) {
        throw new Error(
                "El servicio de geocodificación todavía no está disponible."
                );
    }

    const geocoder = new GeocoderClass();

    const response = await geocoder.geocode({
        address: searchText,
        componentRestrictions: {
            country: "CR"
        }
    });

    if (!response.results || response.results.length === 0) {
        throw new Error(
                "No encontramos esa ubicación en Costa Rica."
                );
    }

    const result = response.results[0];
    const position = result.geometry.location;

    return {
        lat: position.lat(),
        lng: position.lng(),
        label: result.formatted_address
    };
}

/**
 * Procesa la ubicación escrita en el buscador.
 * Si el campo está vacío, utiliza la ubicación GPS.
 */
async function applyGeographicSearch() {

    const input = document.getElementById(
            "locationSearchInput"
            );

    const searchText = input?.value.trim() || "";

    /*
     * Si el usuario acaba de seleccionar una sugerencia de
     * Places y todavía estamos en la misma carga de página,
     * ya tenemos las coordenadas exactas.
     */
    if (placeSelectedFromAutocomplete && searchLocation) {

        createOrUpdateSearchLocationMarker();

        updateParkingDistances();

        calculateAndApplySmartRecommendation();

        map.panTo({
            lat: searchLocation.lat,
            lng: searchLocation.lng
        });

        map.setZoom(15);

        showSearchLocationMessage(
                `Mostrando parqueos cerca de ${searchLocation.label}.`
                );

        return;
    }

    if (!searchText) {

        if (!userLocation) {
            locateUser(true);
            return;
        }

        searchLocation = null;

        removeSearchLocationMarker();

        updateParkingDistances();
        calculateAndApplySmartRecommendation();

        centerMapOnUser();

        showSearchLocationMessage(
                "Usando tu ubicación actual."
                );

        return;
    }

    setSearchButtonLoading(true);

    try {

        const result = await geocodeSearchLocation(
                searchText
                );

        searchLocation = {
            lat: result.lat,
            lng: result.lng,
            label: result.label
        };

        createOrUpdateSearchLocationMarker();

        updateParkingDistances();

        calculateAndApplySmartRecommendation();

        map.panTo({
            lat: searchLocation.lat,
            lng: searchLocation.lng
        });

        map.setZoom(14);

        showSearchLocationMessage(
                `Mostrando parqueos cerca de ${result.label}.`
                );

    } catch (error) {

        console.error(
                "No se pudo procesar la ubicación:",
                error
                );

        showSearchLocationMessage(
                error.message || "No se pudo buscar la ubicación.",
                true
                );

    } finally {

        setSearchButtonLoading(false);
    }
}

/**
 * Crea un marcador para la ubicación buscada.
 */
function createOrUpdateSearchLocationMarker() {

    if (!map
            || !searchLocation
            || !AdvancedMarkerElementClass
            || !PinElementClass) {
        return;
    }

    const position = {
        lat: searchLocation.lat,
        lng: searchLocation.lng
    };

    if (searchLocationMarker) {
        searchLocationMarker.position = position;
        return;
    }

    const pin = new PinElementClass({
        background: "#f59e0b",
        borderColor: "#d97706",
        glyphColor: "#ffffff",
        glyph: "●",
        scale: 1.15
    });

    searchLocationMarker =
            new AdvancedMarkerElementClass({
                map: map,
                position: position,
                title: "Ubicación buscada",
                content: pin.element,
                zIndex: 2100
            });
}

/**
 * Elimina el marcador de la ubicación buscada.
 */
function removeSearchLocationMarker() {

    if (!searchLocationMarker) {
        return;
    }

    searchLocationMarker.map = null;
    searchLocationMarker = null;
}

/**
 * Muestra un mensaje indicando el origen de la búsqueda.
 */
function showSearchLocationMessage(
        message,
        isError = false
        ) {

    let element = document.getElementById(
            "searchLocationMessage"
            );

    if (!element) {

        element = document.createElement("div");
        element.id = "searchLocationMessage";
        element.className = "search-location-message";

        const searchPanel = document.querySelector(
                ".search-panel"
                );

        searchPanel?.insertAdjacentElement(
                "afterend",
                element
                );
    }

    element.classList.toggle(
            "error",
            isError
            );

    element.innerHTML = `
        <i class="fa-solid ${
            isError
            ? "fa-circle-exclamation"
            : "fa-location-dot"
            }"></i>

        <span>${escapeHtml(message)}</span>
    `;
}

/**
 * Cambia temporalmente el estado del botón de búsqueda.
 */
function setSearchButtonLoading(isLoading) {

    const button = document.querySelector(
            ".search-btn"
            );

    if (!button) {
        return;
    }

    button.disabled = isLoading;

    button.innerHTML = isLoading
            ? `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Buscando
              `
            : `
                <i class="fa-solid fa-magnifying-glass"></i>
                Aplicar filtros
              `;
}

/**
 * Crea la reservación a la hora de querer 
 * reservar desde el mapa de google
 */
function createReservationUrl(parkingId) {

    const fecha = document.querySelector('input[name="fecha"]')?.value;
    const horaInicio = document.querySelector('input[name="horaInicio"]')?.value;
    const horaSalida = document.querySelector('input[name="horaSalida"]')?.value;

    const params = new URLSearchParams();

    params.set("idParqueo", parkingId);

    if (fecha) {
        params.set("fecha", fecha);
    }

    if (horaInicio) {
        params.set("horaInicio", horaInicio);
    }

    if (horaSalida) {
        params.set("horaSalida", horaSalida);
    }

    return `/reservas/nueva?${params.toString()}`;
}

/**
 * Si el dashboard se abrió con ?idParqueo=,
 * selecciona automáticamente ese parqueo
 * y muestra la ruta.
 */
function openParkingFromUrl() {

    const params = new URLSearchParams(window.location.search);

    const parkingId = params.get("idParqueo");

    if (!parkingId) {
        return;
    }

    // Abre el marcador
    focusParkingOnMap(parkingId);

    // Espera un momento para que termine
    // de cargar el mapa y obtener ubicación.
    setTimeout(() => {

        if (userLocation) {
            showRouteToParking(parkingId);
        }

    }, 1200);

}

function connectRadiusSelector() {

    const radios =
            document.querySelectorAll(
                    'input[name="searchRadius"]'
                    );

    radios.forEach((radio) => {

        radio.addEventListener("change", () => {

            currentSearchRadius =
                    Number(radio.value);

            applyRadiusFilter();

        });

    });

}

/**
 * Coloca la fecha y hora actuales del dispositivo
 * cuando el usuario entra por primera vez al Dashboard.
 *
 * Hora de salida = hora de entrada + 1 hora.
 */
function initializeReservationDateTime() {

    const fechaInput =
            document.querySelector('input[name="fecha"]');

    const horaInicioInput =
            document.querySelector('input[name="horaInicio"]');

    const horaSalidaInput =
            document.querySelector('input[name="horaSalida"]');

    if (!fechaInput || !horaInicioInput || !horaSalidaInput) {
        return;
    }

    const params =
            new URLSearchParams(window.location.search);

    /*
     * Si el usuario ya seleccionó horas
     * y estas vienen en la URL, se respetan.
     */
    if (params.has("horaInicio")
            || params.has("horaSalida")) {
        return;
    }

    const ahora = new Date();

    const year = ahora.getFullYear();

    const month =
            String(ahora.getMonth() + 1)
                    .padStart(2, "0");

    const day =
            String(ahora.getDate())
                    .padStart(2, "0");

    fechaInput.value =
            `${year}-${month}-${day}`;

    const horaInicio =
            `${String(ahora.getHours()).padStart(2, "0")}:`
            + `${String(ahora.getMinutes()).padStart(2, "0")}`;

    horaInicioInput.value = horaInicio;

    /*
     * Salida = una hora después.
     */
    const salida =
            new Date(
                    ahora.getTime()
                    + 60 * 60 * 1000
            );

    const horaSalida =
            `${String(salida.getHours()).padStart(2, "0")}:`
            + `${String(salida.getMinutes()).padStart(2, "0")}`;

    /*
     * Como el modelo actual no maneja fecha de salida,
     * evitamos cruzar medianoche.
     */
    if (salida.getDate() !== ahora.getDate()) {

        horaSalidaInput.value = "23:59";

    } else {

        horaSalidaInput.value = horaSalida;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    
    initializeReservationDateTime();
    
    /*
     * =====================================================
     * BÚSQUEDA GEOGRÁFICA
     * =====================================================
     *
     * El formulario se envía normalmente al backend.
     * Spring aplica:
     *
     * - precio máximo
     * - espacios mínimos
     * - tipo de parqueo
     * - fecha
     * - horas
     *
     * Cuando el Dashboard vuelve a cargar, si existe una
     * ubicación escrita en el campo q, JavaScript la
     * convierte en coordenadas mediante Google Geocoding.
     */

    const locationInput = document.getElementById("locationSearchInput");

    const searchForm = document.getElementById(
            "parkingSearchForm"
            );

    if (searchForm && locationInput) {

        searchForm.addEventListener("submit", () => {
            /*
             * Si no seleccionó una sugerencia, permitimos que
             * el formulario continúe normalmente. Al recargar,
             * EasySpot usará Geocoding como respaldo.
             */
            if (locationInput.value.trim() && !placeSelectedFromAutocomplete) {

                console.info("No se seleccionó una sugerencia; se utilizará Geocoding.");
            }
        });
    }

    const hasSearchLocation =
            Boolean(locationInput?.value.trim());

    /*
     * Google Maps se carga de forma asíncrona.
     *
     * Por eso no llamamos inmediatamente a
     * applyGeographicSearch(), ya que todavía puede que:
     *
     * - el mapa no exista;
     * - GeocoderClass no esté disponible;
     * - los marcadores no estén registrados.
     *
     * initMap() será quien aplicará la búsqueda cuando
     * Google Maps termine de cargar.
     */
    if (hasSearchLocation) {

        document.body.dataset.pendingGeographicSearch =
                "true";
    }

    /*
     * =====================================================
     * BOTONES DE RESERVA DE LAS TARJETAS
     * =====================================================
     *
     * Se construye la URL usando la fecha y horas que
     * estén actualmente escritas en los campos.
     */

    document.querySelectorAll(
            ".reserve-link"
            ).forEach((link) => {

        link.addEventListener("click", (event) => {

            event.preventDefault();

            const parkingId = link.dataset.id;

            if (!parkingId) {

                console.warn(
                        "El botón de reserva no tiene un ID de parqueo."
                        );

                return;
            }

            window.location.href =
                    createReservationUrl(parkingId);
        });
    });

});

/*
 * Google Maps ejecutará esta función
 * cuando termine de cargar la API.
 */
window.showRouteToParking = showRouteToParking;
window.clearActiveRoute = clearActiveRoute;
window.centerActiveRoute = centerActiveRoute;
window.initMap = initMap;
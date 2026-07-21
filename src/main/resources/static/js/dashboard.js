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

let AdvancedMarkerElementClass = null;
let PinElementClass = null;
let RouteClass = null;

let activeRoute = null;
let activeRoutePolylines = [];
let activeRouteParkingId = null;

const markerRegistry = new Map();
const infoWindowRegistry = new Map();
const parkingDataRegistry = new Map();

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

        const {
            AdvancedMarkerElement,
            PinElement
        } = await google.maps.importLibrary("marker");

        const {Route} = await google.maps.importLibrary("routes");

        AdvancedMarkerElementClass = AdvancedMarkerElement;
        PinElementClass = PinElement;
        RouteClass = Route;

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

            const pin = new PinElement({
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

        locateUser(true);

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
        precio: Number(item.dataset.precio),
        espacios: Number(item.dataset.espacios),
        calificacion: Number(item.dataset.calificacion),
        mejor: item.dataset.mejor === "true",
        distanceMeters: null
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

            sortParkingCardsByDistance();

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

        sortParkingCardsByDistance();

        showLocationAccuracy();

        showLocationButtonState(
                "success",
                "Mi ubicación"
                );

        if (centerMap) {
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

    if (!userLocation) {
        return;
    }

    parkingDataRegistry.forEach(
            (parking, parkingId) => {

        if (!hasValidCoordinates(parking)) {
            return;
        }

        const distanceMeters =
                calculateDistanceMeters(
                        userLocation.lat,
                        userLocation.lng,
                        parking.latitud,
                        parking.longitud
                        );

        parking.distanceMeters =
                distanceMeters;

        updateParkingCardDistance(
                parkingId,
                distanceMeters
                );

        refreshParkingInfoWindow(
                parkingId,
                parking
                );
    }
    );
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

/*
 * Google Maps ejecutará esta función
 * cuando termine de cargar la API.
 */
window.showRouteToParking = showRouteToParking;
window.clearActiveRoute = clearActiveRoute;
window.centerActiveRoute = centerActiveRoute;
window.initMap = initMap;
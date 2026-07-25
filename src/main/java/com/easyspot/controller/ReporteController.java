/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.controller;

// Importes del dominio
import com.easyspot.domain.EstadoReporte;
import com.easyspot.domain.Parqueo;
import com.easyspot.domain.PrioridadReporte;
import com.easyspot.domain.Reporte;
import com.easyspot.domain.TipoReporte;
import com.easyspot.domain.TipoVoto;
import com.easyspot.domain.Usuario;

// Importes de servicios
import com.easyspot.service.ParqueoService;
import com.easyspot.service.ReporteService;

// Importes de Jakarta
import jakarta.servlet.http.HttpSession;

// Importes de Java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

// Importes de Spring
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

/**
 *
 * @author XPC
 */
@Controller
@RequestMapping("/reportes")
public class ReporteController {

    //==========================================================================
    // CONSTANTES
    //==========================================================================
    /**
     * Nombre utilizado para guardar al usuario autenticado en la sesión.
     */
    private static final String USUARIO_SESION = "usuarioLogueado";

    /**
     * Directorio donde se almacenan las imágenes de los reportes.
     */
    private static final String DIRECTORIO_IMAGENES
            = "src/main/resources/static/uploads/reportes";

    /**
     * Tamaño máximo permitido para una imagen: 5 MB.
     */
    private static final long TAMANO_MAXIMO_IMAGEN
            = 5L * 1024L * 1024L;

    //==========================================================================
    // SERVICIOS
    //==========================================================================
    private final ReporteService reporteService;
    private final ParqueoService parqueoService;

    //==========================================================================
    // CONSTRUCTOR
    //==========================================================================
    public ReporteController(
            ReporteService reporteService,
            ParqueoService parqueoService) {

        this.reporteService = reporteService;
        this.parqueoService = parqueoService;
    }

    //==========================================================================
    // VISTA PRINCIPAL
    //==========================================================================
    /**
     * Muestra la página principal de reportes comunitarios.
     *
     * Permite aplicar filtros por:
     *
     * - Texto.
     * - Estado.
     * - Tipo.
     *
     * @param texto texto que se desea buscar
     * @param estado estado seleccionado
     * @param tipo tipo seleccionado
     * @param session sesión HTTP
     * @param model modelo de Thymeleaf
     * @return vista de reportes
     */
    @GetMapping
    public String mostrarReportes(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) EstadoReporte estado,
            @RequestParam(required = false) TipoReporte tipo,
            HttpSession session,
            Model model) {

        Usuario usuarioLogueado = obtenerUsuarioLogueado(session);

        List<Reporte> reportes = obtenerReportesFiltrados(
                texto,
                estado,
                tipo
        );

        cargarDatosVista(
                model,
                reportes,
                usuarioLogueado,
                texto,
                estado,
                tipo
        );

        return "reportes";
    }

    //==========================================================================
    // CREACIÓN DE REPORTES
    //==========================================================================
    /**
     * Registra un nuevo reporte comunitario.
     *
     * @param idParqueo identificador del parqueo
     * @param tipo tipo de incidente
     * @param titulo título del reporte
     * @param descripcion descripción del incidente
     * @param ubicacion ubicación indicada
     * @param prioridad prioridad del reporte
     * @param latitud coordenada de latitud
     * @param longitud coordenada de longitud
     * @param imagen imagen opcional
     * @param session sesión HTTP
     * @return redirección hacia la página de reportes
     */
    @PostMapping("/crear")
    public String crearReporte(
            @RequestParam Long idParqueo,
            @RequestParam TipoReporte tipo,
            @RequestParam String titulo,
            @RequestParam String descripcion,
            @RequestParam String ubicacion,
            @RequestParam(required = false) PrioridadReporte prioridad,
            @RequestParam(required = false) Double latitud,
            @RequestParam(required = false) Double longitud,
            @RequestParam(
                    required = false,
                    name = "imagen"
            ) MultipartFile imagen,
            HttpSession session) {

        Usuario usuarioLogueado = obtenerUsuarioLogueado(session);

        if (usuarioLogueado == null) {
            return "redirect:/login?sesionRequerida";
        }

        Parqueo parqueo = parqueoService.obtenerPorId(idParqueo);

        if (parqueo == null) {
            return "redirect:/reportes?parqueoNoEncontrado";
        }

        String tituloLimpio = limpiarTexto(titulo);
        String descripcionLimpia = limpiarTexto(descripcion);
        String ubicacionLimpia = limpiarTexto(ubicacion);

        if (tituloLimpio == null
                || descripcionLimpia == null
                || ubicacionLimpia == null) {

            return "redirect:/reportes?datosIncompletos";
        }

        if (tituloLimpio.length() > 100) {
            return "redirect:/reportes?tituloMuyLargo";
        }

        if (descripcionLimpia.length() > 700) {
            return "redirect:/reportes?descripcionMuyLarga";
        }

        if (ubicacionLimpia.length() > 200) {
            return "redirect:/reportes?ubicacionMuyLarga";
        }

        Reporte reporte = new Reporte();

        reporte.setUsuario(usuarioLogueado);
        reporte.setParqueo(parqueo);
        reporte.setTipo(tipo);
        reporte.setTitulo(tituloLimpio);
        reporte.setDescripcion(descripcionLimpia);
        reporte.setUbicacion(ubicacionLimpia);
        reporte.setLatitud(latitud);
        reporte.setLongitud(longitud);
        reporte.setEstado(EstadoReporte.ACTIVO);

        if (prioridad != null) {
            reporte.setPrioridad(prioridad);
        }

        try {
            String imagenUrl = guardarImagen(imagen);
            reporte.setImagenUrl(imagenUrl);
        } catch (IllegalArgumentException ex) {
            return "redirect:/reportes?imagenInvalida";
        } catch (IOException ex) {
            return "redirect:/reportes?errorImagen";
        }

        reporteService.guardarReporte(reporte);

        return "redirect:/reportes?reporteCreado";
    }

    //==========================================================================
    // DETALLE DE UN REPORTE
    //==========================================================================
    /**
     * Obtiene la información de un reporte específico en formato JSON.
     *
     * @param idReporte identificador del reporte
     * @return respuesta JSON
     */
    @GetMapping("/{idReporte}")
    public ResponseEntity<Map<String, Object>> obtenerReporte(
            @PathVariable Long idReporte) {

        Optional<Reporte> reporteEncontrado
                = reporteService.obtenerReportePorId(idReporte);

        if (reporteEncontrado.isEmpty()) {
            return crearRespuestaError(
                    HttpStatus.NOT_FOUND,
                    "El reporte solicitado no existe."
            );
        }

        Reporte reporte = reporteEncontrado.get();

        Map<String, Object> respuesta = construirDatosReporte(reporte);

        respuesta.put("exito", true);

        return ResponseEntity.ok(respuesta);
    }

    //==========================================================================
    // VOTACIONES
    //==========================================================================
    /**
     * Registra, cambia o elimina el voto de un usuario.
     *
     * Comportamiento:
     *
     * - Si no existe voto, se crea.
     * - Si existe el voto contrario, se reemplaza.
     * - Si se selecciona nuevamente el mismo voto, se elimina.
     *
     * @param idReporte identificador del reporte
     * @param tipoVoto tipo de voto
     * @param session sesión HTTP
     * @return resultado de la votación
     */
    @PostMapping("/{idReporte}/votar")
    public ResponseEntity<Map<String, Object>> votarReporte(
            @PathVariable Long idReporte,
            @RequestParam TipoVoto tipoVoto,
            HttpSession session) {

        Usuario usuarioLogueado = obtenerUsuarioLogueado(session);

        if (usuarioLogueado == null) {
            return crearRespuestaError(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesión para votar."
            );
        }

        if (!reporteService.existeReporte(idReporte)) {
            return crearRespuestaError(
                    HttpStatus.NOT_FOUND,
                    "El reporte no existe."
            );
        }

        Reporte reporteActualizado = reporteService.votarReporte(
                idReporte,
                usuarioLogueado.getIdUsuario(),
                tipoVoto
        );

        Map<String, Object> respuesta = new LinkedHashMap<>();

        respuesta.put("exito", true);
        respuesta.put(
                "mensaje",
                "La votación se procesó correctamente."
        );
        respuesta.put(
                "idReporte",
                reporteActualizado.getIdReporte()
        );
        respuesta.put(
                "votosPositivos",
                valorSeguro(reporteActualizado.getVotosPositivos())
        );
        respuesta.put(
                "votosNegativos",
                valorSeguro(reporteActualizado.getVotosNegativos())
        );
        respuesta.put(
                "porcentajeConfianza",
                valorSeguro(reporteActualizado.getPorcentajeConfianza())
        );

        reporteService.obtenerVotoUsuario(
                idReporte,
                usuarioLogueado.getIdUsuario()
        ).ifPresentOrElse(
                voto -> respuesta.put(
                        "votoActual",
                        voto.getTipo().name()
                ),
                () -> respuesta.put("votoActual", null)
        );

        return ResponseEntity.ok(respuesta);
    }

    //==========================================================================
    // CAMBIO DE ESTADO
    //==========================================================================
    /**
     * Cambia el estado de un reporte.
     *
     * @param idReporte identificador del reporte
     * @param estado nuevo estado
     * @param session sesión HTTP
     * @return respuesta JSON
     */
    @PostMapping("/{idReporte}/estado")
    public ResponseEntity<Map<String, Object>> cambiarEstado(
            @PathVariable Long idReporte,
            @RequestParam EstadoReporte estado,
            HttpSession session) {

        Usuario usuarioLogueado = obtenerUsuarioLogueado(session);

        if (usuarioLogueado == null) {
            return crearRespuestaError(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesión para cambiar el estado."
            );
        }

        Optional<Reporte> reporteEncontrado
                = reporteService.obtenerReportePorId(idReporte);

        if (reporteEncontrado.isEmpty()) {
            return crearRespuestaError(
                    HttpStatus.NOT_FOUND,
                    "El reporte no existe."
            );
        }

        Reporte reporte = reporteEncontrado.get();

        /*
         * Por seguridad, únicamente el creador del reporte puede cambiar
         * su estado.
         */
        if (!esPropietario(reporte, usuarioLogueado)) {
            return crearRespuestaError(
                    HttpStatus.FORBIDDEN,
                    "No tiene permiso para modificar este reporte."
            );
        }

        Reporte reporteActualizado = reporteService.cambiarEstado(
                idReporte,
                estado
        );

        Map<String, Object> respuesta = new LinkedHashMap<>();

        respuesta.put("exito", true);
        respuesta.put(
                "mensaje",
                "El estado del reporte se actualizó correctamente."
        );
        respuesta.put(
                "idReporte",
                reporteActualizado.getIdReporte()
        );
        respuesta.put(
                "estado",
                reporteActualizado.getEstado().name()
        );

        return ResponseEntity.ok(respuesta);
    }

    //==========================================================================
    // ELIMINACIÓN
    //==========================================================================
    /**
     * Elimina un reporte.
     *
     * Únicamente el usuario que creó el reporte puede eliminarlo.
     *
     * @param idReporte identificador del reporte
     * @param session sesión HTTP
     * @return respuesta JSON
     */
    @DeleteMapping("/{idReporte}")
    public ResponseEntity<Map<String, Object>> eliminarReporte(
            @PathVariable Long idReporte,
            HttpSession session) {

        Usuario usuarioLogueado = obtenerUsuarioLogueado(session);

        if (usuarioLogueado == null) {
            return crearRespuestaError(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesión para eliminar el reporte."
            );
        }

        Optional<Reporte> reporteEncontrado
                = reporteService.obtenerReportePorId(idReporte);

        if (reporteEncontrado.isEmpty()) {
            return crearRespuestaError(
                    HttpStatus.NOT_FOUND,
                    "El reporte no existe."
            );
        }

        Reporte reporte = reporteEncontrado.get();

        if (!esPropietario(reporte, usuarioLogueado)) {
            return crearRespuestaError(
                    HttpStatus.FORBIDDEN,
                    "No tiene permiso para eliminar este reporte."
            );
        }

        eliminarImagenReporte(reporte);

        reporteService.eliminarReporte(idReporte);

        Map<String, Object> respuesta = new LinkedHashMap<>();

        respuesta.put("exito", true);
        respuesta.put(
                "mensaje",
                "El reporte se eliminó correctamente."
        );
        respuesta.put("idReporte", idReporte);

        return ResponseEntity.ok(respuesta);
    }

    //==========================================================================
    // MÉTODOS PARA LA VISTA
    //==========================================================================
    /**
     * Carga los atributos utilizados por Thymeleaf.
     */
    private void cargarDatosVista(
            Model model,
            List<Reporte> reportes,
            Usuario usuarioLogueado,
            String texto,
            EstadoReporte estado,
            TipoReporte tipo) {

        model.addAttribute("reportes", reportes);
        model.addAttribute(
                "parqueos",
                parqueoService.obtenerParqueosActivos()
        );

        model.addAttribute("usuarioLogueado", usuarioLogueado);
        model.addAttribute("sesionIniciada", usuarioLogueado != null);

        model.addAttribute("tiposReporte", TipoReporte.values());
        model.addAttribute("estadosReporte", EstadoReporte.values());
        model.addAttribute(
                "prioridadesReporte",
                PrioridadReporte.values()
        );

        model.addAttribute("textoBusqueda", texto);
        model.addAttribute("estadoSeleccionado", estado);
        model.addAttribute("tipoSeleccionado", tipo);

        // Estadísticas generales
        model.addAttribute(
                "totalReportes",
                reporteService.contarReportes()
        );
        model.addAttribute(
                "reportesActivos",
                reporteService.contarReportesPorEstado(
                        EstadoReporte.ACTIVO
                )
        );
        model.addAttribute(
                "reportesHoy",
                reporteService.contarReportesHoy()
        );
        model.addAttribute(
                "reportesUltimaHora",
                reporteService.contarReportesUltimaHora()
        );
        model.addAttribute(
                "tipoMasFrecuente",
                reporteService.obtenerTipoMasFrecuente()
        );
        model.addAttribute(
                "zonaMasActiva",
                reporteService.obtenerZonaMasActiva()
        );
        model.addAttribute(
                "insightComunitario",
                reporteService.generarInsightComunitario()
        );
    }

    /**
     * Determina qué lista de reportes debe mostrarse según los filtros.
     */
    private List<Reporte> obtenerReportesFiltrados(
            String texto,
            EstadoReporte estado,
            TipoReporte tipo) {

        String textoLimpio = limpiarTexto(texto);

        /*
         * El servicio actual tiene métodos separados para cada filtro.
         * Se aplica una prioridad de filtrado:
         *
         * 1. Texto.
         * 2. Estado.
         * 3. Tipo.
         * 4. Todos los reportes recientes.
         */
        if (textoLimpio != null) {
            return reporteService.buscarReportes(textoLimpio);
        }

        if (estado != null) {
            return reporteService.obtenerReportesPorEstado(estado);
        }

        if (tipo != null) {
            return reporteService.obtenerReportesPorTipo(tipo);
        }

        return reporteService.obtenerReportesRecientes();
    }

    //==========================================================================
    // MANEJO DE IMÁGENES
    //==========================================================================
    /**
     * Guarda una imagen dentro del directorio estático del proyecto.
     *
     * @param imagen archivo enviado desde el formulario
     * @return URL pública de la imagen
     * @throws IOException si ocurre un error al guardar
     */
    private String guardarImagen(
            MultipartFile imagen) throws IOException {

        if (imagen == null || imagen.isEmpty()) {
            return null;
        }

        validarImagen(imagen);

        String nombreOriginal = StringUtils.cleanPath(
                Optional.ofNullable(imagen.getOriginalFilename())
                        .orElse("imagen")
        );

        String extension = obtenerExtension(nombreOriginal);

        String nombreArchivo
                = UUID.randomUUID().toString()
                + extension;

        Path directorio = Paths.get(DIRECTORIO_IMAGENES)
                .toAbsolutePath()
                .normalize();

        Files.createDirectories(directorio);

        Path destino = directorio.resolve(nombreArchivo).normalize();

        /*
         * Evita que un nombre manipulado pueda escribir archivos fuera
         * del directorio permitido.
         */
        if (!destino.startsWith(directorio)) {
            throw new IllegalArgumentException(
                    "La ruta de la imagen no es válida."
            );
        }

        Files.copy(
                imagen.getInputStream(),
                destino,
                StandardCopyOption.REPLACE_EXISTING
        );

        return "/uploads/reportes/" + nombreArchivo;
    }

    /**
     * Verifica el tipo y tamaño del archivo.
     */
    private void validarImagen(MultipartFile imagen) {

        if (imagen.getSize() > TAMANO_MAXIMO_IMAGEN) {
            throw new IllegalArgumentException(
                    "La imagen supera el tamaño máximo permitido."
            );
        }

        String contentType = imagen.getContentType();

        if (contentType == null
                || (!contentType.equals("image/jpeg")
                && !contentType.equals("image/png")
                && !contentType.equals("image/webp"))) {

            throw new IllegalArgumentException(
                    "El formato de la imagen no está permitido."
            );
        }
    }

    /**
     * Obtiene la extensión del archivo.
     */
    private String obtenerExtension(String nombreArchivo) {

        int posicionPunto = nombreArchivo.lastIndexOf('.');

        if (posicionPunto < 0) {
            return "";
        }

        String extension = nombreArchivo
                .substring(posicionPunto)
                .toLowerCase();

        return switch (extension) {
            case ".jpg", ".jpeg", ".png", ".webp" -> extension;
            default -> "";
        };
    }

    /**
     * Elimina la imagen asociada a un reporte.
     */
    private void eliminarImagenReporte(Reporte reporte) {

        String imagenUrl = reporte.getImagenUrl();

        if (imagenUrl == null || imagenUrl.isBlank()) {
            return;
        }

        String prefijo = "/uploads/reportes/";

        if (!imagenUrl.startsWith(prefijo)) {
            return;
        }

        String nombreArchivo = imagenUrl.substring(prefijo.length());

        if (nombreArchivo.isBlank()
                || nombreArchivo.contains("/")
                || nombreArchivo.contains("\\")
                || nombreArchivo.contains("..")) {

            return;
        }

        try {
            Path rutaImagen = Paths.get(DIRECTORIO_IMAGENES)
                    .toAbsolutePath()
                    .normalize()
                    .resolve(nombreArchivo)
                    .normalize();

            Files.deleteIfExists(rutaImagen);

        } catch (IOException ex) {
            /*
             * La eliminación de la imagen no debe impedir que el reporte
             * sea eliminado de la base de datos.
             */
        }
    }

    //==========================================================================
    // MÉTODOS AUXILIARES
    //==========================================================================
    /**
     * Obtiene al usuario guardado por AuthController en la sesión.
     */
    private Usuario obtenerUsuarioLogueado(HttpSession session) {

        Object usuario = session.getAttribute(USUARIO_SESION);

        if (usuario instanceof Usuario usuarioLogueado) {
            return usuarioLogueado;
        }

        return null;
    }

    /**
     * Comprueba si el usuario es el creador del reporte.
     */
    private boolean esPropietario(
            Reporte reporte,
            Usuario usuario) {

        if (reporte == null
                || reporte.getUsuario() == null
                || usuario == null
                || reporte.getUsuario().getIdUsuario() == null
                || usuario.getIdUsuario() == null) {

            return false;
        }

        return reporte.getUsuario()
                .getIdUsuario()
                .equals(usuario.getIdUsuario());
    }

    /**
     * Construye una respuesta con la información básica de un reporte.
     */
    private Map<String, Object> construirDatosReporte(
            Reporte reporte) {

        Map<String, Object> datos = new LinkedHashMap<>();

        datos.put("idReporte", reporte.getIdReporte());
        datos.put("titulo", reporte.getTitulo());
        datos.put("descripcion", reporte.getDescripcion());
        datos.put("ubicacion", reporte.getUbicacion());
        datos.put(
                "tipo",
                reporte.getTipo() == null
                        ? null
                        : reporte.getTipo().name()
        );
        datos.put(
                "estado",
                reporte.getEstado() == null
                        ? null
                        : reporte.getEstado().name()
        );
        datos.put(
                "prioridad",
                reporte.getPrioridad() == null
                        ? null
                        : reporte.getPrioridad().name()
        );
        datos.put("imagenUrl", reporte.getImagenUrl());
        datos.put("latitud", reporte.getLatitud());
        datos.put("longitud", reporte.getLongitud());
        datos.put(
                "votosPositivos",
                valorSeguro(reporte.getVotosPositivos())
        );
        datos.put(
                "votosNegativos",
                valorSeguro(reporte.getVotosNegativos())
        );
        datos.put(
                "porcentajeConfianza",
                valorSeguro(reporte.getPorcentajeConfianza())
        );
        datos.put("fechaCreacion", reporte.getFechaCreacion());

        if (reporte.getParqueo() != null) {
            datos.put(
                    "idParqueo",
                    reporte.getParqueo().getIdParqueo()
            );
            datos.put(
                    "nombreParqueo",
                    reporte.getParqueo().getNombre()
            );
        }

        if (reporte.getUsuario() != null) {
            datos.put(
                    "nombreUsuario",
                    reporte.getUsuario().getNombre()
            );
        }

        return datos;
    }

    /**
     * Elimina espacios innecesarios y transforma cadenas vacías en null.
     */
    private String limpiarTexto(String texto) {

        if (texto == null) {
            return null;
        }

        String resultado = texto.trim();

        return resultado.isEmpty() ? null : resultado;
    }

    /**
     * Evita valores nulos en las estadísticas.
     */
    private int valorSeguro(Integer valor) {
        return valor == null ? 0 : valor;
    }

    /**
     * Crea una respuesta JSON de error.
     */
    private ResponseEntity<Map<String, Object>> crearRespuestaError(
            HttpStatus estado,
            String mensaje) {

        Map<String, Object> respuesta = new LinkedHashMap<>();

        respuesta.put("exito", false);
        respuesta.put("mensaje", mensaje);
        respuesta.put("codigo", estado.value());

        return ResponseEntity
                .status(estado)
                .body(respuesta);
    }

    //==========================================================================
    // MANEJO GENERAL DE ERRORES
    //==========================================================================
    /**
     * Captura errores por parámetros inválidos, como valores de enums
     * incorrectos.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> manejarArgumentoInvalido(
            IllegalArgumentException ex) {

        String mensaje = ex.getMessage();

        if (mensaje == null || mensaje.isBlank()) {
            mensaje = "Uno de los datos enviados no es válido.";
        }

        return crearRespuestaError(
                HttpStatus.BAD_REQUEST,
                mensaje
        );
    }
}

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.impl;

// Entidades
import com.easyspot.domain.EstadoReporte;
import com.easyspot.domain.PrioridadReporte;
import com.easyspot.domain.Reporte;
import com.easyspot.domain.TipoReporte;
import com.easyspot.domain.TipoVoto;
import com.easyspot.domain.Usuario;
import com.easyspot.domain.VotoReporte;

// Repositorios
import com.easyspot.repository.ReporteRepository;
import com.easyspot.repository.UsuarioRepository;
import com.easyspot.repository.VotoReporteRepository;

// Servicio
import com.easyspot.service.ReporteService;

// Java
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

// Spring
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author XPC
 */
@Service
@Transactional
public class ReporteServiceImpl implements ReporteService {

    private final ReporteRepository reporteRepository;
    private final UsuarioRepository usuarioRepository;
    private final VotoReporteRepository votoReporteRepository;

    /**
     * Constructor con inyección de dependencias.
     *
     * @param reporteRepository repositorio de reportes
     * @param usuarioRepository repositorio de usuarios
     * @param votoReporteRepository repositorio de votos
     */
    public ReporteServiceImpl(
            ReporteRepository reporteRepository,
            UsuarioRepository usuarioRepository,
            VotoReporteRepository votoReporteRepository) {

        this.reporteRepository = reporteRepository;
        this.usuarioRepository = usuarioRepository;
        this.votoReporteRepository = votoReporteRepository;
    }

    //==========================================================================
    // OPERACIONES PRINCIPALES
    //==========================================================================
    /**
     * Obtiene todos los reportes registrados.
     *
     * @return lista completa de reportes
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportes() {
        return reporteRepository.findAll();
    }

    /**
     * Obtiene todos los reportes ordenados desde el más reciente.
     *
     * @return lista de reportes ordenada por fecha de creación
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesRecientes() {
        return reporteRepository.findAll(
                Sort.by(
                        Sort.Direction.DESC,
                        "fechaCreacion"
                )
        );
    }

    /**
     * Busca un reporte mediante su identificador.
     *
     * @param idReporte identificador del reporte
     * @return reporte encontrado
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<Reporte> obtenerReportePorId(Long idReporte) {
        validarId(idReporte, "reporte");

        return reporteRepository.findById(idReporte);
    }

    /**
     * Guarda un reporte nuevo o actualiza uno existente.
     *
     * @param reporte reporte que se desea guardar
     * @return reporte almacenado
     */
    @Override
    public Reporte guardarReporte(Reporte reporte) {
        if (reporte == null) {
            throw new IllegalArgumentException(
                    "El reporte no puede ser nulo."
            );
        }

        if (reporte.getTipo() == null) {
            throw new IllegalArgumentException(
                    "El tipo del reporte es obligatorio."
            );
        }

        if (reporte.getTitulo() == null
                || reporte.getTitulo().isBlank()) {

            throw new IllegalArgumentException(
                    "El título del reporte es obligatorio."
            );
        }

        if (reporte.getDescripcion() == null
                || reporte.getDescripcion().isBlank()) {

            throw new IllegalArgumentException(
                    "La descripción del reporte es obligatoria."
            );
        }

        if (reporte.getUbicacion() == null
                || reporte.getUbicacion().isBlank()) {

            throw new IllegalArgumentException(
                    "La ubicación del reporte es obligatoria."
            );
        }

        /*
         * Se calcula una prioridad automática únicamente cuando el reporte
         * todavía no tiene una prioridad asignada.
         */
        if (reporte.getPrioridad() == null) {
            reporte.setPrioridad(
                    determinarPrioridad(reporte.getTipo())
            );
        }

        if (reporte.getEstado() == null) {
            reporte.setEstado(EstadoReporte.ACTIVO);
        }

        if (reporte.getVotosPositivos() == null) {
            reporte.setVotosPositivos(0);
        }

        if (reporte.getVotosNegativos() == null) {
            reporte.setVotosNegativos(0);
        }

        if (reporte.getPorcentajeConfianza() == null) {
            reporte.setPorcentajeConfianza(0);
        }

        return reporteRepository.save(reporte);
    }

    /**
     * Elimina un reporte mediante su identificador.
     *
     * Los votos asociados también deberían eliminarse automáticamente si
     * Reporte.java tiene configurada la relación con cascade y orphanRemoval.
     *
     * @param idReporte identificador del reporte
     */
    @Override
    public void eliminarReporte(Long idReporte) {
        validarId(idReporte, "reporte");

        Reporte reporte = buscarReporteObligatorio(idReporte);

        /*
         * Se eliminan primero los votos para evitar problemas de integridad
         * referencial aunque la entidad no tenga eliminación en cascada.
         */
        List<VotoReporte> votos
                = votoReporteRepository.findByReporteIdReporte(idReporte);

        if (!votos.isEmpty()) {
            votoReporteRepository.deleteAll(votos);
        }

        reporteRepository.delete(reporte);
    }

    /**
     * Verifica si un reporte existe.
     *
     * @param idReporte identificador del reporte
     * @return true si existe
     */
    @Override
    @Transactional(readOnly = true)
    public boolean existeReporte(Long idReporte) {
        return idReporte != null
                && idReporte > 0
                && reporteRepository.existsById(idReporte);
    }

    //==========================================================================
    // REPORTES POR ESTADO
    //==========================================================================
    /**
     * Obtiene los reportes asociados a un estado.
     *
     * @param estado estado del reporte
     * @return lista de reportes
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesPorEstado(
            EstadoReporte estado) {

        if (estado == null) {
            throw new IllegalArgumentException(
                    "El estado del reporte es obligatorio."
            );
        }

        return reporteRepository
                .findByEstadoOrderByFechaCreacionDesc(estado);
    }

    /**
     * Obtiene los reportes activos.
     *
     * @return reportes activos
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesActivos() {
        return reporteRepository
                .findByEstadoOrderByFechaCreacionDesc(
                        EstadoReporte.ACTIVO
                );
    }

    /**
     * Obtiene los reportes resueltos.
     *
     * @return reportes resueltos
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesResueltos() {
        return reporteRepository
                .findByEstadoOrderByFechaCreacionDesc(
                        EstadoReporte.RESUELTO
                );
    }

    /**
     * Cambia el estado de un reporte.
     *
     * @param idReporte identificador del reporte
     * @param estado nuevo estado
     * @return reporte actualizado
     */
    @Override
    public Reporte cambiarEstado(
            Long idReporte,
            EstadoReporte estado) {

        validarId(idReporte, "reporte");

        if (estado == null) {
            throw new IllegalArgumentException(
                    "El nuevo estado es obligatorio."
            );
        }

        Reporte reporte = buscarReporteObligatorio(idReporte);
        reporte.setEstado(estado);

        return reporteRepository.save(reporte);
    }

    //==========================================================================
    // REPORTES POR TIPO
    //==========================================================================
    /**
     * Obtiene los reportes asociados a un tipo.
     *
     * @param tipo tipo del reporte
     * @return lista de reportes
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesPorTipo(
            TipoReporte tipo) {

        if (tipo == null) {
            throw new IllegalArgumentException(
                    "El tipo del reporte es obligatorio."
            );
        }

        return reporteRepository.findByTipo(tipo);
    }

    /**
     * Determina el tipo de reporte más frecuente.
     *
     * @return nombre legible del tipo más frecuente
     */
    @Override
    @Transactional(readOnly = true)
    public String obtenerTipoMasFrecuente() {
        List<Reporte> reportes = reporteRepository.findAll();

        if (reportes.isEmpty()) {
            return "Sin reportes";
        }

        Map<TipoReporte, Long> cantidadPorTipo = reportes.stream()
                .filter(reporte -> reporte.getTipo() != null)
                .collect(
                        Collectors.groupingBy(
                                Reporte::getTipo,
                                () -> new EnumMap<>(TipoReporte.class),
                                Collectors.counting()
                        )
                );

        return cantidadPorTipo.entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> formatearEnum(entry.getKey().name()))
                .orElse("Sin reportes");
    }

    //==========================================================================
    // REPORTES POR PARQUEO Y USUARIO
    //==========================================================================
    /**
     * Obtiene los reportes asociados a un parqueo.
     *
     * @param idParqueo identificador del parqueo
     * @return lista de reportes
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesPorParqueo(
            Long idParqueo) {

        validarId(idParqueo, "parqueo");

        return reporteRepository
                .findByParqueoIdParqueo(idParqueo);
    }

    /**
     * Obtiene los reportes creados por un usuario.
     *
     * @param idUsuario identificador del usuario
     * @return lista de reportes
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesPorUsuario(
            Long idUsuario) {

        validarId(idUsuario, "usuario");

        return reporteRepository
                .findByUsuarioIdUsuarioOrderByFechaCreacionDesc(
                        idUsuario
                );
    }

    //==========================================================================
    // BÚSQUEDA Y FILTRADO
    //==========================================================================
    /**
     * Busca reportes por título, descripción o ubicación.
     *
     * @param texto texto que se desea buscar
     * @return lista de coincidencias
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> buscarReportes(String texto) {
        if (texto == null || texto.isBlank()) {
            return obtenerReportesRecientes();
        }

        return reporteRepository.buscar(texto.trim());
    }

    /**
     * Obtiene reportes creados después de una fecha.
     *
     * @param fecha fecha mínima
     * @return lista de reportes
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesDesde(
            LocalDateTime fecha) {

        if (fecha == null) {
            throw new IllegalArgumentException(
                    "La fecha es obligatoria."
            );
        }

        return reporteRepository.findByFechaCreacionAfter(fecha);
    }

    /**
     * Obtiene los reportes ordenados según sus votos netos.
     *
     * @return reportes más votados
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesMasVotados() {
        return reporteRepository.obtenerMasVotados();
    }

    /**
     * Obtiene los reportes con mayor porcentaje de confianza.
     *
     * @return reportes con mayor confianza
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesConMayorConfianza() {
        return reporteRepository
                .findTop10ByOrderByPorcentajeConfianzaDesc();
    }

    /**
     * Obtiene reportes con prioridad crítica.
     *
     * @return reportes críticos
     */
    @Override
    @Transactional(readOnly = true)
    public List<Reporte> obtenerReportesCriticos() {
        return reporteRepository.obtenerReportesCriticos();
    }

    //==========================================================================
    // ESTADÍSTICAS
    //==========================================================================
    /**
     * Cuenta todos los reportes.
     *
     * @return total de reportes
     */
    @Override
    @Transactional(readOnly = true)
    public long contarReportes() {
        return reporteRepository.count();
    }

    /**
     * Cuenta reportes según su estado.
     *
     * @param estado estado que se desea contabilizar
     * @return cantidad de reportes
     */
    @Override
    @Transactional(readOnly = true)
    public long contarReportesPorEstado(
            EstadoReporte estado) {

        if (estado == null) {
            return 0L;
        }

        Long cantidad = reporteRepository.countByEstado(estado);

        return cantidad != null ? cantidad : 0L;
    }

    /**
     * Cuenta reportes según su tipo.
     *
     * @param tipo tipo que se desea contabilizar
     * @return cantidad de reportes
     */
    @Override
    @Transactional(readOnly = true)
    public long contarReportesPorTipo(
            TipoReporte tipo) {

        if (tipo == null) {
            return 0L;
        }

        Long cantidad = reporteRepository.countByTipo(tipo);

        return cantidad != null ? cantidad : 0L;
    }

    /**
     * Cuenta los reportes creados durante el día actual.
     *
     * @return reportes del día
     */
    @Override
    @Transactional(readOnly = true)
    public long contarReportesHoy() {
        Long cantidad = reporteRepository.contarReportesHoy();

        return cantidad != null ? cantidad : 0L;
    }

    /**
     * Cuenta los reportes creados en la última hora.
     *
     * @return reportes de la última hora
     */
    @Override
    @Transactional(readOnly = true)
    public long contarReportesUltimaHora() {
        LocalDateTime haceUnaHora
                = LocalDateTime.now().minusHours(1);

        Long cantidad
                = reporteRepository.contarReportesUltimaHora(
                        haceUnaHora
                );

        return cantidad != null ? cantidad : 0L;
    }

    /**
     * Obtiene la ubicación que aparece con mayor frecuencia en los reportes.
     *
     * @return zona más activa
     */
    @Override
    @Transactional(readOnly = true)
    public String obtenerZonaMasActiva() {
        List<Reporte> reportes = reporteRepository.findAll();

        if (reportes.isEmpty()) {
            return "Sin actividad";
        }

        return reportes.stream()
                .map(Reporte::getUbicacion)
                .filter(ubicacion
                        -> ubicacion != null
                && !ubicacion.isBlank())
                .collect(
                        Collectors.groupingBy(
                                Function.identity(),
                                Collectors.counting()
                        )
                )
                .entrySet()
                .stream()
                .max(
                        Map.Entry.comparingByValue()
                )
                .map(Map.Entry::getKey)
                .orElse("Sin actividad");
    }

    /**
     * Genera un análisis breve para EasyBot.
     *
     * @return insight comunitario
     */
    @Override
    @Transactional(readOnly = true)
    public String generarInsightComunitario() {
        long activos = contarReportesPorEstado(
                EstadoReporte.ACTIVO
        );

        long criticos = obtenerReportesCriticos().size();
        long ultimaHora = contarReportesUltimaHora();

        String zona = obtenerZonaMasActiva();
        String tipo = obtenerTipoMasFrecuente();

        if (contarReportes() == 0) {
            return "La comunidad todavía no ha publicado reportes. "
                    + "Sé la primera persona en informar una situación.";
        }

        if (criticos > 0) {
            return "EasyBot detectó "
                    + criticos
                    + (criticos == 1
                    ? " reporte crítico activo. "
                    : " reportes críticos activos. ")
                    + "La zona con mayor actividad es "
                    + zona
                    + " y el incidente más frecuente es "
                    + tipo
                    + ".";
        }

        if (ultimaHora > 0) {
            return "La comunidad publicó "
                    + ultimaHora
                    + (ultimaHora == 1
                    ? " reporte durante la última hora. "
                    : " reportes durante la última hora. ")
                    + "La zona con más actividad actualmente es "
                    + zona
                    + ".";
        }

        return "La actividad comunitaria se mantiene estable con "
                + activos
                + (activos == 1
                ? " reporte activo. "
                : " reportes activos. ")
                + "El tipo más frecuente es "
                + tipo
                + ".";
    }

    //==========================================================================
    // VOTACIONES
    //==========================================================================
    /**
     * Registra, cambia o retira el voto de un usuario.
     *
     * Comportamiento:
     *
     * 1. Si no existe voto, se crea.
     * 2. Si existe un voto diferente, se cambia.
     * 3. Si existe el mismo voto, se elimina.
     *
     * @param idReporte identificador del reporte
     * @param idUsuario identificador del usuario
     * @param tipoVoto tipo de voto seleccionado
     * @return reporte con estadísticas actualizadas
     */
    @Override
    public Reporte votarReporte(
            Long idReporte,
            Long idUsuario,
            TipoVoto tipoVoto) {

        validarId(idReporte, "reporte");
        validarId(idUsuario, "usuario");

        if (tipoVoto == null) {
            throw new IllegalArgumentException(
                    "El tipo de voto es obligatorio."
            );
        }

        Reporte reporte = buscarReporteObligatorio(idReporte);
        Usuario usuario = buscarUsuarioObligatorio(idUsuario);

        Optional<VotoReporte> votoExistente
                = votoReporteRepository
                        .findByUsuarioIdUsuarioAndReporteIdReporte(
                                idUsuario,
                                idReporte
                        );

        if (votoExistente.isEmpty()) {
            crearVoto(usuario, reporte, tipoVoto);
        } else {
            VotoReporte voto = votoExistente.get();

            if (voto.getTipo() == tipoVoto) {
                /*
                 * El usuario presionó nuevamente el mismo botón,
                 * por lo tanto retira su voto.
                 */
                votoReporteRepository.delete(voto);
            } else {
                /*
                 * El usuario cambió su voto positivo por negativo
                 * o negativo por positivo.
                 */
                voto.setTipo(tipoVoto);
                votoReporteRepository.save(voto);
            }
        }

        /*
         * Fuerza la ejecución de las operaciones antes del conteo.
         */
        votoReporteRepository.flush();

        return actualizarEstadisticasVotos(idReporte);
    }

    /**
     * Obtiene el voto de un usuario en un reporte.
     *
     * @param idReporte identificador del reporte
     * @param idUsuario identificador del usuario
     * @return voto encontrado
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<VotoReporte> obtenerVotoUsuario(
            Long idReporte,
            Long idUsuario) {

        validarId(idReporte, "reporte");
        validarId(idUsuario, "usuario");

        return votoReporteRepository
                .findByUsuarioIdUsuarioAndReporteIdReporte(
                        idUsuario,
                        idReporte
                );
    }

    /**
     * Determina si el usuario ya votó un reporte.
     *
     * @param idReporte identificador del reporte
     * @param idUsuario identificador del usuario
     * @return true si existe un voto
     */
    @Override
    @Transactional(readOnly = true)
    public boolean usuarioYaVoto(
            Long idReporte,
            Long idUsuario) {

        if (idReporte == null
                || idReporte <= 0
                || idUsuario == null
                || idUsuario <= 0) {

            return false;
        }

        return votoReporteRepository
                .existsByUsuarioIdUsuarioAndReporteIdReporte(
                        idUsuario,
                        idReporte
                );
    }

    /**
     * Elimina el voto de un usuario.
     *
     * @param idReporte identificador del reporte
     * @param idUsuario identificador del usuario
     * @return reporte actualizado
     */
    @Override
    public Reporte eliminarVoto(
            Long idReporte,
            Long idUsuario) {

        validarId(idReporte, "reporte");
        validarId(idUsuario, "usuario");

        Reporte reporte = buscarReporteObligatorio(idReporte);

        Optional<VotoReporte> voto
                = votoReporteRepository
                        .findByUsuarioIdUsuarioAndReporteIdReporte(
                                idUsuario,
                                idReporte
                        );

        voto.ifPresent(votoReporteRepository::delete);

        votoReporteRepository.flush();

        /*
         * La variable se utiliza para garantizar que el reporte existe
         * antes de ejecutar el recálculo.
         */
        if (reporte.getIdReporte() == null) {
            throw new IllegalStateException(
                    "No fue posible identificar el reporte."
            );
        }

        return actualizarEstadisticasVotos(idReporte);
    }

    /**
     * Recalcula los contadores de votos y el porcentaje de confianza.
     *
     * @param idReporte identificador del reporte
     * @return reporte actualizado
     */
    @Override
    public Reporte actualizarEstadisticasVotos(
            Long idReporte) {

        validarId(idReporte, "reporte");

        Reporte reporte = buscarReporteObligatorio(idReporte);

        long positivos
                = votoReporteRepository
                        .countByReporteIdReporteAndTipo(
                                idReporte,
                                TipoVoto.POSITIVO
                        );

        long negativos
                = votoReporteRepository
                        .countByReporteIdReporteAndTipo(
                                idReporte,
                                TipoVoto.NEGATIVO
                        );

        int votosPositivos = convertirAEnteroSeguro(positivos);
        int votosNegativos = convertirAEnteroSeguro(negativos);

        int totalVotos = votosPositivos + votosNegativos;

        int porcentajeConfianza = totalVotos == 0
                ? 0
                : (int) Math.round(
                        (votosPositivos * 100.0)
                        / totalVotos
                );

        reporte.setVotosPositivos(votosPositivos);
        reporte.setVotosNegativos(votosNegativos);
        reporte.setPorcentajeConfianza(
                porcentajeConfianza
        );

        return reporteRepository.save(reporte);
    }

    //==========================================================================
    // MÉTODOS PRIVADOS
    //==========================================================================
    /**
     * Crea un voto nuevo.
     *
     * @param usuario usuario que realiza el voto
     * @param reporte reporte votado
     * @param tipoVoto tipo de voto
     */
    private void crearVoto(
            Usuario usuario,
            Reporte reporte,
            TipoVoto tipoVoto) {

        VotoReporte voto = new VotoReporte();

        voto.setUsuario(usuario);
        voto.setReporte(reporte);
        voto.setTipo(tipoVoto);

        votoReporteRepository.save(voto);
    }

    /**
     * Obtiene obligatoriamente un reporte.
     *
     * @param idReporte identificador del reporte
     * @return reporte encontrado
     */
    private Reporte buscarReporteObligatorio(
            Long idReporte) {

        return reporteRepository.findById(idReporte)
                .orElseThrow(() -> new IllegalArgumentException(
                "No se encontró el reporte con ID "
                + idReporte
                + "."
        ));
    }

    /**
     * Obtiene obligatoriamente un usuario.
     *
     * @param idUsuario identificador del usuario
     * @return usuario encontrado
     */
    private Usuario buscarUsuarioObligatorio(
            Long idUsuario) {

        return usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException(
                "No se encontró el usuario con ID "
                + idUsuario
                + "."
        ));
    }

    /**
     * Valida un identificador.
     *
     * @param id identificador
     * @param entidad nombre de la entidad
     */
    private void validarId(
            Long id,
            String entidad) {

        if (id == null || id <= 0) {
            throw new IllegalArgumentException(
                    "El identificador del "
                    + entidad
                    + " no es válido."
            );
        }
    }

    /**
     * Determina la prioridad automática según el tipo del reporte.
     *
     * @param tipo tipo del reporte
     * @return prioridad correspondiente
     */
    private PrioridadReporte determinarPrioridad(
            TipoReporte tipo) {

        return switch (tipo) {
            case ACCIDENTE, SEGURIDAD
                -> PrioridadReporte.CRITICA;

            case ESPACIO_BLOQUEADO, OBRAS
                -> PrioridadReporte.ALTA;

            case PARQUEO_LLENO, TRAFICO
                -> PrioridadReporte.MEDIA;

            case OTRO
                -> PrioridadReporte.BAJA;
        };
    }

    /**
     * Convierte el nombre de un enum en texto legible.
     *
     * Ejemplo: PARQUEO_LLENO -> Parqueo lleno.
     *
     * @param valor valor del enum
     * @return texto formateado
     */
    private String formatearEnum(String valor) {
        if (valor == null || valor.isBlank()) {
            return "Sin información";
        }

        String texto = valor
                .toLowerCase()
                .replace("_", " ");

        return Character.toUpperCase(texto.charAt(0))
                + texto.substring(1);
    }

    /**
     * Convierte un contador long a Integer evitando desbordamientos.
     *
     * @param valor valor original
     * @return valor entero seguro
     */
    private int convertirAEnteroSeguro(long valor) {
        if (valor > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }

        return (int) Math.max(valor, 0L);
    }
}
/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.service;

// Importes
import com.easyspot.domain.EstadoReporte;
import com.easyspot.domain.Reporte;
import com.easyspot.domain.TipoReporte;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.easyspot.domain.TipoVoto;
import com.easyspot.domain.VotoReporte;

/**
 *
 * @author XPC
 */
public interface ReporteService {

    //==========================================================================
    // OPERACIONES PRINCIPALES
    //==========================================================================
    /**
     * Obtiene todos los reportes registrados.
     *
     * @return lista completa de reportes
     */
    List<Reporte> obtenerReportes();

    /**
     * Obtiene todos los reportes ordenados desde el más reciente.
     *
     * @return lista de reportes ordenada por fecha de creación
     */
    List<Reporte> obtenerReportesRecientes();

    /**
     * Busca un reporte por su identificador.
     *
     * @param idReporte identificador del reporte
     * @return reporte encontrado
     */
    Optional<Reporte> obtenerReportePorId(Long idReporte);

    /**
     * Guarda un nuevo reporte o actualiza uno existente.
     *
     * @param reporte reporte que se desea guardar
     * @return reporte almacenado
     */
    Reporte guardarReporte(Reporte reporte);

    /**
     * Elimina un reporte por su identificador.
     *
     * @param idReporte identificador del reporte
     */
    void eliminarReporte(Long idReporte);

    /**
     * Verifica si un reporte existe.
     *
     * @param idReporte identificador del reporte
     * @return true si existe; false en caso contrario
     */
    boolean existeReporte(Long idReporte);

    //==========================================================================
    // REPORTES POR ESTADO
    //==========================================================================
    /**
     * Obtiene los reportes asociados a un estado.
     *
     * @param estado estado del reporte
     * @return lista de reportes
     */
    List<Reporte> obtenerReportesPorEstado(EstadoReporte estado);

    /**
     * Obtiene los reportes activos ordenados desde el más reciente.
     *
     * @return lista de reportes activos
     */
    List<Reporte> obtenerReportesActivos();

    /**
     * Obtiene los reportes resueltos.
     *
     * @return lista de reportes resueltos
     */
    List<Reporte> obtenerReportesResueltos();

    /**
     * Cambia el estado de un reporte.
     *
     * @param idReporte identificador del reporte
     * @param estado nuevo estado
     * @return reporte actualizado
     */
    Reporte cambiarEstado(
            Long idReporte,
            EstadoReporte estado
    );

    //==========================================================================
    // REPORTES POR TIPO
    //==========================================================================
    /**
     * Obtiene los reportes de un tipo específico.
     *
     * @param tipo tipo de reporte
     * @return lista de reportes
     */
    List<Reporte> obtenerReportesPorTipo(TipoReporte tipo);

    /**
     * Determina el tipo de reporte más frecuente.
     *
     * @return nombre del tipo más frecuente
     */
    String obtenerTipoMasFrecuente();

    //==========================================================================
    // REPORTES POR PARQUEO Y USUARIO
    //==========================================================================
    /**
     * Obtiene los reportes relacionados con un parqueo.
     *
     * @param idParqueo identificador del parqueo
     * @return lista de reportes
     */
    List<Reporte> obtenerReportesPorParqueo(Long idParqueo);

    /**
     * Obtiene los reportes realizados por un usuario.
     *
     * @param idUsuario identificador del usuario
     * @return lista de reportes
     */
    List<Reporte> obtenerReportesPorUsuario(Long idUsuario);

    //==========================================================================
    // BÚSQUEDA Y FILTRADO
    //==========================================================================
    /**
     * Busca reportes por título, descripción o ubicación.
     *
     * @param texto texto que se desea buscar
     * @return lista de coincidencias
     */
    List<Reporte> buscarReportes(String texto);

    /**
     * Obtiene los reportes creados después de una fecha determinada.
     *
     * @param fecha fecha mínima
     * @return lista de reportes
     */
    List<Reporte> obtenerReportesDesde(LocalDateTime fecha);

    /**
     * Obtiene los reportes con mayor cantidad de votos positivos netos.
     *
     * @return lista de reportes más votados
     */
    List<Reporte> obtenerReportesMasVotados();

    /**
     * Obtiene los reportes con mayor porcentaje de confianza.
     *
     * @return lista de reportes con mayor confianza
     */
    List<Reporte> obtenerReportesConMayorConfianza();

    /**
     * Obtiene los reportes críticos.
     *
     * @return lista de reportes críticos
     */
    List<Reporte> obtenerReportesCriticos();

    //==========================================================================
    // ESTADÍSTICAS
    //==========================================================================
    /**
     * Cuenta todos los reportes registrados.
     *
     * @return cantidad total de reportes
     */
    long contarReportes();

    /**
     * Cuenta los reportes asociados a un estado.
     *
     * @param estado estado que se desea contabilizar
     * @return cantidad de reportes
     */
    long contarReportesPorEstado(EstadoReporte estado);

    /**
     * Cuenta los reportes asociados a un tipo.
     *
     * @param tipo tipo que se desea contabilizar
     * @return cantidad de reportes
     */
    long contarReportesPorTipo(TipoReporte tipo);

    /**
     * Cuenta los reportes creados durante el día actual.
     *
     * @return cantidad de reportes creados hoy
     */
    long contarReportesHoy();

    /**
     * Cuenta los reportes generados durante la última hora.
     *
     * @return cantidad de reportes de la última hora
     */
    long contarReportesUltimaHora();

    /**
     * Obtiene el parqueo o zona con mayor cantidad de reportes.
     *
     * @return nombre de la zona más activa
     */
    String obtenerZonaMasActiva();

    /**
     * Genera el texto utilizado por EasyBot en el panel comunitario.
     *
     * @return análisis comunitario
     */
    String generarInsightComunitario();

    //==========================================================================
    // VOTACIONES
    //==========================================================================
    /**
     * 
     * Registra el voto de un usuario sobre un reporte.
     *
     * Si el usuario aún no ha votado, se crea un nuevo voto. Si ya votó con
     * otro tipo, se actualiza. Si vuelve a presionar el mismo voto, este se
     * elimina.
     *
     * @param idReporte identificador del reporte
     * @param idUsuario identificador del usuario
     * @param tipoVoto tipo de voto (POSITIVO o NEGATIVO)
     * @return reporte actualizado
     */
    Reporte votarReporte(
            Long idReporte,
            Long idUsuario,
            TipoVoto tipoVoto
    );

    /**
     * Obtiene el voto realizado por un usuario sobre un reporte.
     *
     * @param idReporte identificador del reporte
     * @param idUsuario identificador del usuario
     * @return Optional con el voto si existe
     */
    Optional<VotoReporte> obtenerVotoUsuario(
            Long idReporte,
            Long idUsuario
    );

    /**
     * Verifica si un usuario ya votó un reporte.
     *
     * @param idReporte identificador del reporte
     * @param idUsuario identificador del usuario
     * @return true si el usuario ya votó
     */
    boolean usuarioYaVoto(
            Long idReporte,
            Long idUsuario
    );

    /**
     * Elimina el voto de un usuario.
     *
     * @param idReporte identificador del reporte
     * @param idUsuario identificador del usuario
     * @return reporte actualizado
     */
    Reporte eliminarVoto(
            Long idReporte,
            Long idUsuario
    );

    /**
     * Recalcula los votos positivos, negativos y el porcentaje de confianza del
     * reporte.
     *
     * @param idReporte identificador del reporte
     * @return reporte actualizado
     */
    Reporte actualizarEstadisticasVotos(Long idReporte);

}

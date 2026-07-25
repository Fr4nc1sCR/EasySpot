/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.repository;

// Importes
import com.easyspot.domain.EstadoReporte;
import com.easyspot.domain.Reporte;
import com.easyspot.domain.TipoReporte;
import com.easyspot.domain.TipoVoto;
import com.easyspot.domain.VotoReporte;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 *
 * @author XPC
 */
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    //==========================================================================
    // REPORTES ACTIVOS
    //==========================================================================
    List<Reporte> findByEstado(EstadoReporte estado);

    List<Reporte> findByEstadoOrderByFechaCreacionDesc(EstadoReporte estado);

    //==========================================================================
    // REPORTES POR PARQUEO
    //==========================================================================
    List<Reporte> findByParqueoIdParqueo(Long idParqueo);

    //==========================================================================
    // REPORTES POR USUARIO
    //==========================================================================
    List<Reporte> findByUsuarioIdUsuarioOrderByFechaCreacionDesc(Long idUsuario);

    //==========================================================================
    // REPORTES POR TIPO
    //==========================================================================
    List<Reporte> findByTipo(TipoReporte tipo);

    //==========================================================================
    // REPORTES RECIENTES
    //==========================================================================
    List<Reporte> findTop10ByOrderByFechaCreacionDesc();

    List<Reporte> findTop5ByOrderByFechaCreacionDesc();

    //==========================================================================
    // REPORTES DESDE UNA FECHA
    //==========================================================================
    List<Reporte> findByFechaCreacionAfter(LocalDateTime fecha);

    //==========================================================================
    // CONTADORES
    //==========================================================================
    Long countByEstado(EstadoReporte estado);

    Long countByTipo(TipoReporte tipo);

    //==========================================================================
    // REPORTES DEL DÍA
    //==========================================================================
    @Query("""
            SELECT COUNT(r)
            FROM Reporte r
            WHERE DATE(r.fechaCreacion)=CURRENT_DATE
           """)
    Long contarReportesHoy();

    //==========================================================================
    // REPORTES ÚLTIMA HORA
    //==========================================================================
    @Query("""
            SELECT COUNT(r)
            FROM Reporte r
            WHERE r.fechaCreacion>=:fecha
           """)
    Long contarReportesUltimaHora(
            @Param("fecha") LocalDateTime fecha);

    //==========================================================================
    // REPORTES MÁS VOTADOS
    //==========================================================================
    @Query("""
            SELECT r
            FROM Reporte r
            ORDER BY (r.votosPositivos-r.votosNegativos) DESC
           """)
    List<Reporte> obtenerMasVotados();

    //==========================================================================
    // MAYOR CONFIANZA
    //==========================================================================
    List<Reporte> findTop10ByOrderByPorcentajeConfianzaDesc();

    //==========================================================================
    // REPORTES CRÍTICOS
    //==========================================================================
    @Query("""
            SELECT r
            FROM Reporte r
            WHERE r.prioridad='CRITICA'
            ORDER BY r.fechaCreacion DESC
           """)
    List<Reporte> obtenerReportesCriticos();

    //==========================================================================
    // BÚSQUEDA
    //==========================================================================
    @Query("""
            SELECT r
            FROM Reporte r
            WHERE LOWER(r.titulo) LIKE LOWER(CONCAT('%',:texto,'%'))
               OR LOWER(r.descripcion) LIKE LOWER(CONCAT('%',:texto,'%'))
               OR LOWER(r.ubicacion) LIKE LOWER(CONCAT('%',:texto,'%'))
           """)
    List<Reporte> buscar(@Param("texto") String texto);

}

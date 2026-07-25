/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.repository;

// Importes
import com.easyspot.domain.Reporte;
import com.easyspot.domain.TipoVoto;
import com.easyspot.domain.Usuario;
import com.easyspot.domain.VotoReporte;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 *
 * @author XPC
 */
public interface VotoReporteRepository
        extends JpaRepository<VotoReporte, Long> {

    //==========================================================
    // Buscar voto de un usuario para un reporte
    //==========================================================

    Optional<VotoReporte> findByUsuarioAndReporte(
            Usuario usuario,
            Reporte reporte);

    Optional<VotoReporte> findByUsuarioIdUsuarioAndReporteIdReporte(
            Long idUsuario,
            Long idReporte);

    //==========================================================
    // Todos los votos de un reporte
    //==========================================================

    List<VotoReporte> findByReporte(Reporte reporte);

    List<VotoReporte> findByReporteIdReporte(Long idReporte);

    //==========================================================
    // Todos los votos de un usuario
    //==========================================================

    List<VotoReporte> findByUsuario(Usuario usuario);

    List<VotoReporte> findByUsuarioIdUsuario(Long idUsuario);

    //==========================================================
    // Eliminar voto
    //==========================================================

    void deleteByUsuarioAndReporte(
            Usuario usuario,
            Reporte reporte);

    //==========================================================
    // Contadores
    //==========================================================

    long countByReporteIdReporte(Long idReporte);

    long countByUsuarioIdUsuario(Long idUsuario);
    
    //==========================================================================
    // Otros métodos
    //==========================================================================
    
    long countByReporteIdReporteAndTipo(
            Long idReporte,
            TipoVoto tipo
    );

    boolean existsByUsuarioIdUsuarioAndReporteIdReporte(
            Long idUsuario,
            Long idReporte
    );
}

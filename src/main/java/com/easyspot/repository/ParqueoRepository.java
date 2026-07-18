/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.repository;

// Importes
import com.easyspot.domain.Parqueo;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 *
 * @author XPC
 */
public interface ParqueoRepository extends JpaRepository<Parqueo, Long> {
    @Query("""
        SELECT p
        FROM Parqueo p
        WHERE p.activo = true
          AND (
                :texto IS NULL
                OR :texto = ''
                OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
                OR LOWER(p.direccion) LIKE LOWER(CONCAT('%', :texto, '%'))
                OR LOWER(p.provincia) LIKE LOWER(CONCAT('%', :texto, '%'))
                OR LOWER(p.canton) LIKE LOWER(CONCAT('%', :texto, '%'))
          )
          AND (:precioMaximo IS NULL OR p.tarifaHora <= :precioMaximo)
          AND (:espaciosMinimos IS NULL OR p.espaciosDisponibles >= :espaciosMinimos)
          AND (:techado IS NULL OR p.techado = :techado)
        ORDER BY p.espaciosDisponibles DESC, p.calificacion DESC
    """)
    List<Parqueo> buscarParaDashboard(
            @Param("texto") String texto,
            @Param("precioMaximo") BigDecimal precioMaximo,
            @Param("espaciosMinimos") Integer espaciosMinimos,
            @Param("techado") Boolean techado
    );

    List<Parqueo> findByActivoTrueOrderByCalificacionDesc();
}

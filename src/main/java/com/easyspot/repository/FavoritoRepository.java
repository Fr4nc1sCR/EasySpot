/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.repository;

// Importes
import com.easyspot.domain.Favorito;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 *
 * @author XPC
 */
public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    List<Favorito> findByUsuarioIdUsuarioOrderByFechaAgregadoDesc(Long idUsuario);

    Optional<Favorito> findByUsuarioIdUsuarioAndParqueoIdParqueo(Long idUsuario, Long idParqueo);

    boolean existsByUsuarioIdUsuarioAndParqueoIdParqueo(Long idUsuario, Long idParqueo);

    void deleteByUsuarioIdUsuarioAndParqueoIdParqueo(Long idUsuario, Long idParqueo);
}

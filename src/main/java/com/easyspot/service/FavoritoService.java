/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.service;

// Importes
import com.easyspot.domain.Favorito;
import java.util.List;

/**
 *
 * @author XPC
 */
public interface FavoritoService {
    Favorito guardar(Favorito favorito);

    List<Favorito> obtenerFavoritos(Long idUsuario);

    boolean esFavorito(Long idUsuario, Long idParqueo);

    void agregarFavorito(Long idUsuario, Long idParqueo);

    void eliminarFavorito(Long idUsuario, Long idParqueo);
}

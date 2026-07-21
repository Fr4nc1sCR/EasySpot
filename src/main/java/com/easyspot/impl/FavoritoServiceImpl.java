/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.impl;

// Importes
import com.easyspot.domain.Favorito;
import com.easyspot.domain.Parqueo;
import com.easyspot.domain.Usuario;
import com.easyspot.repository.FavoritoRepository;
import com.easyspot.repository.ParqueoRepository;
import com.easyspot.repository.UsuarioRepository;
import com.easyspot.service.FavoritoService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author XPC
 */
@Service
public class FavoritoServiceImpl implements FavoritoService {

    private final FavoritoRepository favoritoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ParqueoRepository parqueoRepository;

    public FavoritoServiceImpl(FavoritoRepository favoritoRepository, UsuarioRepository usuarioRepository, ParqueoRepository parqueoRepository) {
        this.favoritoRepository = favoritoRepository;
        this.usuarioRepository = usuarioRepository;
        this.parqueoRepository = parqueoRepository;
    }

    @Override
    public Favorito guardar(Favorito favorito) {
        return favoritoRepository.save(favorito);
    }

    @Override
    public List<Favorito> obtenerFavoritos(Long idUsuario) {
        return favoritoRepository
                .findByUsuarioIdUsuarioOrderByFechaAgregadoDesc(idUsuario);
    }

    @Override
    public boolean esFavorito(Long idUsuario, Long idParqueo) {

        return favoritoRepository
                .existsByUsuarioIdUsuarioAndParqueoIdParqueo(
                        idUsuario,
                        idParqueo
                );
    }

    @Override
    @Transactional
    public void agregarFavorito(Long idUsuario, Long idParqueo) {

        if (esFavorito(idUsuario, idParqueo)) {
            return;
        }

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow();

        Parqueo parqueo = parqueoRepository.findById(idParqueo)
                .orElseThrow();

        Favorito favorito = new Favorito();

        favorito.setUsuario(usuario);
        favorito.setParqueo(parqueo);
        favorito.setFechaAgregado(LocalDateTime.now());

        favoritoRepository.save(favorito);
    }

    @Override
    @Transactional
    public void eliminarFavorito(Long idUsuario, Long idParqueo) {

        favoritoRepository.deleteByUsuarioIdUsuarioAndParqueoIdParqueo(
                idUsuario,
                idParqueo
        );
    }

}

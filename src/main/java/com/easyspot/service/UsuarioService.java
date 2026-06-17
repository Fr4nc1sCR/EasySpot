/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.service;

// Importes
import com.easyspot.domain.Rol;
import com.easyspot.domain.Usuario;
import com.easyspot.repository.RolRepository;
import com.easyspot.repository.UsuarioRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 *
 * @author XPC
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
    }

    public boolean registrar(Usuario usuario) {

        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            return false;
        }

        Rol rolUsuario = rolRepository
                .findByNombre("USUARIO")
                .orElseThrow();

        usuario.setRol(rolUsuario);

        usuarioRepository.save(usuario);

        return true;
    }

    public Optional<Usuario> login(String email, String password) {
        Optional<Usuario> usuario = usuarioRepository.findByEmail(email);

        if (usuario.isPresent()
                && usuario.get().getPassword().equals(password)) {
            return usuario;
        }

        return Optional.empty();
    }
}

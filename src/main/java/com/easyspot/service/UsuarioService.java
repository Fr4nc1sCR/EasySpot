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
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author XPC
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository
    ) {
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

    public Optional<Usuario> login(
            String email,
            String password
    ) {
        Optional<Usuario> usuario =
                usuarioRepository.findByEmail(email);

        if (usuario.isPresent()
                && usuario.get().getPassword().equals(password)) {
            return usuario;
        }

        return Optional.empty();
    }

    public Optional<Usuario> buscarPorId(Long idUsuario) {
        return usuarioRepository.findById(idUsuario);
    }

    @Transactional
    public ResultadoActualizacion actualizarPerfil(
            Long idUsuario,
            String nombre,
            String email
    ) {
        Optional<Usuario> usuarioOptional =
                usuarioRepository.findById(idUsuario);

        if (usuarioOptional.isEmpty()) {
            return new ResultadoActualizacion(
                    false,
                    "No se encontró la cuenta del usuario."
            );
        }

        String nombreLimpio =
                nombre != null ? nombre.trim() : "";

        String emailLimpio =
                email != null
                ? email.trim().toLowerCase()
                : "";

        if (nombreLimpio.isEmpty()) {
            return new ResultadoActualizacion(
                    false,
                    "El nombre no puede estar vacío."
            );
        }

        if (emailLimpio.isEmpty()) {
            return new ResultadoActualizacion(
                    false,
                    "El correo electrónico no puede estar vacío."
            );
        }

        if (!emailLimpio.matches(
                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$"
        )) {
            return new ResultadoActualizacion(
                    false,
                    "El formato del correo electrónico no es válido."
            );
        }

        boolean correoEnUso =
                usuarioRepository.existsByEmailAndIdUsuarioNot(
                        emailLimpio,
                        idUsuario
                );

        if (correoEnUso) {
            return new ResultadoActualizacion(
                    false,
                    "Ese correo electrónico ya está registrado."
            );
        }

        Usuario usuario = usuarioOptional.get();

        usuario.setNombre(nombreLimpio);
        usuario.setEmail(emailLimpio);

        usuarioRepository.save(usuario);

        return new ResultadoActualizacion(
                true,
                "Los datos del perfil se actualizaron correctamente."
        );
    }

    @Transactional
    public ResultadoActualizacion cambiarPassword(
            Long idUsuario,
            String passwordActual,
            String passwordNueva,
            String confirmacionPassword
    ) {
        Optional<Usuario> usuarioOptional =
                usuarioRepository.findById(idUsuario);

        if (usuarioOptional.isEmpty()) {
            return new ResultadoActualizacion(
                    false,
                    "No se encontró la cuenta del usuario."
            );
        }

        Usuario usuario = usuarioOptional.get();

        if (passwordActual == null
                || !usuario.getPassword().equals(passwordActual)) {

            return new ResultadoActualizacion(
                    false,
                    "La contraseña actual es incorrecta."
            );
        }

        if (passwordNueva == null
                || passwordNueva.length() < 6) {

            return new ResultadoActualizacion(
                    false,
                    "La nueva contraseña debe tener al menos 6 caracteres."
            );
        }

        if (!passwordNueva.equals(confirmacionPassword)) {
            return new ResultadoActualizacion(
                    false,
                    "La nueva contraseña y su confirmación no coinciden."
            );
        }

        if (passwordNueva.equals(passwordActual)) {
            return new ResultadoActualizacion(
                    false,
                    "La nueva contraseña debe ser diferente de la actual."
            );
        }

        usuario.setPassword(passwordNueva);

        usuarioRepository.save(usuario);

        return new ResultadoActualizacion(
                true,
                "La contraseña se cambió correctamente."
        );
    }

    public record ResultadoActualizacion(
            boolean exitoso,
            String mensaje
    ) {
    }
}

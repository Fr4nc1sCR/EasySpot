/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.controller;

// Importes
import com.easyspot.domain.EstadoReserva;
import com.easyspot.domain.Favorito;
import com.easyspot.domain.Reporte;
import com.easyspot.domain.Reserva;
import com.easyspot.domain.Usuario;
import com.easyspot.repository.FavoritoRepository;
import com.easyspot.repository.ReporteRepository;
import com.easyspot.repository.ReservaRepository;
import com.easyspot.service.UsuarioService;
import com.easyspot.service.UsuarioService.ResultadoActualizacion;
import jakarta.servlet.http.HttpSession;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 *
 * @author XPC
 */
@Controller
public class PerfilController {

    private final UsuarioService usuarioService;
    private final ReservaRepository reservaRepository;
    private final FavoritoRepository favoritoRepository;
    private final ReporteRepository reporteRepository;

    public PerfilController(
            UsuarioService usuarioService,
            ReservaRepository reservaRepository,
            FavoritoRepository favoritoRepository,
            ReporteRepository reporteRepository
    ) {
        this.usuarioService = usuarioService;
        this.reservaRepository = reservaRepository;
        this.favoritoRepository = favoritoRepository;
        this.reporteRepository = reporteRepository;
    }

    @GetMapping("/perfil")
    public String mostrarPerfil(
            HttpSession session,
            Model model
    ) {
        Usuario usuarioSesion =
                obtenerUsuarioSesion(session);

        if (usuarioSesion == null) {
            return "redirect:/login?sesionRequerida";
        }

        Usuario usuarioActualizado = usuarioService
                .buscarPorId(usuarioSesion.getIdUsuario())
                .orElse(null);

        if (usuarioActualizado == null) {
            session.invalidate();
            return "redirect:/login?usuarioNoEncontrado";
        }

        actualizarUsuarioSesion(
                session,
                usuarioActualizado
        );

        Long idUsuario =
                usuarioActualizado.getIdUsuario();

        List<Reserva> reservas =
                reservaRepository
                        .findByUsuarioIdUsuarioOrderByFechaDescHoraInicioDesc(
                                idUsuario
                        );

        List<Reserva> reservasActivas =
                reservaRepository
                        .findByUsuarioIdUsuarioAndEstadoOrderByFechaAscHoraInicioAsc(
                                idUsuario,
                                EstadoReserva.ACTIVA
                        );

        List<Favorito> favoritos =
                favoritoRepository
                        .findByUsuarioIdUsuarioOrderByFechaAgregadoDesc(
                                idUsuario
                        );

        List<Reporte> reportes =
                reporteRepository
                        .findByUsuarioIdUsuarioOrderByFechaCreacionDesc(
                                idUsuario
                        );

        model.addAttribute(
                "usuario",
                usuarioActualizado
        );

        model.addAttribute(
                "totalReservas",
                reservas.size()
        );

        model.addAttribute(
                "reservasActivas",
                reservasActivas.size()
        );

        model.addAttribute(
                "totalFavoritos",
                favoritos.size()
        );

        model.addAttribute(
                "totalReportes",
                reportes.size()
        );

        model.addAttribute(
                "ultimasReservas",
                obtenerPrimeros(reservas, 3)
        );

        model.addAttribute(
                "ultimosFavoritos",
                obtenerPrimeros(favoritos, 3)
        );

        model.addAttribute(
                "ultimosReportes",
                obtenerPrimeros(reportes, 3)
        );

        return "perfil";
    }

    @PostMapping("/perfil/actualizar")
    public String actualizarPerfil(
            @RequestParam String nombre,
            @RequestParam String email,
            HttpSession session
    ) {
        Usuario usuarioSesion =
                obtenerUsuarioSesion(session);

        if (usuarioSesion == null) {
            return "redirect:/login?sesionRequerida";
        }

        ResultadoActualizacion resultado =
                usuarioService.actualizarPerfil(
                        usuarioSesion.getIdUsuario(),
                        nombre,
                        email
                );

        if (!resultado.exitoso()) {
            session.setAttribute(
                    "perfilError",
                    resultado.mensaje()
            );

            return "redirect:/perfil?errorActualizacion";
        }

        usuarioService
                .buscarPorId(usuarioSesion.getIdUsuario())
                .ifPresent(usuarioActualizado ->
                        actualizarUsuarioSesion(
                                session,
                                usuarioActualizado
                        )
                );

        session.setAttribute(
                "perfilExito",
                resultado.mensaje()
        );

        return "redirect:/perfil?actualizado";
    }

    @PostMapping("/perfil/password")
    public String cambiarPassword(
            @RequestParam String passwordActual,
            @RequestParam String passwordNueva,
            @RequestParam String confirmacionPassword,
            HttpSession session
    ) {
        Usuario usuarioSesion =
                obtenerUsuarioSesion(session);

        if (usuarioSesion == null) {
            return "redirect:/login?sesionRequerida";
        }

        ResultadoActualizacion resultado =
                usuarioService.cambiarPassword(
                        usuarioSesion.getIdUsuario(),
                        passwordActual,
                        passwordNueva,
                        confirmacionPassword
                );

        if (!resultado.exitoso()) {
            session.setAttribute(
                    "passwordError",
                    resultado.mensaje()
            );

            return "redirect:/perfil?errorPassword";
        }

        session.setAttribute(
                "passwordExito",
                resultado.mensaje()
        );

        return "redirect:/perfil?passwordActualizado";
    }

    private Usuario obtenerUsuarioSesion(
            HttpSession session
    ) {
        Object usuario =
                session.getAttribute("usuarioLogueado");

        if (usuario instanceof Usuario usuarioLogueado) {
            return usuarioLogueado;
        }

        return null;
    }

    private void actualizarUsuarioSesion(
            HttpSession session,
            Usuario usuario
    ) {
        session.setAttribute(
                "usuarioLogueado",
                usuario
        );
    }

    private <T> List<T> obtenerPrimeros(
            List<T> elementos,
            int cantidad
    ) {
        if (elementos == null
                || elementos.isEmpty()) {
            return Collections.emptyList();
        }

        int limite =
                Math.min(cantidad, elementos.size());

        return elementos.subList(0, limite);
    }
}
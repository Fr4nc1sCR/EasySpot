/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.controller;

// Importes
import com.easyspot.domain.Reserva;
import com.easyspot.domain.Usuario;
import com.easyspot.service.ReservaService;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 *
 * @author XPC
 */
@Controller
@RequestMapping("/historial")
public class HistorialController {

    private final ReservaService reservaService;

    public HistorialController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    /**
     * Muestra el historial de reservas del usuario autenticado.
     */
    @GetMapping
    public String historial(HttpSession session, Model model) {

        Usuario usuario = (Usuario) session.getAttribute("usuarioLogueado");

        if (usuario == null) {
            return "redirect:/login";
        }

        /*
         * Antes de mostrar el historial se actualizan automáticamente
         * las reservas cuyo horario ya terminó.
         */
        reservaService.actualizarReservasCompletadas();

        /*
         * Se obtiene únicamente el historial
         * (COMPLETADAS y CANCELADAS).
         */
        List<Reserva> historial = reservaService.obtenerHistorial(usuario.getIdUsuario());

        /*
         * Estadísticas del usuario.
         */
        model.addAttribute("historial",historial);
        model.addAttribute("totalReservas",reservaService.contarReservas(usuario.getIdUsuario()));
        model.addAttribute("reservasCanceladas",reservaService.contarReservasCanceladas(usuario.getIdUsuario()));
        model.addAttribute("tiempoPromedio",reservaService.obtenerTiempoPromedio(usuario.getIdUsuario()));

        return "historial";
    }

}

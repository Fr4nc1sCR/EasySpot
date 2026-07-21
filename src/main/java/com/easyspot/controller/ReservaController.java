/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.controller;

// Importes
import com.easyspot.domain.EstadoReserva;
import com.easyspot.domain.Parqueo;
import com.easyspot.domain.Reserva;
import com.easyspot.domain.Usuario;
import com.easyspot.service.ParqueoService;
import com.easyspot.service.ReservaService;
import jakarta.servlet.http.HttpSession;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

/**
 *
 * @author XPC
 */
@Controller
@RequestMapping("/reservas")
public class ReservaController {

    private final ReservaService reservaService;
    private final ParqueoService parqueoService;

    public ReservaController(ReservaService reservaService, ParqueoService parqueoService) {
        this.reservaService = reservaService;
        this.parqueoService = parqueoService;
    }

    /**
     * Muestra la página de reservas del usuario.
     */
    @GetMapping
    public String listado(HttpSession session, Model model) {

        Usuario usuario = (Usuario) session.getAttribute("usuarioLogueado");

        if (usuario == null) {
            return "redirect:/login";
        }

        /*
         * Actualiza automáticamente las reservas
         * cuyo horario ya terminó.
         */
        reservaService.actualizarReservasCompletadas();

        List<Reserva> reservasActivas = reservaService.obtenerReservasActivas(usuario.getIdUsuario());

        List<Reserva> historial = reservaService.obtenerHistorial(usuario.getIdUsuario());

        model.addAttribute("reservasActivas",reservasActivas);
        model.addAttribute("historial",historial);
        model.addAttribute("totalReservas",reservaService.contarReservas(usuario.getIdUsuario()));
        model.addAttribute("reservasCanceladas",reservaService.contarReservasCanceladas(usuario.getIdUsuario()));
        model.addAttribute("tiempoPromedio",reservaService.obtenerTiempoPromedio(usuario.getIdUsuario()));

        return "reservas";
    }

    /**
     * Cancela una reserva.
     */
    @PostMapping("/cancelar/{id}")
    public String cancelar(@PathVariable Long id, HttpSession session) {

        Usuario usuario = (Usuario) session.getAttribute("usuarioLogueado");

        if (usuario == null) {
            return "redirect:/login";
        }

        reservaService.cancelar(id);

        return "redirect:/reservas?cancelada";
    }

    @GetMapping("/nueva")
    public String nuevaReserva(
            @RequestParam Long idParqueo,
            @RequestParam LocalDate fecha,
            @RequestParam LocalTime horaInicio,
            @RequestParam LocalTime horaSalida,
            HttpSession session) {

        Usuario usuario
                = (Usuario) session.getAttribute("usuarioLogueado");

        if (usuario == null) {
            return "redirect:/login";
        }

        Parqueo parqueo = parqueoService.obtenerPorId(idParqueo);

        if (parqueo == null) {
            return "redirect:/dashboard?parqueoNoEncontrado";
        }

        if (parqueo.getEspaciosDisponibles() == null
                || parqueo.getEspaciosDisponibles() <= 0) {

            return "redirect:/dashboard?sinEspacios";
        }

        if (fecha.isBefore(LocalDate.now())) {
            return "redirect:/dashboard?fechaInvalida";
        }

        if (!horaSalida.isAfter(horaInicio)) {
            return "redirect:/dashboard?horarioInvalido";
        }

        boolean existe = reservaService.existeReservaActiva(usuario.getIdUsuario(), parqueo.getIdParqueo(), fecha, horaInicio);

        if (existe) {
            return "redirect:/dashboard?reservaExistente";
        }

        long minutos = Duration.between(
                horaInicio,
                horaSalida
        ).toMinutes();

        if (minutos <= 0) {
            return "redirect:/dashboard?horarioInvalido";
        }

        /*
     * Se calcula el precio proporcionalmente.
     * Ejemplo: 1 hora y 30 minutos = 1.5 horas.
         */
        BigDecimal horasReserva
                = BigDecimal.valueOf(minutos)
                        .divide(
                                BigDecimal.valueOf(60),
                                2,
                                java.math.RoundingMode.HALF_UP
                        );

        BigDecimal precioTotal
                = parqueo.getTarifaHora()
                        .multiply(horasReserva)
                        .setScale(
                                2,
                                java.math.RoundingMode.HALF_UP
                        );

        int numeroEspacio
                = parqueo.getEspaciosTotales()
                - parqueo.getEspaciosDisponibles()
                + 1;

        Reserva reserva = new Reserva();

        reserva.setUsuario(usuario);
        reserva.setParqueo(parqueo);
        reserva.setFecha(fecha);
        reserva.setHoraInicio(horaInicio);
        reserva.setHoraSalida(horaSalida);
        reserva.setEstado(EstadoReserva.ACTIVA);

        reserva.setCodigoReserva(
                "ESP-" + System.currentTimeMillis()
        );

        reserva.setEspacioAsignado(
                "E-" + numeroEspacio
        );

        reserva.setPrecioTotal(precioTotal);
        reserva.setFechaCreacion(LocalDateTime.now());
        reserva.setFechaActualizacion(LocalDateTime.now());

        parqueo.setEspaciosDisponibles(
                parqueo.getEspaciosDisponibles() - 1
        );

        parqueoService.guardar(parqueo);
        reservaService.guardar(reserva);

        return "redirect:/reservas?creada";
    }

}

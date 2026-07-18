/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.controller;

// Importes
import com.easyspot.dto.ParqueoDashboardDTO;
import com.easyspot.service.ParqueoService;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 *
 * @author XPC
 */
@Controller
public class DashboardController {

    private final ParqueoService parqueoService;

    /*
     * Se obtiene la API key de Google Maps desde application.properties.
     */
    @Value("${google.maps.api-key}")
    private String googleMapsApiKey;

    public DashboardController(ParqueoService parqueoService) {
        this.parqueoService = parqueoService;
    }

    @GetMapping("/dashboard")
    public String dashboard(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BigDecimal precioMaximo,
            @RequestParam(required = false) Integer espaciosMinimos,
            @RequestParam(required = false) Boolean techado,
            @RequestParam(required = false) LocalDate fecha,
            @RequestParam(required = false) LocalTime horaInicio,
            @RequestParam(required = false) LocalTime horaSalida,
            HttpSession session,
            Model model) {

        /*
         * Se verifica que el usuario haya iniciado sesión.
         */
        if (session.getAttribute("usuarioLogueado") == null) {
            return "redirect:/login";
        }

        /*
         * Se consultan los parqueos aplicando los filtros recibidos.
         */
        List<ParqueoDashboardDTO> resultados
                = parqueoService.buscarParaDashboard(
                        q,
                        precioMaximo,
                        espaciosMinimos,
                        techado
                );

        /*
         * Se envían los parqueos y los datos generales al dashboard.
         */
        model.addAttribute("parqueos", resultados);

        model.addAttribute(
                "mejorParqueo",
                parqueoService.obtenerMejorOpcion(resultados).orElse(null)
        );

        model.addAttribute(
                "totalEspacios",
                parqueoService.contarEspaciosDisponibles(resultados)
        );

        model.addAttribute(
                "cantidadResultados",
                resultados.size()
        );

        /*
         * Se mantienen los valores de los filtros en el formulario.
         */
        model.addAttribute("q", q);
        model.addAttribute("precioMaximo", precioMaximo);
        model.addAttribute("espaciosMinimos", espaciosMinimos);
        model.addAttribute("techado", techado);

        /*
         * Si no se seleccionó una fecha, se utiliza la fecha actual.
         */
        model.addAttribute(
                "fechaSeleccionada",
                fecha != null
                        ? fecha
                        : LocalDate.now()
        );

        /*
         * Si no se seleccionó una hora de inicio,
         * se utiliza las 2:00 p. m.
         */
        model.addAttribute(
                "horaInicioSeleccionada",
                horaInicio != null
                        ? horaInicio
                        : LocalTime.of(14, 0)
        );

        /*
         * Si no se seleccionó una hora de salida,
         * se utiliza las 5:00 p. m.
         */
        model.addAttribute(
                "horaSalidaSeleccionada",
                horaSalida != null
                        ? horaSalida
                        : LocalTime.of(17, 0)
        );

        /*
         * Se envía la API key de Google Maps a dashboard.html.
         */
        model.addAttribute(
                "googleMapsApiKey",
                googleMapsApiKey
        );

        return "dashboard";
    }
}
/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.controller;

// Importes
import com.easyspot.dto.ParqueoDashboardDTO;
import com.easyspot.service.FavoritoService;
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
import com.easyspot.domain.Favorito;
import com.easyspot.domain.Usuario;
import java.util.Set;
import java.util.stream.Collectors;

/**
 *
 * @author XPC
 */
@Controller
public class DashboardController {

    private final ParqueoService parqueoService;
    private final FavoritoService favoritoService;

    /*
     * Se obtiene la API key de Google Maps desde application.properties.
     */
    @Value("${google.maps.api-key}")
    private String googleMapsApiKey;

    public DashboardController(ParqueoService parqueoService, FavoritoService favoritoService) {
        this.parqueoService = parqueoService;
        this.favoritoService = favoritoService;
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
        Usuario usuario
                = (Usuario) session.getAttribute("usuarioLogueado");

        if (usuario == null) {
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
     * Se obtienen los parqueos favoritos del usuario.
         */
        List<Favorito> favoritos
                = favoritoService.obtenerFavoritos(
                        usuario.getIdUsuario()
                );

        Set<Long> favoritosIds = favoritos.stream()
                .map(favorito
                        -> favorito.getParqueo().getIdParqueo())
                .collect(Collectors.toSet());

        /*
     * Se envían los parqueos y favoritos al dashboard.
         */
        model.addAttribute("parqueos", resultados);
        model.addAttribute("favoritosIds", favoritosIds);

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

        model.addAttribute(
                "googleMapsApiKey",
                googleMapsApiKey
        );

        // Mantén aquí el resto de tus atributos actuales.
        return "dashboard";
    }

    private boolean noLogueado(HttpSession session) {
        return session.getAttribute("usuarioLogueado") == null;
    }

    @GetMapping("/")
    public String landing() {
        return "index";
    }

    @GetMapping("/reportes")
    public String reportes(HttpSession session) {
        if (noLogueado(session)) {
            return "redirect:/login";
        }
        return "reportes";
    }

    @GetMapping("/perfil")
    public String perfil(HttpSession session) {
        if (noLogueado(session)) {
            return "redirect:/login";
        }
        return "perfil";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/registro")
    public String registro() {
        return "registro";
    }
}

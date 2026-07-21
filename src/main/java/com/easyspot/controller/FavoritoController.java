/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.controller;

// Importes
import com.easyspot.domain.Favorito;
import com.easyspot.domain.Usuario;
import com.easyspot.service.FavoritoService;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 *
 * @author XPC
 */
@Controller
@RequestMapping("/favoritos")
public class FavoritoController {

    private final FavoritoService favoritoService;

    public FavoritoController(FavoritoService favoritoService) {
        this.favoritoService = favoritoService;
    }

    @GetMapping
    public String mostrarFavoritos(
            HttpSession session,
            Model model) {

        Usuario usuario = (Usuario) session.getAttribute("usuarioLogueado");

        if (usuario == null) {
            return "redirect:/login";
        }

        List<Favorito> favoritos
                = favoritoService.obtenerFavoritos(usuario.getIdUsuario());

        model.addAttribute("favoritos", favoritos);
        model.addAttribute("totalFavoritos", favoritos.size());

        return "favoritos";
    }

    @PostMapping("/agregar/{idParqueo}")
    public String agregarFavorito(
            @PathVariable Long idParqueo,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        Usuario usuario = (Usuario) session.getAttribute("usuarioLogueado");

        if (usuario == null) {
            return "redirect:/login";
        }

        favoritoService.agregarFavorito(
                usuario.getIdUsuario(),
                idParqueo
        );

        redirectAttributes.addFlashAttribute(
                "success",
                "Parqueo agregado a favoritos."
        );

        return "redirect:/dashboard";
    }

    @PostMapping("/eliminar/{idParqueo}")
    public String eliminarFavorito(
            @PathVariable Long idParqueo,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        Usuario usuario = (Usuario) session.getAttribute("usuarioLogueado");

        if (usuario == null) {
            return "redirect:/login";
        }

        favoritoService.eliminarFavorito(
                usuario.getIdUsuario(),
                idParqueo
        );

        redirectAttributes.addFlashAttribute(
                "success",
                "Parqueo eliminado de favoritos."
        );

        return "redirect:/favoritos";
    }
}

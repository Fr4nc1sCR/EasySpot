/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.controller;

// Importes
import com.easyspot.domain.Usuario;
import com.easyspot.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/**
 *
 * @author XPC
 */
@Controller
public class AuthController {

    private final UsuarioService usuarioService;

    public AuthController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/registro")
    public String registrar(
            @RequestParam String nombre,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            Model model
    ) {
        if (!password.equals(confirmPassword)) {
            model.addAttribute("error", "Las contraseñas no coinciden.");
            return "redirect:/registro?noCoincidePassword";
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setEmail(email);
        usuario.setPassword(password);

        boolean registrado = usuarioService.registrar(usuario);

        if (!registrado) {
            model.addAttribute("error", "Ya existe una cuenta con ese correo.");
            return "redirect:/registro?correoExiste";
        }

        model.addAttribute("success", "Cuenta creada correctamente. Ahora puede iniciar sesión.");
        return "redirect:/login?registroExitoso";
    }

    @PostMapping("/login")
    public String login(
            @RequestParam String email,
            @RequestParam String password,
            HttpSession session,
            Model model
    ) {
        Optional<Usuario> usuario = usuarioService.login(email, password);

        if (usuario.isEmpty()) {
            model.addAttribute("error", "Correo o contraseña incorrectos.");
            return "redirect:/login?errorLogin";
        }

        session.setAttribute("usuarioLogueado", usuario.get());

        return "redirect:/home?loginExitoso";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/?logout";
    }
}

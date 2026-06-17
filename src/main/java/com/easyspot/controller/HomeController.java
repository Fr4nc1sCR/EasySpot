/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.controller;

// Importes
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 *
 * @author XPC
 */
@Controller
public class HomeController {

    private boolean noLogueado(HttpSession session) {
        return session.getAttribute("usuarioLogueado") == null;
    }

    @GetMapping("/")
    public String landing() {
        return "index";
    }

    @GetMapping("/home")
    public String home(HttpSession session) {
        if (noLogueado(session)) {
            return "redirect:/login";
        }
        return "home";
    }

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session) {
        if (noLogueado(session)) {
            return "redirect:/login";
        }
        return "dashboard";
    }

    @GetMapping("/reservas")
    public String reservas(HttpSession session) {
        if (noLogueado(session)) {
            return "redirect:/login";
        }
        return "reservas";
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
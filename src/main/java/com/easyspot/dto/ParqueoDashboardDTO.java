/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.dto;

// Importes
import com.easyspot.domain.Parqueo;
import java.math.BigDecimal;

/**
 *
 * @author XPC
 */
public class ParqueoDashboardDTO {
    private Parqueo parqueo;
    private double puntuacion;
    private int porcentajeOcupacion;
    private String nivelDisponibilidad;
    private boolean mejorOpcion;

    public ParqueoDashboardDTO() {
    }

    public ParqueoDashboardDTO(
            Parqueo parqueo,
            double puntuacion,
            int porcentajeOcupacion,
            String nivelDisponibilidad,
            boolean mejorOpcion) {

        this.parqueo = parqueo;
        this.puntuacion = puntuacion;
        this.porcentajeOcupacion = porcentajeOcupacion;
        this.nivelDisponibilidad = nivelDisponibilidad;
        this.mejorOpcion = mejorOpcion;
    }

    public Parqueo getParqueo() {
        return parqueo;
    }

    public void setParqueo(Parqueo parqueo) {
        this.parqueo = parqueo;
    }

    public double getPuntuacion() {
        return puntuacion;
    }

    public void setPuntuacion(double puntuacion) {
        this.puntuacion = puntuacion;
    }

    public int getPorcentajeOcupacion() {
        return porcentajeOcupacion;
    }

    public void setPorcentajeOcupacion(int porcentajeOcupacion) {
        this.porcentajeOcupacion = porcentajeOcupacion;
    }

    public String getNivelDisponibilidad() {
        return nivelDisponibilidad;
    }

    public void setNivelDisponibilidad(String nivelDisponibilidad) {
        this.nivelDisponibilidad = nivelDisponibilidad;
    }

    public boolean isMejorOpcion() {
        return mejorOpcion;
    }

    public void setMejorOpcion(boolean mejorOpcion) {
        this.mejorOpcion = mejorOpcion;
    }

    public BigDecimal getTarifaHora() {
        return parqueo.getTarifaHora();
    }
}

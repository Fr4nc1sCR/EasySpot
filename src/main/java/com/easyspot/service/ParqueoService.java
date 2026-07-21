/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.service;

// Importes
import com.easyspot.domain.Parqueo;
import com.easyspot.dto.ParqueoDashboardDTO;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 *
 * @author XPC
 */
public interface ParqueoService {
    List<ParqueoDashboardDTO> buscarParaDashboard(String texto,BigDecimal precioMaximo,Integer espaciosMinimos,Boolean techado);
    Optional<ParqueoDashboardDTO> obtenerMejorOpcion(List<ParqueoDashboardDTO> resultados);
    int contarEspaciosDisponibles(List<ParqueoDashboardDTO> resultados);
    Parqueo obtenerPorId(Long idParqueo);
    Parqueo guardar(Parqueo parqueo);
}

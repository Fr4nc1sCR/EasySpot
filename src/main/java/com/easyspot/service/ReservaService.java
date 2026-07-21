/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.service;

// Importes
import com.easyspot.domain.Reserva;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;

/**
 *
 * @author XPC
 */
public interface ReservaService {

    Reserva guardar(Reserva reserva);

    Reserva obtenerPorId(Long idReserva);

    List<Reserva> obtenerReservasUsuario(Long idUsuario);

    List<Reserva> obtenerReservasActivas(Long idUsuario);

    void cancelar(Long idReserva);

    List<Reserva> obtenerHistorial(Long idUsuario);

    boolean existeReservaActiva(Long idUsuario, Long idParqueo, LocalDate fecha, LocalTime horaInicio);

    int contarReservas(Long idUsuario);

    int contarReservasCanceladas(Long idUsuario);
    
    String obtenerTiempoPromedio(Long idUsuario);
    
    void actualizarReservasCompletadas();
}

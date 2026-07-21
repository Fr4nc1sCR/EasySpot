/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.repository;

// Importes
import com.easyspot.domain.EstadoReserva;
import com.easyspot.domain.Reserva;
import java.time.*;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 *
 * @author XPC
 */
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    List<Reserva> findByUsuarioIdUsuarioOrderByFechaDescHoraInicioDesc(Long idUsuario);

    List<Reserva> findByUsuarioIdUsuarioAndEstadoOrderByFechaAscHoraInicioAsc(Long idUsuario,EstadoReserva estado);
    
    List<Reserva> findByUsuarioIdUsuarioAndEstadoNotOrderByFechaDescHoraInicioDesc(Long idUsuario,EstadoReserva estado);
    
    boolean existsByUsuarioIdUsuarioAndParqueoIdParqueoAndFechaAndHoraInicioAndEstado(Long idUsuario, Long idParqueo, LocalDate fecha, LocalTime horaInicio, EstadoReserva estado);

    List<Reserva> findByEstado(EstadoReserva estado);
}

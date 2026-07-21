/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.impl;

// Importes
import com.easyspot.domain.Parqueo;
import com.easyspot.domain.EstadoReserva;
import com.easyspot.domain.Reserva;
import com.easyspot.repository.ParqueoRepository;
import com.easyspot.repository.ReservaRepository;
import com.easyspot.service.ReservaService;
import java.time.*;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.Map;
import java.util.stream.Collectors;

/**
 *
 * @author XPC
 */
@Service
public class ReservaServiceImpl implements ReservaService {

    private final ReservaRepository reservaRepository;
    private final ParqueoRepository parqueoRepository;

    public ReservaServiceImpl(ReservaRepository reservaRepository, ParqueoRepository parqueoRepository) {
        this.reservaRepository = reservaRepository;
        this.parqueoRepository = parqueoRepository;
    }

    @Override
    @Transactional
    public Reserva guardar(Reserva reserva) {
        return reservaRepository.save(reserva);
    }

    @Override
    public Reserva obtenerPorId(Long idReserva) {
        return reservaRepository.findById(idReserva).orElse(null);
    }

    @Override
    public List<Reserva> obtenerReservasUsuario(Long idUsuario) {
        return reservaRepository.findByUsuarioIdUsuarioOrderByFechaDescHoraInicioDesc(idUsuario);
    }

    @Override
    public List<Reserva> obtenerReservasActivas(Long idUsuario) {
        return reservaRepository.findByUsuarioIdUsuarioAndEstadoOrderByFechaAscHoraInicioAsc(
                idUsuario,
                EstadoReserva.ACTIVA
        );
    }

    @Override
    public void cancelar(Long idReserva) {

        Reserva reserva = reservaRepository.findById(idReserva)
                .orElseThrow(()
                        -> new IllegalArgumentException("Reserva no encontrada"));

        if (reserva.getEstado() == EstadoReserva.CANCELADA) {
            return;
        }

        Parqueo parqueo = reserva.getParqueo();

        if (parqueo != null) {

            int espaciosDisponibles = parqueo.getEspaciosDisponibles();
            int espaciosTotales = parqueo.getEspaciosTotales();

            if (espaciosDisponibles < espaciosTotales) {
                parqueo.setEspaciosDisponibles(
                        espaciosDisponibles + 1
                );

                parqueoRepository.save(parqueo);
            }
        }

        reserva.setEstado(EstadoReserva.CANCELADA);
        reserva.setFechaActualizacion(LocalDateTime.now());

        reservaRepository.save(reserva);
    }

    @Override
    public List<Reserva> obtenerHistorial(Long idUsuario) {
        return reservaRepository.findByUsuarioIdUsuarioAndEstadoNotOrderByFechaDescHoraInicioDesc(idUsuario, EstadoReserva.ACTIVA);
    }

    @Override
    public boolean existeReservaActiva(Long idUsuario, Long idParqueo, LocalDate fecha, LocalTime horaInicio) {

        return reservaRepository.existsByUsuarioIdUsuarioAndParqueoIdParqueoAndFechaAndHoraInicioAndEstado(idUsuario, idParqueo, fecha, horaInicio, EstadoReserva.ACTIVA);
    }

    @Override
    public int contarReservas(Long idUsuario) {
        return reservaRepository.findByUsuarioIdUsuarioOrderByFechaDescHoraInicioDesc(idUsuario).size();
    }

    @Override
    public int contarReservasCanceladas(Long idUsuario) {
        return (int) reservaRepository.findByUsuarioIdUsuarioOrderByFechaDescHoraInicioDesc(idUsuario).stream().filter(reserva -> reserva.getEstado() == EstadoReserva.CANCELADA).count();
    }

    @Override
    public String obtenerTiempoPromedio(Long idUsuario) {

        List<Reserva> reservasCompletadas
                = reservaRepository
                        .findByUsuarioIdUsuarioAndEstadoOrderByFechaAscHoraInicioAsc(
                                idUsuario,
                                EstadoReserva.COMPLETADA
                        );

        long[] duraciones = reservasCompletadas.stream()
                .filter(reserva
                        -> reserva.getHoraInicio() != null
                && reserva.getHoraSalida() != null)
                .mapToLong(reserva
                        -> Duration.between(
                        reserva.getHoraInicio(),
                        reserva.getHoraSalida()
                ).toMinutes())
                .filter(minutos -> minutos > 0)
                .toArray();

        if (duraciones.length == 0) {
            return "--";
        }

        long minutosTotales = 0;

        for (long duracion : duraciones) {
            minutosTotales += duracion;
        }

        long promedioMinutos
                = minutosTotales / duraciones.length;

        long horas = promedioMinutos / 60;
        long minutos = promedioMinutos % 60;

        return horas + " h " + minutos + " min";
    }

    @Override
    @Transactional
    public void actualizarReservasCompletadas() {

        LocalDateTime ahora = LocalDateTime.now();

        List<Reserva> reservasActivas
                = reservaRepository.findByEstado(
                        EstadoReserva.ACTIVA
                );

        for (Reserva reserva : reservasActivas) {

            if (reserva.getFecha() == null
                    || reserva.getHoraSalida() == null) {
                continue;
            }

            LocalDateTime fechaHoraSalida
                    = LocalDateTime.of(
                            reserva.getFecha(),
                            reserva.getHoraSalida()
                    );

            if (fechaHoraSalida.isAfter(ahora)) {
                continue;
            }

            reserva.setEstado(
                    EstadoReserva.COMPLETADA
            );

            reserva.setFechaActualizacion(
                    ahora
            );

            Parqueo parqueo = reserva.getParqueo();

            if (parqueo != null
                    && parqueo.getEspaciosDisponibles() != null
                    && parqueo.getEspaciosTotales() != null
                    && parqueo.getEspaciosDisponibles()
                    < parqueo.getEspaciosTotales()) {

                parqueo.setEspaciosDisponibles(
                        parqueo.getEspaciosDisponibles() + 1
                );

                parqueoRepository.save(parqueo);
            }

            reservaRepository.save(reserva);
        }
    }
}

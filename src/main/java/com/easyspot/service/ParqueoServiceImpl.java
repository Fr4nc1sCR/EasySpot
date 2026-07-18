/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.service;

// Importes
import com.easyspot.domain.Parqueo;
import com.easyspot.dto.ParqueoDashboardDTO;
import com.easyspot.repository.ParqueoRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author XPC
 */
@Service
public class ParqueoServiceImpl implements ParqueoService {

    private final ParqueoRepository parqueoRepository;

    public ParqueoServiceImpl(ParqueoRepository parqueoRepository) {
        this.parqueoRepository = parqueoRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParqueoDashboardDTO> buscarParaDashboard(
            String texto,
            BigDecimal precioMaximo,
            Integer espaciosMinimos,
            Boolean techado) {

        List<Parqueo> parqueos = parqueoRepository.buscarParaDashboard(
                limpiarTexto(texto),
                precioMaximo,
                espaciosMinimos,
                techado
        );

        List<ParqueoDashboardDTO> resultados = parqueos.stream()
                .map(this::convertirADTO)
                .sorted(Comparator.comparingDouble(
                        ParqueoDashboardDTO::getPuntuacion
                ).reversed())
                .toList();

        if (!resultados.isEmpty()) {
            resultados.get(0).setMejorOpcion(true);
        }

        return resultados;
    }

    @Override
    public Optional<ParqueoDashboardDTO> obtenerMejorOpcion(
            List<ParqueoDashboardDTO> resultados) {

        return resultados.stream()
                .max(Comparator.comparingDouble(
                        ParqueoDashboardDTO::getPuntuacion
                ));
    }

    @Override
    public int contarEspaciosDisponibles(
            List<ParqueoDashboardDTO> resultados) {

        return resultados.stream()
                .mapToInt(dto -> dto.getParqueo().getEspaciosDisponibles())
                .sum();
    }

    private ParqueoDashboardDTO convertirADTO(Parqueo parqueo) {

        int totales = valorSeguro(parqueo.getEspaciosTotales());
        int disponibles = valorSeguro(parqueo.getEspaciosDisponibles());

        int ocupados = Math.max(totales - disponibles, 0);

        int porcentajeOcupacion = totales == 0
                ? 0
                : (int) Math.round((ocupados * 100.0) / totales);

        double precio = parqueo.getTarifaHora() == null
                ? 0
                : parqueo.getTarifaHora().doubleValue();

        double calificacion = parqueo.getCalificacion() == null
                ? 0
                : parqueo.getCalificacion().doubleValue();

        double puntuacion =
                disponibles * 2.0
                - precio / 100.0
                + (100 - porcentajeOcupacion) * 0.4
                + calificacion * 10
                + (Boolean.TRUE.equals(parqueo.getSeguridad24h()) ? 8 : 0)
                + (Boolean.TRUE.equals(parqueo.getCamaras()) ? 5 : 0)
                + (Boolean.TRUE.equals(parqueo.getTechado()) ? 4 : 0);

        String nivelDisponibilidad;

        if (disponibles == 0) {
            nivelDisponibilidad = "agotado";
        } else if (porcentajeOcupacion < 60) {
            nivelDisponibilidad = "alta";
        } else if (porcentajeOcupacion < 85) {
            nivelDisponibilidad = "media";
        } else {
            nivelDisponibilidad = "baja";
        }

        return new ParqueoDashboardDTO(
                parqueo,
                Math.round(puntuacion * 10.0) / 10.0,
                porcentajeOcupacion,
                nivelDisponibilidad,
                false
        );
    }

    private String limpiarTexto(String texto) {
        return texto == null ? null : texto.trim();
    }

    private int valorSeguro(Integer valor) {
        return valor == null ? 0 : valor;
    }
}

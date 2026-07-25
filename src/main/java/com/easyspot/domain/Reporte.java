/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.domain;

// Importes
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import lombok.Data;

/**
 *
 * @author XPC
 */
@Data
@Entity
@Table(name = "reportes")
public class Reporte implements Serializable {

    private static final long serialVersionUID = 1L;

    //==========================
    // ID
    //==========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reporte")
    private Long idReporte;

    //==========================
    // Usuario que crea el reporte
    //==========================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    //==========================
    // Parqueo relacionado
    //==========================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_parqueo", nullable = false)
    private Parqueo parqueo;

    //==========================
    // Tipo de incidente
    //==========================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoReporte tipo;

    //==========================
    // Información
    //==========================

    @Column(nullable = false, length = 100)
    private String titulo;

    @Column(nullable = false, length = 700)
    private String descripcion;

    @Column(nullable = false, length = 200)
    private String ubicacion;

    @Column(name = "imagen_url", length = 300)
    private String imagenUrl;

    // Coordenadas GPS

    private Double latitud;

    private Double longitud;

    //==========================
    // Estado
    //==========================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoReporte estado;

    //==========================
    // Prioridad
    //==========================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PrioridadReporte prioridad;

    //==========================
    // Comunidad
    //==========================

    @Column(name = "votos_positivos")
    private Integer votosPositivos = 0;

    @Column(name = "votos_negativos")
    private Integer votosNegativos = 0;

    @Column(name = "porcentaje_confianza")
    private Integer porcentajeConfianza = 0;

    //==========================
    // Auditoría
    //==========================

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {

        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();

        if (estado == null) {
            estado = EstadoReporte.ACTIVO;
        }

        if (prioridad == null) {
            prioridad = PrioridadReporte.BAJA;
        }

        if (votosPositivos == null) {
            votosPositivos = 0;
        }

        if (votosNegativos == null) {
            votosNegativos = 0;
        }

        if (porcentajeConfianza == null) {
            porcentajeConfianza = 0;
        }

    }

    @PreUpdate
    public void preUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

}

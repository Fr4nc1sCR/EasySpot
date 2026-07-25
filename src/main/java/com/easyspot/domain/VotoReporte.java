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
@Table(
    name = "votos_reportes",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {
                "id_usuario",
                "id_reporte"
            }
        )
    }
)
public class VotoReporte implements Serializable {

    private static final long serialVersionUID = 1L;

    //========================================================
    // ID
    //========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_voto")
    private Long idVoto;

    //========================================================
    // Usuario
    //========================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "id_usuario",
            nullable = false
    )
    private Usuario usuario;

    //========================================================
    // Reporte
    //========================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "id_reporte",
            nullable = false
    )
    private Reporte reporte;

    //========================================================
    // Tipo de voto
    //========================================================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private TipoVoto tipo;

    //========================================================
    // Auditoría
    //========================================================

    @Column(name = "fecha_voto")
    private LocalDateTime fechaVoto;

    @PrePersist
    public void prePersist() {
        fechaVoto = LocalDateTime.now();
    }

}

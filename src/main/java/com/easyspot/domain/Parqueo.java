/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.easyspot.domain;

// Importes
import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 *
 * @author XPC
 */
@Entity
@Table(name = "parqueos")
public class Parqueo implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_parqueo")
    private Long idParqueo;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(nullable = false, length = 255)
    private String direccion;

    @Column(nullable = false, length = 80)
    private String provincia;

    @Column(nullable = false, length = 80)
    private String canton;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitud;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitud;

    @Column(name = "tarifa_hora", nullable = false, precision = 10, scale = 2)
    private BigDecimal tarifaHora;

    @Column(name = "espacios_totales", nullable = false)
    private Integer espaciosTotales;

    @Column(name = "espacios_disponibles", nullable = false)
    private Integer espaciosDisponibles;

    @Column(precision = 3, scale = 2)
    private BigDecimal calificacion;

    @Column(name = "total_resenas")
    private Integer totalResenas;

    private Boolean techado;

    @Column(name = "seguridad_24h")
    private Boolean seguridad24h;

    private Boolean camaras;

    @Column(name = "acceso_discapacidad")
    private Boolean accesoDiscapacidad;

    @Column(name = "mapa_x")
    private Integer mapaX;

    @Column(name = "mapa_y")
    private Integer mapaY;

    @Column(name = "imagen_url")
    private String imagenUrl;

    private Boolean activo;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    public Parqueo() {
    }

    public Long getIdParqueo() {
        return idParqueo;
    }

    public void setIdParqueo(Long idParqueo) {
        this.idParqueo = idParqueo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getProvincia() {
        return provincia;
    }

    public void setProvincia(String provincia) {
        this.provincia = provincia;
    }

    public String getCanton() {
        return canton;
    }

    public void setCanton(String canton) {
        this.canton = canton;
    }

    public BigDecimal getLatitud() {
        return latitud;
    }

    public void setLatitud(BigDecimal latitud) {
        this.latitud = latitud;
    }

    public BigDecimal getLongitud() {
        return longitud;
    }

    public void setLongitud(BigDecimal longitud) {
        this.longitud = longitud;
    }

    public BigDecimal getTarifaHora() {
        return tarifaHora;
    }

    public void setTarifaHora(BigDecimal tarifaHora) {
        this.tarifaHora = tarifaHora;
    }

    public Integer getEspaciosTotales() {
        return espaciosTotales;
    }

    public void setEspaciosTotales(Integer espaciosTotales) {
        this.espaciosTotales = espaciosTotales;
    }

    public Integer getEspaciosDisponibles() {
        return espaciosDisponibles;
    }

    public void setEspaciosDisponibles(Integer espaciosDisponibles) {
        this.espaciosDisponibles = espaciosDisponibles;
    }

    public BigDecimal getCalificacion() {
        return calificacion;
    }

    public void setCalificacion(BigDecimal calificacion) {
        this.calificacion = calificacion;
    }

    public Integer getTotalResenas() {
        return totalResenas;
    }

    public void setTotalResenas(Integer totalResenas) {
        this.totalResenas = totalResenas;
    }

    public Boolean getTechado() {
        return techado;
    }

    public void setTechado(Boolean techado) {
        this.techado = techado;
    }

    public Boolean getSeguridad24h() {
        return seguridad24h;
    }

    public void setSeguridad24h(Boolean seguridad24h) {
        this.seguridad24h = seguridad24h;
    }

    public Boolean getCamaras() {
        return camaras;
    }

    public void setCamaras(Boolean camaras) {
        this.camaras = camaras;
    }

    public Boolean getAccesoDiscapacidad() {
        return accesoDiscapacidad;
    }

    public void setAccesoDiscapacidad(Boolean accesoDiscapacidad) {
        this.accesoDiscapacidad = accesoDiscapacidad;
    }

    public Integer getMapaX() {
        return mapaX;
    }

    public void setMapaX(Integer mapaX) {
        this.mapaX = mapaX;
    }

    public Integer getMapaY() {
        return mapaY;
    }

    public void setMapaY(Integer mapaY) {
        this.mapaY = mapaY;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}

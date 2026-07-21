document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);

    const easySpotAlert = {
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#06b6d4",
        customClass: {
            popup: "easyspot-popup",
            title: "easyspot-title",
            confirmButton: "easyspot-btn"
        }
    };

    const limpiarParametros = () => {
        window.history.replaceState(
                {},
                document.title,
                window.location.pathname
                );
    };

    const formulariosCancelar = document.querySelectorAll(".form-cancelar-reserva");

    formulariosCancelar.forEach((formulario) => {

        formulario.addEventListener("submit", (evento) => {

            evento.preventDefault();

            Swal.fire({
                ...easySpotAlert,
                icon: "warning",
                title: "¿Cancelar la reserva?",
                text: "El espacio volverá a estar disponible para otros usuarios.",
                showCancelButton: true,
                confirmButtonText: "Sí, cancelar",
                cancelButtonText: "No, mantener reserva",
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "#64748b",
                reverseButtons: true
            }).then((resultado) => {

                if (resultado.isConfirmed) {
                    formulario.submit();
                }

            });

        });

    });

    if (params.has("noCoincidePassword")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "error",
            title: "No coinciden contraseñas",
            text: "Las credenciales para las crear la contraseña no coinciden.",
            confirmButtonText: "Intentar de nuevo"
        });
    }

    if (params.has("registroExitoso")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "success",
            title: "Cuenta creada correctamente",
            text: "Tu cuenta en EasySpot AI fue registrada con éxito. Ahora puedes iniciar sesión.",
            confirmButtonText: "Iniciar sesión"
        });
    }

    if (params.has("errorLogin")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "error",
            title: "No se pudo iniciar sesión",
            text: "El correo o la contraseña ingresados no son correctos.",
            confirmButtonText: "Intentar de nuevo"
        });
    }

    if (params.has("logout")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "success",
            title: "Sesión cerrada",
            text: "Has cerrado sesión correctamente. Te esperamos pronto en EasySpot AI.",
            confirmButtonText: "Aceptar"
        });
    }

    if (params.has("correoExiste")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "warning",
            title: "Correo ya registrado",
            text: "Ya existe una cuenta asociada a ese correo electrónico.",
            confirmButtonText: "Usar otro correo"
        });
    }

    if (params.has("loginExitoso")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "success",
            title: "Bienvenido a EasySpot AI",
            text: "Inicio de sesión realizado correctamente.",
            confirmButtonText: "Continuar"
        });
    }

    if (params.has("creada")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "success",
            title: "Reserva confirmada",
            text: "Tu espacio de parqueo fue reservado correctamente.",
            confirmButtonText: "Ver reserva"
        }).then(() => {
            limpiarParametros();
        });
    }

    if (params.has("cancelada")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "success",
            title: "Reserva cancelada",
            text: "La reserva fue cancelada correctamente y el espacio volvió a estar disponible.",
            confirmButtonText: "Aceptar"
        }).then(() => {
            limpiarParametros();
        });
    }

    if (params.has("reservaExistente")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "warning",
            title: "Reserva duplicada",
            text: "Ya tienes una reserva activa para este parqueo en la fecha y hora seleccionadas.",
            confirmButtonText: "Entendido"
        }).then(() => {
            limpiarParametros();
        });
    }

    if (params.has("sinEspacios")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "warning",
            title: "Parqueo sin espacios",
            text: "Este parqueo ya no cuenta con espacios disponibles.",
            confirmButtonText: "Buscar otro parqueo"
        }).then(() => {
            limpiarParametros();
        });
    }

    if (params.has("fechaInvalida")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "error",
            title: "Fecha no válida",
            text: "No puedes realizar una reserva para una fecha anterior a hoy.",
            confirmButtonText: "Corregir fecha"
        }).then(() => {
            limpiarParametros();
        });
    }

    if (params.has("horarioInvalido")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "error",
            title: "Horario no válido",
            text: "La hora de salida debe ser posterior a la hora de entrada.",
            confirmButtonText: "Corregir horario"
        }).then(() => {
            limpiarParametros();
        });
    }

    if (params.has("parqueoNoEncontrado")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "error",
            title: "Parqueo no encontrado",
            text: "No fue posible encontrar el parqueo seleccionado.",
            confirmButtonText: "Aceptar"
        }).then(() => {
            limpiarParametros();
        });
    }

    if (params.has("reporteEnviado")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "success",
            title: "Reporte enviado",
            text: "Gracias por ayudar a la comunidad EasySpot con información actualizada.",
            confirmButtonText: "Aceptar"
        });
    }

});
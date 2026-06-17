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

    if (params.has("reservaExitosa")) {
        Swal.fire({
            ...easySpotAlert,
            icon: "success",
            title: "Reserva confirmada",
            text: "Tu espacio de parqueo fue reservado correctamente.",
            confirmButtonText: "Ver reserva"
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
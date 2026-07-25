document.addEventListener("DOMContentLoaded", () => {
    const profileForm = document.querySelector(
        'form[action$="/perfil/actualizar"]'
    );

    const passwordForm = document.querySelector(
        'form[action$="/perfil/password"]'
    );

    inicializarFormularioPerfil(profileForm);
    inicializarFormularioPassword(passwordForm);
    inicializarAlertas();
});


function inicializarFormularioPerfil(form) {
    if (!form) {
        return;
    }

    const nombreInput = form.querySelector(
        'input[name="nombre"]'
    );

    const emailInput = form.querySelector(
        'input[name="email"]'
    );

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    form.addEventListener("submit", (event) => {
        limpiarErrores(form);

        const nombre = nombreInput?.value.trim() ?? "";
        const email = emailInput?.value.trim() ?? "";

        let formularioValido = true;

        if (nombre.length < 3) {
            mostrarError(
                nombreInput,
                "El nombre debe contener al menos 3 caracteres."
            );

            formularioValido = false;
        }

        if (!validarEmail(email)) {
            mostrarError(
                emailInput,
                "Ingresa un correo electrónico válido."
            );

            formularioValido = false;
        }

        if (!formularioValido) {
            event.preventDefault();
            enfocarPrimerError(form);
            return;
        }

        bloquearBoton(
            submitButton,
            "Guardando cambios..."
        );
    });
}


function inicializarFormularioPassword(form) {
    if (!form) {
        return;
    }

    const passwordActualInput = form.querySelector(
        'input[name="passwordActual"]'
    );

    const passwordNuevaInput = form.querySelector(
        'input[name="passwordNueva"]'
    );

    const confirmacionInput = form.querySelector(
        'input[name="confirmacionPassword"]'
    );

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    form.addEventListener("submit", (event) => {
        limpiarErrores(form);

        const passwordActual =
            passwordActualInput?.value ?? "";

        const passwordNueva =
            passwordNuevaInput?.value ?? "";

        const confirmacion =
            confirmacionInput?.value ?? "";

        let formularioValido = true;

        if (passwordActual.length === 0) {
            mostrarError(
                passwordActualInput,
                "Ingresa tu contraseña actual."
            );

            formularioValido = false;
        }

        if (passwordNueva.length < 6) {
            mostrarError(
                passwordNuevaInput,
                "La nueva contraseña debe tener al menos 6 caracteres."
            );

            formularioValido = false;
        }

        if (passwordNueva === passwordActual) {
            mostrarError(
                passwordNuevaInput,
                "La nueva contraseña debe ser diferente de la actual."
            );

            formularioValido = false;
        }

        if (confirmacion !== passwordNueva) {
            mostrarError(
                confirmacionInput,
                "Las contraseñas no coinciden."
            );

            formularioValido = false;
        }

        if (!formularioValido) {
            event.preventDefault();
            enfocarPrimerError(form);
            return;
        }

        const confirmacionCambio = window.confirm(
            "¿Deseas cambiar la contraseña de tu cuenta?"
        );

        if (!confirmacionCambio) {
            event.preventDefault();
            return;
        }

        bloquearBoton(
            submitButton,
            "Actualizando contraseña..."
        );
    });

    confirmacionInput?.addEventListener("input", () => {
        removerError(confirmacionInput);

        if (
            confirmacionInput.value.length > 0 &&
            confirmacionInput.value !== passwordNuevaInput.value
        ) {
            mostrarError(
                confirmacionInput,
                "Las contraseñas no coinciden."
            );
        }
    });

    passwordNuevaInput?.addEventListener("input", () => {
        removerError(passwordNuevaInput);

        if (
            confirmacionInput.value.length > 0 &&
            confirmacionInput.value !== passwordNuevaInput.value
        ) {
            mostrarError(
                confirmacionInput,
                "Las contraseñas no coinciden."
            );
        } else {
            removerError(confirmacionInput);
        }
    });
}


function validarEmail(email) {
    const expresion =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresion.test(email);
}


function mostrarError(input, mensaje) {
    if (!input) {
        return;
    }

    removerError(input);

    const control =
        input.closest(".profile-field-control");

    const field =
        input.closest(".profile-field");

    control?.classList.add(
        "profile-field-control-error"
    );

    input.setAttribute(
        "aria-invalid",
        "true"
    );

    const error = document.createElement("small");

    error.className = "profile-field-error";
    error.textContent = mensaje;

    field?.appendChild(error);
}


function removerError(input) {
    if (!input) {
        return;
    }

    const control =
        input.closest(".profile-field-control");

    const field =
        input.closest(".profile-field");

    control?.classList.remove(
        "profile-field-control-error"
    );

    input.removeAttribute("aria-invalid");

    field
        ?.querySelector(".profile-field-error")
        ?.remove();
}


function limpiarErrores(form) {
    form
        .querySelectorAll(".profile-field-error")
        .forEach((error) => error.remove());

    form
        .querySelectorAll(
            ".profile-field-control-error"
        )
        .forEach((control) => {
            control.classList.remove(
                "profile-field-control-error"
            );
        });

    form
        .querySelectorAll('[aria-invalid="true"]')
        .forEach((input) => {
            input.removeAttribute("aria-invalid");
        });
}


function enfocarPrimerError(form) {
    const primerError = form.querySelector(
        '[aria-invalid="true"]'
    );

    primerError?.focus();
}


function bloquearBoton(button, texto) {
    if (!button) {
        return;
    }

    button.disabled = true;

    button.dataset.textoOriginal =
        button.innerHTML;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        ${texto}
    `;
}


function inicializarAlertas() {
    const alertas = document.querySelectorAll(
        ".profile-alert"
    );

    alertas.forEach((alerta) => {
        window.setTimeout(() => {
            alerta.classList.add(
                "profile-alert-hidden"
            );

            window.setTimeout(() => {
                alerta.remove();
            }, 350);
        }, 5000);
    });
}
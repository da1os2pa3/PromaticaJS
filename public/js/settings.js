// CONTROL DE VISTAS -------------------------------------------------------------------------
const vistaFormulario = document.getElementById("vistaFormulario");  // formulario de carga/edición

// Botones del formulario de carga de clientes 
const btnGuardar = document.getElementById("btnGuardar");            // Boton guardar del formulario
const btnCancelar = document.getElementById("btnCancelar");          // Boton cancelar del formulario

// formulario
const formulario = document.getElementById("formSettings");          // const formulario = luego crea new FormData con esta constante

// mostrar mensaje
const mensaje = document.getElementById("mensaje");                  // espacio en el HTML para los mensajes

// BORRADO PANTALLA CONFIRMACION MENSAJE ACEPTACION ------------------------------------------
const modalConfirmacion = document.getElementById("modalConfirmacion");     // trabaja sobre ventana de confirmacion borrado registros
const textoConfirmacion = document.getElementById("textoConfirmacion");     // trabaja sobre ventana de confirmacion borrado registros
const btnCancelarBorrado = document.getElementById("btnCancelarBorrado");   // trabaja sobre ventana de confirmacion borrado registros
const btnConfirmarBorrado = document.getElementById("btnConfirmarBorrado"); // trabaja sobre ventana de confirmacion borrado registros

const audioContext = new AudioContext();

// Variables globales ------------------------------------------------------------------------
let clienteSeleccionado = null;
let modo = "nuevo"; // para saber si es alta o edicion
let idSeleccionado = null;
let indiceFilaActual = -1; // 👈 Agregado por seguridad para el control de teclado

async function cargarConfiguracion() {
    try {
        const respuesta = await fetch('/api/settings');
        if (!respuesta.ok) throw new Error('Error al leer');
        const datos = await respuesta.json();

        for (const [campo, valor] of Object.entries(datos)) {
            const input = formulario.elements[campo];
            if (input) input.value = valor ?? '';
        }
    } catch (error) {
        console.error('Error en cargarConfiguracion:', error);
        mostrarAviso('No se pudo cargar la configuración', 'error');
    }
}

cargarConfiguracion();

// GUARDAR - Botón guardar del formulario ----------------------------------------------------------------------
formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const datos = Object.fromEntries(new FormData(formulario));

    for (const clave in datos) {
        const campo = formulario.elements[clave];
        if (datos[clave] === "" && (campo.type === "date" || campo.type === "number")) {
            datos[clave] = null;
        }
    }

    try {
        const respuesta = await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        if (respuesta.status === 403) {
            mostrarAviso("No tenés permiso para modificar la configuración", "alerta");
            return;
        }
        if (!respuesta.ok) throw new Error("Error HTTP: " + respuesta.status);

        mostrarAviso("Configuración guardada correctamente", "exito");
        setTimeout(() => { window.location.href = "index.html"; }, 1500);

    } catch (error) {
        console.error("Error al guardar la configuración:", error);
        mostrarAviso("No se pudo guardar la configuración", "error");
    }
});

// BOTON CANCELAR ----------------------------------------------------------------------------------
btnCancelar.addEventListener("click", function () {
    window.location.href = "index.html";
});

// BOTON CANCELAR BARRA MODAL ------------------------------------------------------------------------
btnCancelarBorrado.addEventListener("click", function () {
    modalConfirmacion.style.display = "none";
});

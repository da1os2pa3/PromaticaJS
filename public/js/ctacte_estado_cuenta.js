// Crea un objeto con todas las variables que vienen en la URL para poder consultarlas fácilmente
// window.location.search obtiene la parte de la URL que contiene los parámetros de consulta (es decir, 
// todo lo que está a partir del signo de interrogación ?, por ejemplo: ?id=1415).

const params = new URLSearchParams(window.location.search);
const idCliente = params.get("id");

// Vistas de formularios -------------------------------------------------------------------------------
const formularioAjuste = document.getElementById("formularioAjuste");
const vistaFormularioAjuste = document.getElementById("formularioAjusteContenedor");
const vistaListado = document.getElementById("vistaListado");

// const mensaje = document.getElementById("mensaje") --------------------------------------------------
// const mensajeExito = document.getElementById("mensajeExito");
// const audioContext = new AudioContext();

// ELEMENTOS DE LA PÁGINA ------------------------------------------------------------------------------
const nombreCliente = document.getElementById("nombreCliente");
const btnVolver = document.getElementById("btnVolver");
const cuerpoTabla = document.querySelector("#tablaMovimientos tbody");
const saldoFinal = document.getElementById("saldoFinal");
const btnAjustes = document.getElementById("btnAjustes");
const btnVolverAjuste = document.getElementById("btnVolverAjuste");
const btnGuardar = document.getElementById("btnGuardar");

// Para ir al ultimo registro del formulario de movimientos de cuenta busca en tu documento ------------
// HTML la primera etiqueta que tenga asignada la clase tabla-contenedor (por ejemplo, un 
// elemento como <div class="tabla-contenedor"> ... </div>) y la guarda completa dentro de 
// la constante tablaContenedor. -----------------------------------------------------------------------
const tablaContenedor = document.querySelector(".tabla-contenedor");

// Inicialización de variables -------------------------------------------------------------------------
let listaMovimientos = [];
let filaSeleccionada = null;
let movimientoSeleccionado = null;

// FORMATOS VISUALES -----------------------------------------------------------------------------------
function formatearMonto(numero) {

    return Number(numero).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatearFecha(texto) {
    return new Date(texto).toLocaleDateString("es-AR");
}

// CARGA DE DATOS --------------------------------------------------------------------------------------
async function cargarCliente() {

    // router.get("/:id", async (req, res) => { - en clientes.routes.js para obtener un cliente por id
    const respuesta = await fetch(`/api/clientes/${idCliente}`);

    if (!respuesta.ok) {
        throw new Error("Error HTTP: " + respuesta.status);
    }
    const cliente = await respuesta.json();
    nombreCliente.textContent = cliente.apenombre;
}

async function cargarMovimientos() {

    // router.get('/:idCliente', async (req, res) => { - en ctacte.routes.js para obtener los movimientos de un cliente por id
    const respuesta = await fetch(`/api/ctacte/${idCliente}`);

    if (!respuesta.ok) {
        throw new Error("Error HTTP: " + respuesta.status);
    }
    const datos = await respuesta.json();
    renderizarMovimientos(datos.movimientos);
    irAlFinal();
    saldoFinal.textContent = formatearMonto(datos.saldoFinal);
}

// DIBUJAR LA TABLA ------------------------------------------------------------------------------------
function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
}

function renderizarMovimientos(movimientos) {

    listaMovimientos = movimientos;
    filaSeleccionada = null;
    movimientoSeleccionado = null;
    cuerpoTabla.innerHTML = "";

    movimientos.forEach(function (movimiento, indice) {
        const fila = document.createElement("tr");
        fila.dataset.indice = indice;
        fila.appendChild(crearCelda(formatearFecha(movimiento.fecha)));
        fila.appendChild(crearCelda(movimiento.detalle));
        fila.appendChild(crearCelda(movimiento.debito > 0 ? formatearMonto(movimiento.debito) : ""));
        fila.appendChild(crearCelda(movimiento.credito > 0 ? formatearMonto(movimiento.credito) : ""));
        fila.appendChild(crearCelda(formatearMonto(movimiento.saldo)));
        fila.addEventListener("click", function () {
            seleccionarFila(fila);
        });
        cuerpoTabla.appendChild(fila);
    });

    if (cuerpoTabla.lastElementChild !== null) {
        seleccionarFila(cuerpoTabla.lastElementChild);
    }
}

function seleccionarFila(fila) {

    if (filaSeleccionada !== null) {
        filaSeleccionada.classList.remove("seleccionada");
    }
    fila.classList.add("seleccionada");
    filaSeleccionada = fila;
    movimientoSeleccionado = listaMovimientos[Number(fila.dataset.indice)];
    fila.scrollIntoView({ block: "nearest" });
}

// Ir al ultimo registro del estado de cuenta
function irAlFinal() {
    tablaContenedor.scrollTop = tablaContenedor.scrollHeight;
    tablaContenedor.focus({ preventScroll: true });
}

tablaContenedor.addEventListener("keydown", function (evento) {
    if (filaSeleccionada === null) {
        return;
    }

    let destino = null;
    if (evento.key === "ArrowUp") {
        destino = filaSeleccionada.previousElementSibling;
    } else if (evento.key === "ArrowDown") {
        destino = filaSeleccionada.nextElementSibling;
    } else {
        return;
    }

    evento.preventDefault();
    if (destino !== null) {
        seleccionarFila(destino);
    }
});

// Boton volver a menu princiapl de cliente ----------------------------------------------------------
btnVolver.addEventListener("click", function () {
    window.location.href = "clientes.html";
});

// Boton ajustes a cuenta corriente -----------------------------------------------------------------
btnAjustes.addEventListener("click", function () {

    formularioAjuste.reset()
    vistaListado.style.display = "none";
    vistaFormularioAjuste.style.display = "block";
});

// Boton volver de formulario de ajustes al resumen de cuenta ----------------------------------------
btnVolverAjuste.addEventListener("click", async function () {
    // 1 - Debo mostrar el estado de cuenta
    vistaFormularioAjuste.style.display = "none";
    vistaListado.style.display = "block";
    try {
        await cargarMovimientos();
    } catch (error) {
        console.error("Error en fetch:", error);
        mostrarAviso("✕ No se pudo actualizar el estado de cuenta", 'error');
    }
});

// guardo el movimiento-no es submit ojo -------------------------------------------------------------
btnGuardar.addEventListener("click", async function () {

    // 👈 ya tengo el idCliente
    if (!Number(idCliente)) {
        alert("Debe seleccionar un cliente.");
        return;
    }

    const fechaMov = document.getElementById("fechaMov").value;
    const concepto = document.getElementById("concepto").value;
    const montoDeb = document.getElementById("montoDeb").value;
    const montoCre = document.getElementById("montoCre").value;

    // 👈 Armamos el objeto 
    const datos = {
        fechaMov: fechaMov,
        concepto: concepto,
        montoDeb: montoDeb,
        montoCre: montoCre
    };

    console.log(datos);

    try {

        const response = await fetch(`/api/ctacte/${idCliente}/ajustes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        })

        const respuesta = await response.json();

        if (!response.ok) {
            throw new Error(respuesta.error);
        }

        mostrarAviso('✓ Movimiento ingresado correctamente', 'exito');
        formularioAjuste.reset()
        document.getElementById("concepto").focus();

    } catch (error) {
        console.error("Error en fetch:", error);
        mostrarAviso("✕ " + error.message, 'error');
    }
});

// ARRANQUE --------------------------------------------------------------------------------------------
async function iniciar() {

    if (!idCliente) {
        mostrarAviso("No se indicó el cliente", "alerta");
        return;
    }

    try {
        await cargarCliente();
        await cargarMovimientos();
    } catch (error) {
        console.error("Error al cargar el estado de cuenta:", error);
        mostrarAviso("No se pudo cargar el estado de cuenta", "error");
    }
}

iniciar();


// Sonidos y mensajes ---------------------------------------------------------------------------------
// function mostrarMensajeExito(texto) {

//     mensajeExito.textContent = texto;
//     mensajeExito.style.color = "green";
//     sonidoOk();
//     setTimeout(() => { mensajeExito.textContent = ""; }, 3000);
// }

// function sonidoOk() {

//     const oscilador = audioContext.createOscillator();
//     const ganancia = audioContext.createGain();
//     oscilador.connect(ganancia);
//     ganancia.connect(audioContext.destination);
//     oscilador.frequency.value = 800;
//     ganancia.gain.value = 0.1;
//     oscilador.start();
//     oscilador.stop(audioContext.currentTime + 0.12);
// }
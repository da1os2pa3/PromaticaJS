// CONTROL DE VISTAS -------------------------------------------------------------------------
const vistaListado = document.getElementById("vistaListado");              // tabla
const vistaFormulario = document.getElementById("vistaFormulario");        // formulario de carga/edición

// Botones sobre la tabla de clientes
const btnNuevo = document.getElementById("btnNuevo");
const btnEditar = document.getElementById("btnEditar");
const btnBorrar = document.getElementById("btnBorrar");
const btnSalir = document.getElementById("btnSalir");
const btnReactivar = document.getElementById("btnReactivar");
const btnEstadoCuenta = document.getElementById("btnEstadoCuenta");

// Botones del formulario de carga de clientes 
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");

// barra de búsqueda - linea superior
const contenedorTabla = document.querySelector(".tabla-contenedor");
const ordenarPor = document.getElementById("ordenarPor");
const filtrarEstado = document.getElementById("filtrarEstado");
const filtrarClientes = document.getElementById("filtrarCliente");
const textoBuscar = document.getElementById("textoBuscar");

// formulario
const formulario = document.getElementById("formCliente");

// barra superior
const controlesSuperiores = document.getElementById('controlesSuperiores');

// mostrar mensaje
const mensaje = document.getElementById("mensaje");

// Para completar apellido y nombre
const inputNombre = document.getElementById('nombres');
const inputApellido = document.getElementById('apellido');
const inputApenombre = document.getElementById('apenombre');

// Para controlar el CUIT
const inputCuit = document.getElementById('cuit');
inputCuit.addEventListener('blur', controlarCuit);
btnGuardar.addEventListener('click', controlarCuit);

// BORRADO PANTALLA CONFIRMACION MENSAJE ACEPTACION ------------------------------------------
const modalConfirmacion = document.getElementById("modalConfirmacion");
const textoConfirmacion = document.getElementById("textoConfirmacion");
const btnCancelarBorrado = document.getElementById("btnCancelarBorrado");
const btnConfirmarBorrado = document.getElementById("btnConfirmarBorrado");

// Estados iniciales de los botones ----------------------------------------------------------
btnEditar.disabled = false;
btnBorrar.disabled = false;
btnReactivar.disabled = false;

// const audioContext = new AudioContext();

// Variables globales ------------------------------------------------------------------------
let clienteSeleccionado = null;
let modo = "nuevo"; // para saber si es alta o edicion
let idSeleccionado = null;
let indiceFilaActual = -1; // 👈 Agregado por seguridad para el control de teclado


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// TABLA - Carga de la tabla
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// Carga la tabla en el HTML -----------------------------------------------------------------
function renderizarFilas(clientes) {

    const cuerpoTabla = document.querySelector("#tablaClientes tbody");

    if (!cuerpoTabla) return;

    cuerpoTabla.innerHTML = "";
    clienteSeleccionado = null;
    indiceFilaActual = -1;

    const formatearMoneda = (valor) => {
        if (valor === null || valor === undefined || isNaN(valor)) return "$0,00";
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(valor);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "-";
        const [anio, mes, dia] = fecha.substring(0, 10).split("-");
        return `${dia}/${mes}/${anio}`;
    };

    const fragmento = document.createDocumentFragment();

    clientes.forEach(cliente => {

        const fila = document.createElement("tr");

        const fechaIngreso = formatearFecha(cliente.fecha_ingreso);

        fila.innerHTML = `
            <td>${cliente.id}</td>
            <td>${cliente.codigo}</td>
            <td>${cliente.apellido}</td>
            <td>${cliente.nombres}</td>
            <td>${cliente.direccion}</td>
            <td>${cliente.localidad}</td>
            <td>${cliente.provincia}</td>
            <td>${cliente.postal}</td>
            <td>${cliente.telef_pers}</td>
            <td>${cliente.telef_trab}</td>
            <td>${cliente.mail}</td>
            <td>${cliente.sit_fis}</td>
            <td>${cliente.cuit}</td>
            <td>${fechaIngreso}</td>
            <td>${cliente.observaciones}</td>
            <td>${cliente.apenombre}</td>
        `;

        fila.addEventListener("click", function () {

            const todasLasFilas = Array.from(cuerpoTabla.querySelectorAll("tr"));
            indiceFilaActual = todasLasFilas.indexOf(fila);

            const filaAnterior = document.querySelector(".fila-seleccionada");
            if (filaAnterior) {
                filaAnterior.classList.remove("fila-seleccionada");
            }

            fila.classList.add("fila-seleccionada");
            clienteSeleccionado = cliente;

        });

        fragmento.appendChild(fila);

    });

    cuerpoTabla.appendChild(fragmento);
}

// GET Carga los usuarios desde el servidor -------------------------------------------------------------
async function cargarClientes(orden = ordenarPor.value) {

    const estadoSeleccionado = filtrarEstado.value;
    const texto = textoBuscar.value.trim();

    const url = `http://localhost:3000/api/clientes?texto=${encodeURIComponent(texto)}&estado=${estadoSeleccionado}&orden=${orden}`;

    try {

        const response = await fetch(url)

        if (!response.ok) throw new Error("ERROR_SERVIDOR");
        const clientes = await response.json();

        renderizarFilas(clientes);

        if (idSeleccionado) {

            const filas = document.querySelectorAll("#tablaClientes tbody tr");

            filas.forEach(fila => {
                const idFila = parseInt(fila.querySelector("td").textContent);
                if (idFila === idSeleccionado) {
                    document.querySelectorAll("#tablaClientes tbody tr").forEach(f => {
                        f.classList.remove("fila-seleccionada");
                    });
                    fila.classList.add("fila-seleccionada");
                    clienteSeleccionado = clientes.find(u => u.id === idSeleccionado);
                    fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    idSeleccionado = null;
                }
            });
        }

    } catch (error) {

        console.error("Error al cargar:", error);
        renderizarFilas([]);
        mostrarAviso("✕ No se pudo conectar con el servidor.", "error");
    }

};


cargarClientes();


// BUSQUEDA GRID -------------------------------------------------------------------------------------------
document.getElementById("btnBuscar").addEventListener("click", () => { cargarClientes(); });
textoBuscar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        cargarClientes();
    }
});


// Recarga el GRID segun parametros ---------------------------------------------------------------------
function recargarSegunBusqueda() {
    cargarClientes(ordenarPor.value);
    document.activeElement.blur();
}


// ORDEN Y FILTRO DE ESTADO -----------------------------------------------------------------------------
// Escuchan los dos "select" de la barra superior
ordenarPor.addEventListener("change", recargarSegunBusqueda);
filtrarEstado.addEventListener("change", recargarSegunBusqueda);

// MOSTRAR GRID COMPLETO - Boton con el simbolo de recarga ----------------------------------------------
btnMostrarTodos.addEventListener("click", function () {
    textoBuscar.value = "";
    cargarClientes(ordenarPor.value);
});

// TOP y BOTTON de archivo ------------------------------------------------------------------------------
document.getElementById("btnIrArriba").addEventListener("click", () => {
    contenedorTabla.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("btnIrAbajo").addEventListener("click", () => {
    contenedorTabla.scrollTo({ top: contenedorTabla.scrollHeight, behavior: "smooth" });
});



// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// BOTONES CRUD (Nuevo, Editar, Borrar, Reactivar)
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::



// Rellena (o vacía) todos los campos del formulario ---------------------------------------------------------
// Busca en la página todos los elementos que estén dentro del elemento con id vistaFormulario y que tengan 
// el atributo name. Es decir, todos los <input>, <select> y <textarea> con name="algo". Devuelve una lista (NodeList).
function cargarFormulario(datos) {
    document.querySelectorAll("#vistaFormulario [name]").forEach(campo => {
        let valor = datos ? datos[campo.name] : "";
        if (valor === null || valor === undefined) valor = "";
        if (campo.type === "date") valor = String(valor).slice(0, 10);
        campo.value = valor;
    });
}


// BOTON NUEVO ----------------------------------------------------------------------------------------
btnNuevo.addEventListener("click", async function () {

    modo = "nuevo";

    // 1) Limpiar todos los campos
    cargarFormulario(null);

    // Valores iniciales de algunos inputs
    formulario.elements.fecha_ingreso.value = new Date().toLocaleDateString("en-CA");
    formulario.elements.localidad.value = "Villa Carlos Paz";
    formulario.elements.provincia.value = "Cordoba";
    formulario.elements.postal.value = "5152";

    // 2) Mostrar el formulario
    vistaListado.style.display = "none";
    vistaFormulario.style.display = "block";

    // Desactiva la barra superior
    controlesSuperiores.classList.add('desactivada');
    controlesSuperiores.inert = true;

    apellido.focus();
    apellido.select();

    // 3) Traer el próximo código y escribirlo
    try {
        const response = await fetch("http://localhost:3000/api/clientes/proximo-codigo");
        if (!response.ok) throw new Error("ERROR_SERVIDOR");
        const data = await response.json();
        document.getElementById("codigo").value = data.proximo;
    } catch (error) {
        console.error("Error al obtener el código:", error);
    }
});


// BOTON EDITAR --------------------------------------------------------------------------------------
btnEditar.addEventListener("click", function () {

    if (clienteSeleccionado === null) {
        //alert("Seleccione un cliente para editar.");
        mostrarAviso('Seleccioná un cliente para editar', 'alerta');
        return;
    }

    modo = "editar";

    vistaListado.style.display = "none";
    vistaFormulario.style.display = "block";

    // Desactiva la barra superior
    controlesSuperiores.classList.add('desactivada');
    controlesSuperiores.inert = true;

    apellido.focus();
    apellido.select();

    //document.getElementById("tituloFormulario").textContent = "Editar cliente";
    cargarFormulario(clienteSeleccionado);
});


// BOTON BORRAR --------------------------------------------------------------------------------------
btnBorrar.addEventListener("click", function () {

    if (clienteSeleccionado === null) {
        //alert("Seleccione un cliente para borrar.");
        mostrarAviso('Seleccioná un cliente para borrar', 'alerta');
        return;
    }
    textoConfirmacion.textContent =
        `¿Está seguro que desea borrar este cliente ${clienteSeleccionado.apenombre}?`;
    modalConfirmacion.style.display = "flex";
})


// BOTON CONFIRMA BORRADO ----------------------------------------------------------------------------
btnConfirmarBorrado.addEventListener("click", async function () {

    try {

        const response = await fetch(`http://localhost:3000/api/clientes/${clienteSeleccionado.id}`, {
            method: "DELETE"
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error)
        }

        modalConfirmacion.style.display = "none";
        mostrarAviso("✓ Cliente borrado correctamente", "exito");
        await cargarClientes();
        clienteSeleccionado = null;

    } catch (error) {

        console.error("Error al borrar:", error);
        modalConfirmacion.style.display = "none";
        mostrarAviso("✕ " + error.message, "error");
    }

});


// BOTON REACTIVAR -----------------------------------------------------------------------------------
btnReactivar.addEventListener("click", async function () {

    // 1) Verificar si hay un cliente seleccionado
    if (clienteSeleccionado === null) {
        mostrarAviso('Seleccioná un cliente para reactivar', 'alerta');
        return;
    }
    // VALIDACIÓN: Si ya está activo, frenamos acá
    if (clienteSeleccionado.estado === 'activo') {
        mostrarAviso('Este cliente ya se encuentra activo', 'alerta');
        return;
    }

    try {

        const response = await fetch(`http://localhost:3000/api/clientes/${clienteSeleccionado.id}/reactivar`, {
            method: "PUT"
        })

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error)
        }

        mostrarAviso("✓ Cliente reactivado correctamente", "exito");
        idSeleccionado = clienteSeleccionado.id;
        await cargarClientes();

    } catch (error) {

        console.error("Error al reactivar:", error);
        mostrarAviso("✕ " + error.message, "error");

    }
});


// BOTON CANCELAR ----------------------------------------------------------------------------------
btnCancelar.addEventListener("click", function () {

    vistaFormulario.style.display = "none";
    vistaListado.style.display = "block";

    // Desactiva la barra superior
    controlesSuperiores.classList.remove('desactivada');
    controlesSuperiores.inert = false;

    clienteSeleccionado = null;
    btnEditar.disabled = false;
    btnBorrar.disabled = false;
    const filaSeleccionada = document.querySelector(".fila-seleccionada");

    if (filaSeleccionada) {
        filaSeleccionada.classList.remove("fila-seleccionada");
    }
});



// BOTON CANCELAR BARRA MODAL ------------------------------------------------------------------------
btnCancelarBorrado.addEventListener("click", function () {
    modalConfirmacion.style.display = "none";
});


// BOTON SALIR ---------------------------------------------------------------------------------------
btnSalir.addEventListener("click", function () {
    location.href = "/";
});


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// FORMULARIO (Submit) - GUARDADO
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// GUARDAR - Botón guardar del formulario --------------------------------------------------------------
formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    // const datos = Object.fromEntries(new FormData(formulario));: lee todos los campos del formulario 
    // que tengan name y arma un objeto { nombres: "...", apellido: "...", ... }. Es el objeto que 
    // tu JSON.stringify(datos) va a mandar al servidor.
    const datos = Object.fromEntries(new FormData(formulario));

    for (const clave in datos) {
        const campo = formulario.elements[clave];
        if (datos[clave] === "" && (campo.type === "date" || campo.type === "number")) {
            datos[clave] = null;
        }
    }

    const { url, metodo } = modo === "nuevo"
        ? { url: "http://localhost:3000/api/clientes", metodo: "POST" }
        : { url: `http://localhost:3000/api/clientes/${clienteSeleccionado.id}`, metodo: "PUT" };


    try {

        const response = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        })

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        vistaFormulario.style.display = "none";
        vistaListado.style.display = "block";
        // Desactiva la barra superior
        controlesSuperiores.classList.remove('desactivada');
        controlesSuperiores.inert = false;

        if (modo === "nuevo") {

            mostrarAviso("✓ Datos guardados correctamente", "exito");
            idSeleccionado = data.id;


        } else {

            mostrarAviso("✓ Cliente modificado correctamente", "exito");
            idSeleccionado = clienteSeleccionado.id;

        }

        await cargarClientes();

    } catch (error) {

        console.error("Error al guardar el cliente:", error);
        mostrarAviso("✕ " + error.message, "error");

    }

});


// Función para completar apellido y nombre automatico -----------------------------------------------
function actualizarApNombre() {

    const apellido = inputApellido.value.trim();
    const nombre = inputNombre.value.trim();
    inputApenombre.value = [apellido, nombre].filter(Boolean).join(' ');
}
inputNombre.addEventListener('input', actualizarApNombre);
inputApellido.addEventListener('input', actualizarApNombre);


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// Bloque funciones variadas
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// Teclado -------------------------------------------------------------------------------------------
document.addEventListener("keydown", (e) => {

    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT") {
        return;
    }
    const tbody = document.getElementById("cuerpoTablaClientes");
    if (!tbody) return;
    const filas = tbody.querySelectorAll("tr");
    if (filas.length === 0) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        indiceFilaActual = (indiceFilaActual < filas.length - 1) ? indiceFilaActual + 1 : 0;
        filas[indiceFilaActual].click();
        filas[indiceFilaActual].scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        indiceFilaActual = (indiceFilaActual > 0) ? indiceFilaActual - 1 : filas.length - 1;
        filas[indiceFilaActual].click();
        filas[indiceFilaActual].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
});


// VALIDAR CUIT -------------------------------------------------------------------------------------
function validarCuit(valor) {
    const digitos = valor.replace(/\D/g, '');
    if (digitos.length !== 11) return false;

    const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 10; i++) {
        suma += Number(digitos[i]) * pesos[i];
    }

    const resto = suma % 11;
    let verificador = 11 - resto;
    if (verificador === 11) verificador = 0;
    if (verificador === 10) return false;

    return verificador === Number(digitos[10]);
}

function controlarCuit() {

    const inputCuit = document.getElementById('cuit');
    const errorCuit = document.getElementById('errorCuit');
    const valor = inputCuit.value.trim();
    const digitos = valor.replace(/\D/g, '');
    let mensaje = '';

    if (valor !== '') {
        if (digitos.length === 11) {
            if (!validarCuit(valor)) {
                mensaje = 'El CUIT no es válido (dígito verificador incorrecto)';
            }
        } else if (digitos.length < 7 || digitos.length > 8) {
            mensaje = 'Ingresá un DNI (7 u 8 dígitos) o un CUIT (11 dígitos)';
        }
    }

    errorCuit.textContent = mensaje;
    inputCuit.setCustomValidity(mensaje);
}


// BOTON ESTADO DE CUENTA ---------------------------------------------------------------------------
btnEstadoCuenta.addEventListener("click", async function () {

    if (clienteSeleccionado === null) {
        mostrarAviso('Seleccioná un cliente para ver su estado de cuenta', 'alerta');
        return;
    }

    try {
        const respuesta = await fetch(`/api/ctacte/${clienteSeleccionado.id}`);
        if (!respuesta.ok) {
            throw new Error("Error HTTP: " + respuesta.status);
        }
        const datos = await respuesta.json();

        if (datos.movimientos.length === 0) {
            mostrarAviso('El cliente no tiene movimientos', 'alerta');
            return;
        }

        window.location.href = `ctacte_estado_cuenta.html?id=${clienteSeleccionado.id}`;
    } catch (error) {
        console.error("Error al consultar la cuenta corriente:", error);
        mostrarAviso('No se pudo consultar la cuenta corriente', 'error');
    }
});


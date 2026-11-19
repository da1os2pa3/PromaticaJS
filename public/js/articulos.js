// CONTROL DE VISTAS -------------------------------------------------------------------------
const vistaListado = document.getElementById("vistaListado");              // tabla
const vistaFormulario = document.getElementById("vistaFormulario");        // formulario de carga/edición

// Botones sobre la tabla de articulos
const btnNuevo = document.getElementById("btnNuevo");
const btnEditar = document.getElementById("btnEditar");
const btnBorrar = document.getElementById("btnBorrar");
const btnSalir = document.getElementById("btnSalir");
const btnReactivar = document.getElementById("btnReactivar");

// Botones del formulario de carga de articulos
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");

// barra de búsqueda - linea superior
const contenedorTabla = document.querySelector(".tabla-contenedor");
const ordenarPor = document.getElementById("ordenarPor");
const filtrarEstado = document.getElementById("filtrarEstado");
const filtrarArticulos = document.getElementById("filtrarArticulo");
const textoBuscar = document.getElementById("textoBuscar");
const filtrarRubro = document.getElementById("filtrarRubro");
const filtrarMarca = document.getElementById("filtrarMarca");

// formulario
const formulario = document.getElementById("formArticulo");

// barra superior
const controlesSuperiores = document.getElementById('controlesSuperiores');

// mostrar mensaje
const mensaje = document.getElementById("mensaje");

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
let articuloSeleccionado = null;
let modo = "nuevo";               // para saber si es alta o edicion
let idSeleccionado = null;
let indiceFilaActual = -1;        // 👈 Agregado por seguridad para el control de teclado

console.log(ordenarPor)


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// TABLA - Carga de la tabla
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// Carga la tabla en el HTML -----------------------------------------------------------------
function renderizarFilas(articulos) {

    const cuerpoTabla = document.querySelector("#tablaArticulos tbody");

    if (!cuerpoTabla) return;

    cuerpoTabla.innerHTML = "";
    articuloSeleccionado = null;
    indiceFilaActual = -1;

    //La función formatearMoneda recibe un valor y lo devuelve como texto con formato de pesos argentinos.
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

    //Es como un contenedor temporal de nodos HTML. Podés agregarle elementos y, al final, insertar todo junto en el DOM,
    const fragmento = document.createDocumentFragment();

    articulos.forEach(articulo => {

        const fila = document.createElement("tr");

        const fechaUltimaActualizacion = formatearFecha(articulo.ultact);

        fila.innerHTML = `
            <td>${articulo.id}</td>
            <td>${articulo.codigo}</td>
            <td>${articulo.descripcion}</td>
            <td>${articulo.marca}</td>
            <td>${articulo.rubro}</td>
            <td>${articulo.codbar}</td>
            <td>${articulo.costodolar}</td>
            <td>${articulo.iva}</td>
            <td>${articulo.percep}</td>
            <td>${articulo.porcgan}</td>
            <td>${articulo.observa}</td>
            <td>${fechaUltimaActualizacion}</td>
            <td>${articulo.costohist}</td>
            <td>${articulo.imagen}</td>
            <td>${articulo.estado}</td>
        `;

        fila.addEventListener("click", function () {
            const todasLasFilas = Array.from(cuerpoTabla.querySelectorAll("tr"));
            indiceFilaActual = todasLasFilas.indexOf(fila);

            const filaAnterior = document.querySelector(".fila-seleccionada");
            if (filaAnterior) {
                filaAnterior.classList.remove("fila-seleccionada");
            }

            fila.classList.add("fila-seleccionada");
            articuloSeleccionado = articulo;

        });

        fragmento.appendChild(fila);

    });

    cuerpoTabla.appendChild(fragmento);
}

// GET Carga los articulos desde el servidor -------------------------------------------------------------
function cargarArticulos(orden = ordenarPor.value) {

    const estadoSeleccionado = filtrarEstado.value;
    console.log(estadoSeleccionado)

    const url = `http://localhost:3000/api/articulos?estado=${estadoSeleccionado}&orden=${orden}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("ERROR_SERVIDOR");
            return response.json();
        })
        .then(articulos => {

            renderizarFilas(articulos);

            if (idSeleccionado) {

                const filas = document.querySelectorAll("#tablaArticulos tbody tr");

                filas.forEach(fila => {
                    const idFila = parseInt(fila.querySelector("td").textContent);
                    if (idFila === idSeleccionado) {
                        document.querySelectorAll("#tablaArticulos tbody tr").forEach(f => {
                            f.classList.remove("fila-seleccionada");
                        });
                        fila.classList.add("fila-seleccionada");
                        articuloSeleccionado = articulos.find(u => u.id === idSeleccionado);
                        fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        idSeleccionado = null;
                    }
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar:", error);
            renderizarFilas([]);
            mostrarAviso("✕ No se pudo conectar con el servidor.", "error");
            // mensajeExito.textContent = "✕ No se pudo conectar con el servidor.";
            // mensajeExito.style.color = "red";
        });
}

cargarArticulos();
cargarSelectRubros()
cargarSelectMarcas()

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// Bloque que trabaja sobre la barra superior (ordenar, buscar y filtrar)
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// ORDEN GRID ------------------------------------------------------------------------------------------------
// evento que se dispara al cambiar el orden (values="descripcion o rubro+marca+descripcion). 
// Tambien evalua si hay texto de busqueda
ordenarPor.addEventListener("change", function () {
    const orden = ordenarPor.value;
    // esto trae el texto que haya en el input buscar
    const texto = textoBuscar.value.trim();
    if (texto !== "") {
        buscarArticulos();
    } else {
        cargarArticulos(orden);
    }
});

// BUSQUEDA GRID -------------------------------------------------------------------------------------------
// Cuando hago click en la lupa, se llama a la funcion "buscarArticulos" - Funciona con Enter o click en la lupa
document.getElementById("btnBuscar").addEventListener("click", buscarArticulos);
textoBuscar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        buscarArticulos();
    }
});

// BUSQUEDA GRID --------------------------------------------------------------------------------------------
// Busca articulos en el GRID y los filtra
function buscarArticulos() {

    const texto = textoBuscar.value.trim();

    // guarda string "descripcion" o "codigo"
    const orden = ordenarPor.value;
    //const incluirInactivos = filtrarEstado.value === "todos";

    const url = `http://localhost:3000/api/articulos?texto=${encodeURIComponent(texto)}&estado=${filtrarEstado.value}&orden=${orden}&filtro_rubro=${filtrarRubro.value}&filtro_marca=${filtrarMarca.value}`;

    fetch(url)

        .then(response => {
            if (response.status === 403) {
                throw new Error("SIN_PERMISO");
            }
            if (!response.ok) {
                throw new Error("ERROR_SERVIDOR");
            }
            return response.json();
        })
        .then(articulos => {
            renderizarFilas(articulos);
        })
        .catch(error => {
            console.error("Error al buscar el articulo:", error);

            renderizarFilas([]);

            if (error.message === "SIN_PERMISO") {
                mostrarAviso("✕ No tenés acceso a este módulo.", "error");
            } else {
                mostrarAviso("✕ No se pudo conectar con el servidor.", "error");
            }
        });
}

// Recarga el GRID segun parametros ---------------------------------------------------------------------
function recargarSegunBusqueda() {
    const texto = document.getElementById("textoBuscar").value.trim();
    if (texto !== "") {
        buscarArticulos();
    } else {
        cargarArticulos(ordenarPor.value);
    }
    document.activeElement.blur();
}

// ORDEN Y FILTRO DE ESTADO -----------------------------------------------------------------------------
// Escuchan los dos "select" de la barra superior
ordenarPor.addEventListener("change", recargarSegunBusqueda);
filtrarEstado.addEventListener("change", recargarSegunBusqueda);

// MOSTRAR GRID COMPLETO - Boton con el simbolo de recarga
btnMostrarTodos.addEventListener("click", function () {
    textoBuscar.value = "";
    filtrarRubro.value = "todos";
    filtrarMarca.value = "todos";
    cargarArticulos(ordenarPor.value);
});


// TOP y BOTTON de archivo ------------------------------------------------------------------------------
document.getElementById("btnIrArriba").addEventListener("click", () => {
    contenedorTabla.scrollTo({ top: 0, behavior: "smooth" });
});
document.getElementById("btnIrAbajo").addEventListener("click", () => {
    contenedorTabla.scrollTo({ top: contenedorTabla.scrollHeight, behavior: "smooth" });
});


// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// CARGA DE LOS SELECTS - marcas y rubros
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// Cargar el select de rubros ---------------------------------------------------------------------------
async function cargarSelectRubros() {
    const url = '/api/rubros';
    const response = await fetch(url);
    const rubros = await response.json();

    rubros.forEach(d => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.nombre;
        filtrarRubro.appendChild(option);
    });
}

// Cargar el select de las marcas ------------------------------------------------------------------------
async function cargarSelectMarcas() {
    const url = '/api/marcas';
    const response = await fetch(url);
    const marcas = await response.json();

    marcas.forEach(d => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.nombre;
        filtrarMarca.appendChild(option);
    });
}


// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// BOTONES CRUD (Nuevo, Editar, Borrar, Reactivar, Salir......)
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// BOTON SALIR ------------------------------------------------------------------------------------------
btnSalir.addEventListener("click", function () {
    location.href = "/";
});

// ------------------------------------------------------------------------------------------------------
// Rellena (o vacía) todos los campos del formulario. Busca en la página todos los elementos que estén 
// dentro del id vistaFormulario y que tengan el atributo name. Es decir, todos los <input>, <select> 
// y <textarea> con name="algo". Devuelve una lista (NodeList).

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
    formulario.elements.ultact.value = new Date().toLocaleDateString("en-CA");
    // formulario.elements.localidad.value = "Villa Carlos Paz";
    // formulario.elements.provincia.value = "Cordoba";
    // formulario.elements.postal.value = "5152";

    // 2) Mostrar el formulario
    vistaListado.style.display = "none";
    vistaFormulario.style.display = "block";

    // Desactiva la barra superior
    controlesSuperiores.classList.add('desactivada');
    controlesSuperiores.inert = true;

    descripcion.focus();
    descripcion.select();

});


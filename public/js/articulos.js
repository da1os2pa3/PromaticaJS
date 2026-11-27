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
let datosGenerales = null;
selectMarcForm = document.getElementById("marca")
selectRubForm = document.getElementById("rubro")

// formulario
const formulario = document.getElementById("formArticulo");

// barra superior
const controlesSuperiores = document.getElementById('controlesSuperiores');

// mostrar mensaje
const mensaje = document.getElementById("mensaje");

// Borrado - pantalla confirmacion - mensaje aceptacion --------------------------------------
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




// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// BLOQUE DE CALCULO DE PRECIOS 
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// -------------------------------------------------------------------------------------------
// Busca parametros en informa - En este caso trae solo las tasas de IVA para cargar el SELECT
// -------------------------------------------------------------------------------------------
async function cargarGenerales() {

    const url = '/api/articulos/generales';

    try {

        const response = await fetch(url);
        // Datos de informa; los asigna solo cargarGenerales
        datosGenerales = await response.json();

        const ivas = [datosGenerales.iva1, datosGenerales.iva2, datosGenerales.iva3]

        // Asigna el texto de cada objeto a cada <select>
        const tasaIva = document.getElementById("tasa-iva");
        tasaIva.innerHTML = "";

        // carga el SELECT en HTML
        ivas.forEach(d => {
            const option = document.createElement("option");
            option.value = d;
            option.textContent = `${d}%`;
            tasaIva.appendChild(option);
        });

        tasaIva.value = datosGenerales.iva1;

    } catch (error) {
        console.error("Error al cargar los generales:", error);
    }

}


// -------------------------------------------------------------------------------------------
// funcion que carga los precios del articulo seleccionado. Es llamada por EDITAR articulo
// -------------------------------------------------------------------------------------------
async function cargarPrecios(id) {

    const url = `/api/articulos/${id}/precios`;

    try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("ERROR_SERVIDOR");

        const precios = await response.json();
        console.log("precios " + precios)

        mostrarPrecios(precios);

    } catch (error) {

        console.error("Error al cargar precios:", error);
    }
}


// -------------------------------------------------------------------------------------------
// funcion que recalcula los precios segun los valores ingresados en el formulario ------------
// -------------------------------------------------------------------------------------------
async function recalcularPrecios(precioLista = null) {

    // Obtengo c/campo con .value: costo-dolar, tasa-iva, tasa-percepcion y tasa-ganancia (esos son los id del HTML).
    // la funcion leernumero, maneja los puntos y las comas
    const costodolar = leerNumero(document.getElementById("costo-dolar").value);
    const iva = leerNumero(document.getElementById("tasa-iva").value);
    const percep = leerNumero(document.getElementById("tasa-percepcion").value);
    const porcgan = leerNumero(document.getElementById("tasa-ganancia").value);

    const url = "/api/articulos/calcular-precios";

    try {

        // armar un objeto datos con los valores obtenidos
        const datos = {
            costodolar,
            iva,
            percep,
            porcgan,
            precioLista
        }

        console.log("costo:", document.getElementById("costo-dolar").value);
        console.log("iva:", document.getElementById("tasa-iva").value);

        // mando la url a la ruta del backend y los valores de los campos para calcular los precios
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        })

        // transformo la respuesta en objeto javascript
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        mostrarPrecios(data);

    } catch (error) {
        mostrarAviso("✕ " + error.message, "error")
    }

}


// ----------------------------------------------------------------------------------------------
// Mostrar los precios calculados en el formulario
// ----------------------------------------------------------------------------------------------
function mostrarPrecios(data) {

    //console.log("mostrando data en mostrarprecios" + data)

    formulario.elements["calc_costo_neto_pesos"].value = formatearNumero(data.netoPesos);
    formulario.elements["calc_importe_iva_pesos"].value = formatearNumero(data.importeIva);
    formulario.elements["calc_importe_percepcion_pesos"].value = formatearNumero(data.importePercep);
    formulario.elements["calc_importe_ganancia_pesos"].value = formatearNumero(data.importeGanancia);
    formulario.elements["calc_precio_venta_pesos"].value = formatearNumero(data.precioLista);
    formulario.elements["calc_precio_venta_recargo_pesos"].value = formatearNumero(data.precioFinal);
    formulario.elements["calc_costo_bruto_pesos"].value = formatearNumero(data.bruto);
    formulario.elements["cotizacion-dolar"].value = formatearNumero(data.dolarhoy);
    document.getElementById("tasa-ganancia").value = formatearNumero(data.porcgan);

}


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// FIN BLOQUE DE CALCULO DE PRECIOS 
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::




// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// BLOQUE IMAGEN ARTICULO
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// ----------------------------------------------------------------------------------------------
// Muestra la imagen en el formulario
// ----------------------------------------------------------------------------------------------
function mostrarImagen(imagenUrl) {

    const imagen = document.getElementById("imagen-vista");
    const icono = document.querySelector(".imagen-marco .material-symbols-outlined");

    if (imagenUrl) {
        imagen.src = imagenUrl;
        imagen.hidden = false;
        icono.style.display = "none";
    } else {
        imagen.removeAttribute("src");
        imagen.hidden = true;
        icono.style.display = "";
    }
}

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// FIN BLOQUE IMAGEN ARTICULO
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::



// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// BLOQUE TABLA
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// -------------------------------------------------------------------------------------------
// Carga la tabla en el HTML -----------------------------------------------------------------
// -------------------------------------------------------------------------------------------
function renderizarFilas(articulos) {

    const cuerpoTabla = document.querySelector("#tablaArticulos tbody");

    if (!cuerpoTabla) return;

    cuerpoTabla.innerHTML = "";
    articuloSeleccionado = null;
    indiceFilaActual = -1;

    // La función formatearMoneda recibe un valor y lo devuelve como texto con formato de pesos argentinos.
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

    // Es como un contenedor temporal de nodos HTML. Podés agregarle elementos y, al final, insertar todo junto en el DOM,
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
            <td>${formatearNumero(articulo.costodolar)}</td>
            <td>${formatearNumero(articulo.iva)}</td>
            <td>${formatearNumero(articulo.percep)}</td>
            <td>${formatearNumero(articulo.porcgan)}</td>
            <td>${articulo.observa}</td>
            <td>${fechaUltimaActualizacion}</td>
            <td>${formatearNumero(articulo.costohist)}</td>
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


// -------------------------------------------------------------------------------------------
// GET Carga los articulos desde el servidor -------------------------------------------------
// -------------------------------------------------------------------------------------------
async function cargarArticulos(orden = ordenarPor.value) {

    const estadoSeleccionado = filtrarEstado.value;
    const texto = textoBuscar.value.trim();

    const url = `http://localhost:3000/api/articulos?texto=${encodeURIComponent(texto)}&estado=${filtrarEstado.value}&orden=${orden}&filtro_rubro=${filtrarRubro.value}&filtro_marca=${filtrarMarca.value}`;

    try {

        const response = await fetch(url);

        if (!response.ok) throw new Error("ERROR_SERVIDOR");
        const articulos = await response.json();
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

    } catch (error) {

        console.error("Error al cargar:", error);
        renderizarFilas([]);
        mostrarAviso("✕ No se pudo conectar con el servidor.", "error");
    }

};

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// FIN BLOQUE TABLA
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// -------------------------------------------------------------------------------------------
// INICIO DE LA APLICACIÓN -------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
async function iniciar() {

    cargarArticulos();

    await cargarSelect('/api/marcas', filtrarMarca);
    await cargarSelect('/api/rubros', filtrarRubro);
    await cargarSelect('/api/marcas', selectMarcForm);
    await cargarSelect('/api/rubros', selectRubForm);

    await cargarGenerales();

    // tratamiento de la imagen del articulo
    const btnSeleccionarImagen = document.getElementById("btnSeleccionarImagen");
    const archivoImagen = document.getElementById("archivo-imagen");

    btnSeleccionarImagen.addEventListener("click", () => archivoImagen.click());

    archivoImagen.addEventListener("change", () => {
        const archivo = archivoImagen.files[0];
        if (!archivo) return;

        document.getElementById("ruta-imagen").value = archivo.name;
        mostrarImagen(`/img/${encodeURIComponent(archivo.name)}`);
        archivoImagen.value = "";
    });

    // ampliacion imagen del articulo
    const imagenVista = document.getElementById("imagen-vista");
    const dialogoImagen = document.getElementById("dialogoImagen");
    const imagenAmpliada = document.getElementById("imagen-ampliada");

    imagenVista.addEventListener("click", () => {
        imagenAmpliada.src = imagenVista.src;
        dialogoImagen.showModal();
    });

    dialogoImagen.addEventListener("click", () => dialogoImagen.close());

}


iniciar();


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// BLOQUE TRATAMIENTO BARRA SUPERIOR (ORDENAR-BUSCAR-FILTRAR....)
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// -------------------------------------------------------------------------------------------
// BUSQUEDA GRID -----------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
document.getElementById("btnBuscar").addEventListener("click", () => { cargarArticulos(); });
textoBuscar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        cargarArticulos();
    }
});


// -------------------------------------------------------------------------------------------
// Recarga el GRID segun parametros ----------------------------------------------------------
// -------------------------------------------------------------------------------------------
function recargarSegunBusqueda() {
    cargarArticulos(ordenarPor.value);
    document.activeElement.blur();
}


// -------------------------------------------------------------------------------------------
// ORDEN Y FILTRO DE ESTADO ------------------------------------------------------------------
// Escuchan los dos "select" de la barra superior
// -------------------------------------------------------------------------------------------

ordenarPor.addEventListener("change", recargarSegunBusqueda);
filtrarEstado.addEventListener("change", recargarSegunBusqueda);


// -------------------------------------------------------------------------------------------
// MOSTRAR GRID COMPLETO - Boton con el simbolo de recarga -----------------------------------
// -------------------------------------------------------------------------------------------
btnMostrarTodos.addEventListener("click", function () {
    textoBuscar.value = "";
    filtrarRubro.value = "todos";
    filtrarMarca.value = "todos";
    cargarArticulos(ordenarPor.value);
});


// -------------------------------------------------------------------------------------------
// TOP y BOTTON de archivo -------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
document.getElementById("btnIrArriba").addEventListener("click", () => {
    contenedorTabla.scrollTo({ top: 0, behavior: "smooth" });
});
document.getElementById("btnIrAbajo").addEventListener("click", () => {
    contenedorTabla.scrollTo({ top: contenedorTabla.scrollHeight, behavior: "smooth" });
});


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// FIN BLOQUE TRATAMIENTO BARRA SUPERIOR (ORDENAR-BUSCAR-FILTRAR....)
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::



// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// BLOQUE CARGA DE LOS SELECTS - marcas y rubros
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// -------------------------------------------------------------------------------------------
// Cargar el select de rubros ----------------------------------------------------------------
// -------------------------------------------------------------------------------------------
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


// -------------------------------------------------------------------------------------------
// Cargar los selext de marcas y rubros (generico) -------------------------------------------
// -------------------------------------------------------------------------------------------
async function cargarSelect(url, select) {
    const response = await fetch(url);
    const datos = await response.json();

    datos.forEach(d => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.nombre;
        select.appendChild(option);
    });
}


// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// FIN BLOQUE CARGA DE LOS SELECTS - marcas y rubros
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::



// -------------------------------------------------------------------------------------------
// Rellena (o vacía) todos los campos del formulario. Busca en la página todos los elementos que estén 
// dentro del id vistaFormulario y que tengan el atributo name. Es decir, todos los <input>, <select> 
// y <textarea> con name="algo". Devuelve una lista (NodeList).
// -------------------------------------------------------------------------------------------
function cargarFormulario(datos) {
    document.querySelectorAll("#vistaFormulario [name]").forEach(campo => {
        let valor = datos ? datos[campo.name] : "";
        if (valor === null || valor === undefined) valor = "";
        if (campo.type === "date") valor = String(valor).slice(0, 10);
        campo.value = valor;
    });
    mostrarImagen(datos ? datos.imagenUrl : null);
}


// -------------------------------------------------------------------------------------------
// Escuchar los cambios en los campos del formulario -----------------------------------------
// -------------------------------------------------------------------------------------------
document.getElementById("costo-dolar").addEventListener("change", () => recalcularPrecios());
document.getElementById("tasa-iva").addEventListener("change", () => recalcularPrecios());
document.getElementById("tasa-ganancia").addEventListener("change", () => recalcularPrecios());

document.getElementById("precio_venta_lista_pesos").addEventListener("change", () => {
    // const valor = Number(document.getElementById("precio_venta_lista_pesos").value.replace(",", "."));
    const valor = leerNumero(document.getElementById("precio_venta_lista_pesos").value);
    if (!Number.isFinite(valor) || valor <= 0) return;
    recalcularPrecios(valor);
});




// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// BLOQUE BOTONES DE LA TABLA (Nuevo, Editar, Borrar, Reactivar, Salir......)
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// -------------------------------------------------------------------------------------------
// BOTON SALIR -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
btnSalir.addEventListener("click", function () {
    location.href = "/";
});


// -------------------------------------------------------------------------------------------
// BOTON NUEVO -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
btnNuevo.addEventListener("click", async function () {

    modo = "nuevo";

    // 1) Limpiar todos los campos
    cargarFormulario(null);

    // Valores iniciales de algunos inputs
    formulario.elements.ultact.value = new Date().toLocaleDateString("en-CA");
    document.getElementById("tasa-iva").value = datosGenerales.iva1;
    document.getElementById("tasa-percepcion").value = datosGenerales.percep;

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



// -------------------------------------------------------------------------------------------
// Boton EDITAR ------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
btnEditar.addEventListener("click", async function () {

    if (articuloSeleccionado === null) {
        mostrarAviso('Seleccioná un artículo para editar', 'alerta');
        return;
    }

    modo = "editar";

    vistaListado.style.display = "none";
    vistaFormulario.style.display = "block";

    // Desactiva la barra superior
    controlesSuperiores.classList.add('desactivada');
    controlesSuperiores.inert = true;

    descripcion.focus();
    descripcion.select();

    cargarFormulario(articuloSeleccionado);
    await cargarPrecios(articuloSeleccionado.id);

});


// -------------------------------------------------------------------------------------------
// Boton BORRAR ------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
btnBorrar.addEventListener("click", function () {

    console.log('entro al boton borrar')

    if (articuloSeleccionado === null) {
        mostrarAviso('Seleccioná un articulo para borrar', 'alerta');
        return;
    }
    textoConfirmacion.textContent =
        `¿Está seguro que desea desactivar este articulo ${articuloSeleccionado.descripcion}?`;
    modalConfirmacion.style.display = "flex";

})


// BOTON CONFIRMA BORRADO ----------------------------------------------------------------------------
btnConfirmarBorrado.addEventListener("click", async function () {

    try {

        const response = await fetch(`http://localhost:3000/api/articulos/${articuloSeleccionado.id}`, {
            method: "DELETE"
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error)
        }

        modalConfirmacion.style.display = "none";
        mostrarAviso("✓ Articulo borrado correctamente", "exito");
        await cargarArticulos();
        articuloSeleccionado = null;

    } catch (error) {

        console.error("Error al borrar:", error);
        modalConfirmacion.style.display = "none";
        mostrarAviso("✕ " + error.message, "error");
    }

});


// BOTON REACTIVAR -----------------------------------------------------------------------------------
btnReactivar.addEventListener("click", async function () {

    // 1) Verificar si hay un articulo seleccionado
    if (articuloSeleccionado === null) {
        mostrarAviso('Seleccioná un articulo para reactivar', 'alerta');
        return;
    }
    // VALIDACIÓN: Si ya está activo, frenamos acá
    if (articuloSeleccionado.estado === 'activo') {
        mostrarAviso('Este articulo ya se encuentra activo', 'alerta');
        return;
    }

    try {

        const response = await fetch(`http://localhost:3000/api/articulos/${articuloSeleccionado.id}/reactivar`, {
            method: "PUT"
        })

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error)
        }

        mostrarAviso("✓ Articulo reactivado correctamente", "exito");
        idSeleccionado = articuloSeleccionado.id;
        await cargarArticulos();

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

    articuloSeleccionado = null;
    btnEditar.disabled = false;
    btnBorrar.disabled = false;
    const filaSeleccionada = document.querySelector(".fila-seleccionada");

    if (filaSeleccionada) {
        filaSeleccionada.classList.remove("fila-seleccionada");
    }
});


// Boton cancelar barra modal ----------------------------------------------------------------
btnCancelarBorrado.addEventListener("click", function () {
    modalConfirmacion.style.display = "none";
});


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// FIN BLOQUE BOTONES DE LA TABLA (Nuevo, Editar, Borrar, Reactivar, Salir......)
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::




// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// BLOQUE BOTONES DEL FORMULARIO
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// -------------------------------------------------------------------------------------------
// GUARDAR - Botón guardar del formulario ----------------------------------------------------
// -------------------------------------------------------------------------------------------
formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    // const datos = Object.fromEntries(new FormData(formulario));: lee todos los campos del formulario 
    // que tengan name y arma un objeto { nombres: "...", apellido: "...", ... }. Es el objeto que 
    // tu JSON.stringify(datos) va a mandar al servidor.
    const datos = Object.fromEntries(new FormData(formulario));

    // Convertir todos los campos vacíos de tipo date o number a null
    for (const clave in datos) {
        const campo = formulario.elements[clave];
        if (datos[clave] === "" && (campo.type === "date" || campo.type === "number")) {
            datos[clave] = null;
        }
    }

    // Nombres (atributo name del HTML) de los campos que son números
    const camposNumericos = [
        "costodolar",
        "iva",
        "percep",
        "porcgan",
        "calc_costo_neto_pesos",
        "calc_costo_bruto_pesos",
        "calc_importe_iva_pesos",
        "calc_importe_percepcion_pesos",
        "calc_importe_ganancia_pesos",
        "calc_precio_venta_pesos",
        "calc_precio_venta_recargo_pesos"
    ];

    for (const clave in datos) {
        if (camposNumericos.includes(clave)) {
            datos[clave] = datos[clave] === "" ? null : leerNumero(datos[clave]);
        }

    }

    const { url, metodo } = modo === "nuevo"
        ? { url: "http://localhost:3000/api/articulos", metodo: "POST" }
        : { url: `http://localhost:3000/api/articulos/${articuloSeleccionado.id}`, metodo: "PUT" };


    try {


        console.log(datos);


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

            mostrarAviso("✓ Articulo modificado correctamente", "exito");
            idSeleccionado = articuloSeleccionado.id;

        }

        await cargarArticulos();

    } catch (error) {

        console.error("Error al guardar el articulo:", error);
        mostrarAviso("✕ " + error.message, "error");

    }

});


// -------------------------------------------------------------------------------------------
// BOTON VOLVER - Volver del formulario A la tabla -------------------------------------------
// -------------------------------------------------------------------------------------------
btnCancelar.addEventListener("click", function () {

    vistaFormulario.style.display = "none";
    vistaListado.style.display = "block";

    // Desactiva la barra superior
    controlesSuperiores.classList.remove('desactivada');
    controlesSuperiores.inert = false;

    articuloSeleccionado = null;
    btnEditar.disabled = false;
    btnBorrar.disabled = false;
    const filaSeleccionada = document.querySelector(".fila-seleccionada");

    if (filaSeleccionada) {
        filaSeleccionada.classList.remove("fila-seleccionada");
    }
});

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// FIN BLOQUE BOTONES DEL FORMULARIO
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


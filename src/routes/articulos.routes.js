const express = require("express");
const router = express.Router();
const db = require("../config/db");
const query = (sql, parametros) => db.promise().query(sql, parametros).then(([filas]) => filas);



// ============================================================================
// FUNCIONES PRECIOS -  para calcular los precios de los articulos
// ============================================================================

// Esta funcion manda todos los valores de informa para uso global del sistema (parametrizables)
async function obtenerGenerales() {

    const filas = await query(
        `SELECT 
            id,
            i_iva1, 
            i_iva2, 
            i_iva3, 
            i_reten, 
            i_percep, 
            i_dolar1, 
            i_cargo1_tarj, 
            i_cargo2_tarj, 
            i_cargo3_tarj, 
            i_ruta_fotos 
        FROM informa`
    );

    if (filas.length === 0) {
        throw new Error("Tabla informa vacía");
    }

    const fila = filas[0];

    return {
        id: fila.id,
        iva1: Number(fila.i_iva1),
        iva2: Number(fila.i_iva2),
        iva3: Number(fila.i_iva3),
        reten: Number(fila.i_reten),
        percep: Number(fila.i_percep),
        dolarhoy: Number(fila.i_dolar1),
        cargo1: Number(fila.i_cargo1_tarj),
        cargo2: Number(fila.i_cargo2_tarj),
        cargo3: Number(fila.i_cargo3_tarj),
        rutaImagen: fila.i_ruta_fotos
    };
}



// -----------------------------------------------------------------------------
// Funcion para calcular los precios de los articulos
// Parametros: - articulo: objeto que contiene los datos del articulo
//             - generales: objeto que contiene los datos generales
//             - precioListaManual: precio de lista manual (opcional)
function calcularPrecios(articulo, generales, precioListaManual = null) {

    // Esta funcion calcula el precio de lista y el precio final de un articulo
    const netoPesos = redondear(Number(articulo.costodolar) * generales.dolarhoy);
    const importeIva = redondear(netoPesos * (Number(articulo.iva) / 100));
    const importePercep = redondear(netoPesos * (Number(articulo.percep) / 100));
    const bruto = redondear(netoPesos + importeIva + importePercep);

    let porcgan = Number(articulo.porcgan);

    if (precioListaManual !== null && bruto > 0) {
        porcgan = redondear(((precioListaManual / bruto) - 1) * 100);
        // si % ganancia es menor que 0 igualo precio venta costo y % se one en cero
        if (porcgan < 0) {
            porcgan = 0;
        }
    }

    const importeGanancia = redondear(bruto * (porcgan / 100));
    const precioLista = redondear(bruto + importeGanancia);

    let recargo = 0;

    if (Number(generales.cargo1) > 0) {
        recargo += redondear(precioLista * (Number(generales.cargo1) / 100));
    };
    if (Number(generales.cargo2) > 0) {
        recargo += redondear(precioLista * (Number(generales.cargo2) / 100));
    };
    if (Number(generales.cargo3) > 0) {
        recargo += redondear(precioLista * (Number(generales.cargo3) / 100));
    };

    recargo = redondear(recargo)
    const precioFinal = redondear(precioLista + recargo);
    return { netoPesos, importeIva, importePercep, bruto, importeGanancia, precioLista, precioFinal, recargo, porcgan, dolarhoy: generales.dolarhoy };
}


function redondear(valor) {
    return Math.round(valor * 100) / 100;
}



// ============================================================================
// ROUTERS DE CONSULTAS Y CALCULOS DE PRECIOS
// ============================================================================
// Consulta a la funcion obtenerGenerales y obtiene los parametros que necesita 
// ============================================================================
router.get("/generales", async (req, res) => {

    try {

        const generales = await obtenerGenerales();
        res.json(generales);

    } catch (error) {

        console.error("Error al obtener los ivas:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }

});


router.get("/codbar/:codbar", async (req, res) => {

    //Leer el código de req.params.codbar.
    const codbar = req.params.codbar.trim();

    try {

        //Buscar en la tabla articulos la fila con ese codbar
        const filasArticulo = await query("SELECT * FROM articulos WHERE codbar = ?", [codbar]);

        if (filasArticulo.length === 0) {
            return res.status(404).json({ error: "Artículo no encontrado" });
        }

        // Leo la primera fila de la tabla articulos
        const articulo = filasArticulo[0];
        // Obtengo los datos de la tabla informa
        const generales = await obtenerGenerales();

        res.json(articulo, calcularPrecios(articulo, generales));

    } catch (error) {
        console.error("Error en busqueda de precios por codbar:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }

});














// ------------------------------------------------------------------------------------------
// Qué hace tu ruta /:id/precios:
// Primera consulta: busca el artículo.
// Segunda consulta: trae de la funcion obtenerGenerales los parametros de informa.
// Con los dos resultados, calcularPrecios calcula los importes.
// Una sola respuesta: res.json(calcularPrecios(...))
// ------------------------------------------------------------------------------------------
router.get("/:id/precios", async (req, res) => {

    try {

        const filasArticulo = await query("SELECT costodolar, iva, percep, porcgan FROM articulos WHERE id = ?", [req.params.id]);

        if (filasArticulo.length === 0) {
            return res.status(404).json({ error: "Artículo no encontrado" });
        }

        const articulo = filasArticulo[0];
        const generales = await obtenerGenerales();

        res.json(calcularPrecios(articulo, generales));

    } catch (error) {

        console.error("Error al calcular precios:", error);
        res.status(500).json({ error: "Error interno del servidor" });

    }
});



// ---------------------------------------------------------------------------------------
// Calcula los precios con los datos enviados desde el formulario 
// ---------------------------------------------------------------------------------------
router.post("/calcular-precios", async (req, res) => {

    try {

        const costodolar = Number(req.body.costodolar);
        const iva = Number(req.body.iva);
        const percep = Number(req.body.percep);
        const porcgan = Number(req.body.porcgan);
        const precioListaManual = req.body.precioLista == null
            ? null
            : Number(req.body.precioLista);

        // Validaciones
        if (req.body.iva === null || req.body.iva === undefined || req.body.iva === "") {
            return res.status(400).json({ error: "La alícuota de IVA es obligatoria" });
        }
        if (!Number.isFinite(costodolar) || costodolar <= 0) {
            return res.status(400).json({ error: "Costo del dolar invalido" });
        }
        if (!Number.isFinite(iva) || iva < 0) {
            return res.status(400).json({ error: "Alicuota IVA invalido" });
        }
        if (!Number.isFinite(percep) || percep < 0) {
            return res.status(400).json({ error: "Alicuota percepcion invalida" });
        }
        if (!Number.isFinite(porcgan) || porcgan < 0) {
            return res.status(400).json({ error: "Tasa de ganancia invalida" });
        }
        if (precioListaManual !== null && (!Number.isFinite(precioListaManual) || precioListaManual <= 0)) {
            return res.status(400).json({ error: "Precio de lista manual invalido" });
        }

        const generales = await obtenerGenerales();

        const datos = {
            costodolar,
            iva,
            percep,
            porcgan
        };

        res.json(calcularPrecios(datos, generales, precioListaManual));

    } catch (error) {

        console.error("Error al calcular precios:", error);
        res.status(500).json({ error: "Error interno del servidor" });

    }
});



// ==========================================================================================
// ROUTERS CRUD 
// ==========================================================================================


// ============================================================================
// GET - Listar articulos
// ============================================================================
router.get("/", async (req, res) => {

    const texto = (req.query.texto || "").trim();
    const estadoFiltro = req.query.estado || "activo";
    const filtro_marca = req.query.filtro_marca || "todos";
    const filtro_rubro = req.query.filtro_rubro || "todos";

    const ordenesPermitidos = {
        descripcion: "c.descripcion ASC",
        rubro_marca_descripcion: "r.ru_nombre ASC, m.ma_nombre ASC, c.descripcion ASC",
    };

    // toma el orden que viene en la URL "query.orden", si viene en blanco va con "descripcion"
    const orden = ordenesPermitidos[req.query.orden] || "c.descripcion ASC";

    const condiciones = [];
    const parametros = [];

    // Agregamos el parametros de busqueda en las condiciones y en que camppos de la tabla
    if (texto !== "") {
        condiciones.push("(c.descripcion LIKE ? OR c.codigo LIKE ? OR c.codbar LIKE ?)");
        parametros.push(`%${texto}%`, `%${texto}%`, `%${texto}%`);
    }

    // Fitramos la condicion fija de marca o rubro si es que existe (# de "todos")
    if (filtro_marca !== "todos") {
        condiciones.push("c.marca_id = ?");
        parametros.push(filtro_marca);
    }

    if (filtro_rubro !== "todos") {
        condiciones.push("c.rubro_id = ?");
        parametros.push(filtro_rubro);
    }

    // Agregamos el parametros de estado en las condiciones para filtrar
    if (estadoFiltro === "activo") {
        condiciones.push("c.estado = 'activo'");
    } else if (estadoFiltro === "inactivo") {
        condiciones.push("c.estado = 'inactivo'");
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

    const sql = `
        SELECT 
            c.id, 
            c.codigo, 
            c.descripcion, 
            m.ma_nombre AS marca,
            r.ru_nombre AS rubro,     
            c.marca_id, 
            c.rubro_id, 
            c.codbar, 
            c.costodolar,
            c.iva,
            c.percep,
            c.porcgan,
            c.observa,
            c.ultact, 
            c.costohist, 
            c.imagen,
            c.estado
        FROM articulos c
        LEFT JOIN marcas m ON m.id = c.marca_id LEFT JOIN rubros r ON r.id = c.rubro_id
        ${where} 
        ORDER BY ${orden}
        `;

    try {

        const resultados = await query(sql, parametros);

        const articulos_conversion = resultados.map(fila => ({
            ...fila,
            iva: fila.iva === null ? null : Number(fila.iva),
            imagenUrl: fila.imagen ? `/img/${encodeURIComponent(fila.imagen)}` : null
        }));

        res.json(articulos_conversion);

    } catch (error) {
        console.error("Error al obtener registros:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});



// ============================================================================
// POST - Genera el nuevo registro en la tabla articulos
// ============================================================================
router.post("/", async (req, res) => {

    const codigo = (req.body.codigo || "").trim();
    const descripcion = (req.body.descripcion || "").trim();
    const codbar = (req.body.codbar || "").trim();
    const costodolar = Number(req.body.costodolar) || 0;
    const iva = Number(req.body.iva) || 0;
    const percep = Number(req.body.percep) || 0;
    const porcgan = Number(req.body.porcgan) || 0;
    const observa = (req.body.observa || "");
    const ultact = new Date();
    const costohist = costodolar;
    const imagen = (req.body.imagen || "");
    const estado = "activo";
    const marca_id = Number(req.body.marca_id) || 0;
    const rubro_id = Number(req.body.rubro_id) || 0;

    const datos = {
        codigo,
        descripcion,
        codbar,
        costodolar,
        iva,
        percep,
        porcgan,
        observa,
        ultact,
        costohist,
        imagen,
        estado,
        marca_id,
        rubro_id
    };

    if (req.body.iva === null || req.body.iva === undefined || req.body.iva === "") {
        return res.status(400).json({ error: "La alícuota de IVA es obligatoria" });
    }
    // Validaciones
    if (codigo === "") {
        return res.status(400).json({ error: "El código no puede estar vacío" });
    }
    if (descripcion === "") {
        return res.status(400).json({ error: "La descripción no puede estar vacía" });
    }
    if (codbar === "") {
        return res.status(400).json({ error: "El codigo de barras no puede estar vacío" });
    }
    if (costodolar <= 0) {
        return res.status(400).json({ error: "El costo debe ser mayor a cero" });
    }

    if (!Number.isFinite(iva) || iva < 0) {
        return res.status(400).json({ error: "Alícuota de IVA inválida" });
    }

    if (porcgan <= 0) {
        return res.status(400).json({ error: "El porcentaje de ganancia debe ser mayor a cero" });
    }
    if (marca_id <= 0) {
        return res.status(400).json({ error: "Debe seleccionar una marca" });
    }
    if (rubro_id <= 0) {
        return res.status(400).json({ error: "Debe seleccionar un rubro" });
    }

    try {

        // Comprueba si existe un registro con el mismo codigo de barras
        const existentes = await query("SELECT id FROM articulos WHERE codbar = ?", [codbar]);
        if (existentes.length > 0) {
            return res.status(409).json({ error: "Ya existe un artículo con ese código de barras" });
        }
        // Inserta los datos en la tabla articulos
        const resultado = await query("INSERT INTO articulos SET ?", [datos]);
        res.json({ id: resultado.insertId });

    } catch (error) {
        console.error("Error al guardar los datos del articulo:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }

});



// ============================================================================
// PUT - Actualiza un articulo
// ============================================================================
router.put("/:id", async (req, res) => {

    const id = req.params.id;

    const codigo = (req.body.codigo || "").trim();
    const descripcion = (req.body.descripcion || "").trim();
    const codbar = (req.body.codbar || "").trim();
    const costodolar = Number(req.body.costodolar) || 0;
    const iva = Number(req.body.iva) || 0;
    const percep = Number(req.body.percep) || 0;
    const porcgan = Number(req.body.porcgan) || 0;
    const observa = (req.body.observa || "");
    const imagen = (req.body.imagen || "");
    const marca_id = Number(req.body.marca_id) || 0;
    const rubro_id = Number(req.body.rubro_id) || 0;

    const datos = {
        codigo,
        descripcion,
        codbar,
        costodolar,
        iva,
        percep,
        porcgan,
        observa,
        imagen,
        marca_id,
        rubro_id
    };

    const costohistNuevo = Number(req.body.costohist);


    if (req.body.iva === null || req.body.iva === undefined || req.body.iva === "") {
        return res.status(400).json({ error: "La alícuota de IVA es obligatoria" });
    }

    if (costohistNuevo > 0) {
        datos.costohist = costohistNuevo;
    }
    if (req.body.ultact) {
        datos.ultact = req.body.ultact;
    }

    // Validaciones
    if (codigo === "") {
        return res.status(400).json({ error: "El código no puede estar vacío" });
    }
    if (descripcion === "") {
        return res.status(400).json({ error: "La descripción no puede estar vacía" });
    }
    if (codbar === "") {
        return res.status(400).json({ error: "El codigo de barras no puede estar vacío" });
    }
    if (costodolar <= 0) {
        return res.status(400).json({ error: "El costo debe ser mayor a cero" });
    }

    if (!Number.isFinite(iva) || iva < 0) {
        return res.status(400).json({ error: "Alícuota de IVA inválida" });
    }
    if (porcgan <= 0) {
        return res.status(400).json({ error: "El porcentaje de ganancia debe ser mayor a cero" });
    }
    if (marca_id <= 0) {
        return res.status(400).json({ error: "Debe seleccionar una marca" });
    }
    if (rubro_id <= 0) {
        return res.status(400).json({ error: "Debe seleccionar un rubro" });
    }

    try {

        // Comprueba si existe un registro con el mismo codigo de barras
        const existentes = await query("SELECT id FROM articulos WHERE codbar = ? AND id <> ?", [codbar, id]);
        if (existentes.length > 0) {
            return res.status(409).json({ error: "Ya existe un artículo con ese código de barras" });
        }
        // Actualiza los datos del articulo
        const resultado = await query("UPDATE articulos SET ? WHERE id = ?", [datos, id]);
        // mensaje de éxito o fracaso
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: "El artículo no existe" });
        }
        res.json({ mensaje: "Artículo actualizado", id });

    } catch (error) {

        console.error("Error al guardar los datos del articulo:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }

});



// ============================================================================
// DELETE - Baja un articulo
// ============================================================================
router.delete("/:id", async (req, res) => {

    const id = req.params.id;

    try {

        const existentes = await query("SELECT estado FROM articulos WHERE id = ?", [id]);

        // constato que el articulo exista y tenga estado activo para poder borrarlo.
        if (existentes.length === 0) {
            return res.status(404).json({ error: "El artículo no existe" });
        }
        const estado = existentes[0].estado;
        if (estado === "inactivo") {
            return res.status(409).json({ error: "El artículo ya esta inactivo" });
        }

        // actualizo el estado a inactivo
        const result = await query(
            "UPDATE articulos SET estado = 'inactivo' WHERE id = ?", [id]
        );
        // refuerzo de validacion de existencia
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "El artículo no existe" });
        }
        return res.status(200).json({ message: "Dado de baja correctamente" });

    } catch (error) {

        console.error("Error al dar de baja el artículo:", error);
        res.status(500).json({ error: "Error interno del servidor" });

    }
});



// ============================================================================
// REACTIVACION - activar articulo un articulo
// ============================================================================
router.put("/:id/reactivar", async (req, res) => {

    const id = req.params.id;

    try {

        const existentes = await query("SELECT estado FROM articulos WHERE id = ?", [id]);

        // constato que el articulo exista y tenga estado inactivo para poder reactivarlo.
        if (existentes.length === 0) {
            return res.status(404).json({ error: "El artículo no existe" });
        }
        const estado = existentes[0].estado;
        if (estado === "activo") {
            return res.status(409).json({ error: "El artículo ya esta activo" });
        }

        // actualizo el estado a activo
        const result = await query(
            "UPDATE articulos SET estado = 'activo' WHERE id = ?", [id]
        );
        // refuerzo de validacion de existencia
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "El artículo no existe" });
        }
        return res.status(200).json({ message: "Reactivacion exitosa" });
    } catch (error) {
        console.error("Error al reactivar el artículo:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


module.exports = router;

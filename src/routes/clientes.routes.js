const express = require("express");
const router = express.Router();
const db = require("../config/db");
const query = (sql, parametros) => db.promise().query(sql, parametros).then(([filas]) => filas);


// ============================================================================
// GET - Listar clientes
// ============================================================================
router.get("/", async (req, res) => {

    const texto = req.query.texto || "";
    const estadoFiltro = req.query.estado || "activo";

    const ordenesPermitidos = {
        apenombre: "c.apenombre ASC",
        codigo: "c.codigo ASC",
    };

    // toma el orden que viene en la URL "query.orden", si viene en blanco va con "apenombre"
    const orden = ordenesPermitidos[req.query.orden] || "c.apenombre ASC";

    const condiciones = [];
    const parametros = [];

    // Agregamos el parametros de busqueda en las condiciones y en que campos de la tabla
    if (texto !== "") {
        condiciones.push("(c.apellido LIKE ? OR c.nombres LIKE ? OR c.apenombre LIKE ?)");
        parametros.push(`%${texto}%`, `%${texto}%`, `%${texto}%`);
    }

    // Agregamos el parametro de estado en las condiciones para filtrar
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
            c.apellido, 
            c.nombres, 
            c.direccion, 
            c.localidad, 
            c.provincia,
            c.postal,
            c.telef_pers,
            c.telef_trab,
            c.mail,
            c.sit_fis,
            c.cuit, 
            c.fecha_ingreso, 
            c.observaciones,
            c.apenombre,
            c.estado
        FROM clientes c
        ${where} 
        ORDER BY ${orden}
        `;

    try {

        const resultados = await query(sql, parametros);
        res.json(resultados);

    } catch (error) {

        console.error("Error al obtener registros:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


// ============================================================================
// GET - Aqui se obtiene el proximo numeo de codigo para el cliente
// ============================================================================
router.get("/proximo-codigo", async (req, res) => {
    try {

        const filas = await query("SELECT MAX(codigo) AS ultimo FROM clientes");
        const proximo = (filas[0].ultimo || 0) + 1;
        res.json({ proximo });

    } catch (error) {

        console.error("Error al obtener el próximo código:", error);
        res.status(500).json({ error: "Error interno del servidor" });

    }
});



// ============================================================================
// GET - Busca un solo cliente por id - se usa en ctacte
// ============================================================================

router.get("/:id", async (req, res) => {

    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Cliente inválido" });
        }

        const clientes = await query("SELECT * FROM clientes WHERE id = ?", [id]);

        if (clientes.length === 0) {
            return res.status(404).json({ error: "El cliente no existe" });
        }

        res.json(clientes[0]);
    } catch (error) {
        console.error("Error al consultar el cliente:", error);
        res.status(500).json({ error: "No se pudo consultar el cliente" });
    }
});



// ============================================================================
// POST - Genera el nuevo registro en la tabla clientes
// ============================================================================
router.post("/", async (req, res) => {

    //Garantiza que apellido (u otro) siempre sea un texto (string) limpio de espacios al principio y 
    //al final, y que si no enviaron nada (o enviaron solo espacios), termine siendo una cadena vacía ("").
    const codigo = Number(req.body.codigo) || 0;
    const apellido = (req.body.apellido || "").trim();
    const nombres = (req.body.nombres || "").trim();
    const direccion = (req.body.direccion || "").trim();
    const localidad = (req.body.localidad || "").trim();
    const provincia = (req.body.provincia || "").trim();
    const postal = (req.body.postal || "").trim();
    const telef_pers = (req.body.telef_pers || "").trim();
    const telef_trab = (req.body.telef_trab || "").trim();
    const mail = (req.body.mail || "").trim();
    const sit_fis = (req.body.sit_fis || "").trim();
    const cuit = (req.body.cuit || "").trim();
    const fecha_ingreso = (req.body.fecha_ingreso || "");
    const observaciones = (req.body.observaciones || "").trim();
    const apenombre = (apellido + " " + nombres).trim();
    const estado = "activo"

    const datos = {
        codigo,
        apellido,
        nombres,
        direccion,
        localidad,
        provincia,
        postal,
        telef_pers,
        telef_trab,
        mail,
        sit_fis,
        cuit,
        fecha_ingreso,
        observaciones,
        apenombre,
        estado
    };

    // Validaciones
    if (codigo <= 0) {
        return res.status(400).json({ error: "El código no puede ser 0" });
    }
    if (nombres === "") {
        return res.status(400).json({ error: "Debe existir un nombre" });
    }
    if (apellido === "") {
        return res.status(400).json({ error: "Debe existir apellido" });
    }
    if (fecha_ingreso === "") {
        return res.status(400).json({ error: "Coloque una fecha de ingreso" });
    }

    try {

        const resultado = await query("INSERT INTO clientes SET ?", [datos])
        res.json({ id: resultado.insertId });

    } catch (error) {
        console.error("Error al insertar cliente:", error);
        res.status(500).json({ error: "No se pudo guardar el cliente" });
    }

});



// ============================================================================
// PUT - Actualiza un cliente
// ============================================================================
router.put("/:id", async (req, res) => {

    const id = req.params.id;

    //Garantiza que apellido (u otro) siempre sea un texto (string) limpio de espacios al principio y 
    //al final, y que si no enviaron nada (o enviaron solo espacios), termine siendo una cadena vacía ("").

    const codigo = Number(req.body.codigo) || 0;
    const apellido = (req.body.apellido || "").trim();
    const nombres = (req.body.nombres || "").trim();
    const direccion = (req.body.direccion || "").trim();
    const localidad = (req.body.localidad || "").trim();
    const provincia = (req.body.provincia || "").trim();
    const postal = (req.body.postal || "").trim();
    const telef_pers = (req.body.telef_pers || "").trim();
    const telef_trab = (req.body.telef_trab || "").trim();
    const mail = (req.body.mail || "").trim();
    const sit_fis = (req.body.sit_fis || "").trim();
    const cuit = (req.body.cuit || "").trim();
    const fecha_ingreso = (req.body.fecha_ingreso || "");
    const observaciones = (req.body.observaciones || "").trim();
    const apenombre = (apellido + " " + nombres).trim();

    const datos = {
        codigo,
        apellido,
        nombres,
        direccion,
        localidad,
        provincia,
        postal,
        telef_pers,
        telef_trab,
        mail,
        sit_fis,
        cuit,
        fecha_ingreso,
        observaciones,
        apenombre
    };

    // Validaciones
    if (codigo <= 0) {
        return res.status(400).json({ error: "El código no puede ser 0" });
    }
    if (nombres === "") {
        return res.status(400).json({ error: "Debe existir un nombre" });
    }
    if (apellido === "") {
        return res.status(400).json({ error: "Debe existir apellido" });
    }
    if (fecha_ingreso === "") {
        return res.status(400).json({ error: "Coloque una fecha de ingreso" });
    }

    try {
        const sql = `UPDATE clientes SET ? WHERE id = ?`;
        const resultado = await query(sql, [datos, id])
        if (resultado.affectedRows == 0) {
            return res.status(404).json({ error: "El cliente no existe" });
        }
        res.json({ mensaje: "Cliente actualizado correctamente" });
    } catch (error) {
        console.error("Error al modificar cliente:", error);
        return res.status(500).json({ error: "No se pudo modificar el cliente" });
    }
});



// ============================================================================
// DELETE - Desactiva un cliente
// ============================================================================
router.delete("/:id", async (req, res) => {

    const id = req.params.id;

    try {

        const existentes = await query("SELECT estado FROM clientes WHERE id = ?", [id]);

        // constato que el cliente exista y tenga estado activo para poder borrarlo.
        if (existentes.length === 0) {
            return res.status(404).json({ error: "El cliente no existe" });
        }
        const estado = existentes[0].estado;
        if (estado === "inactivo") {
            return res.status(409).json({ error: "El cliente ya está inactivo" });
        }

        const sql = "UPDATE clientes SET estado = 'inactivo' WHERE id = ?";
        await query(sql, [id]);
        res.json({ mensaje: "Cliente desactivado correctamente" });

    } catch (error) {

        console.error("Error al desactivar cliente:", error);
        res.status(500).json({ error: "Error al desactivar cliente" });

    }

});



// ============================================================================
// PUT - Reactivar un cliente
// ============================================================================
router.put("/:id/reactivar", async (req, res) => {

    const id = req.params.id;

    try {

        const existentes = await query("SELECT estado FROM clientes WHERE id = ?", [id]);

        // constato que el cliente exista y tenga estado inactivo para poder reactivarlo.
        if (existentes.length === 0) {
            return res.status(404).json({ error: "El cliente no existe" });
        }
        const estado = existentes[0].estado;
        if (estado === "activo") {
            return res.status(409).json({ error: "El cliente ya está activo" });
        }

        const sql = "UPDATE clientes SET estado = 'activo' WHERE id = ?";
        await query(sql, [id]);
        res.json({ mensaje: "Cliente activado correctamente" });


    } catch (error) {

        console.error("Error al activar cliente:", error);
        res.status(500).json({ error: "Error al activar cliente" });

    }
});


module.exports = router;

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

    // Agregamos el parametros de busqueda en las condiciones y en que camppos de la tabla
    if (texto !== "") {
        condiciones.push("(c.apellido LIKE ? OR c.nombres LIKE ? OR c.apenombre LIKE ?)");
        parametros.push(`%${texto}%`, `%${texto}%`, `%${texto}%`);
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
// GET - de búsqueda de clientes 
// ============================================================================
router.get("/buscar", async (req, res) => {

    try {
        const texto = (req.query.texto || "").trim();
        const estado = req.query.estado || "activo";
        const orden = req.query.orden === "codigo" ? "id" : "apellido, nombres";

        const buscar = `%${texto}%`;
        const condiciones = ["(apellido LIKE ? OR nombres LIKE ? OR apenombre LIKE ?)"];
        const parametros = [buscar, buscar, buscar];

        if (estado !== "todos") {
            condiciones.push("estado = ?");
            parametros.push(estado);
        }

        const sql = `SELECT * FROM clientes WHERE ${condiciones.join(" AND ")} ORDER BY ${orden}`;

        const resultados = await query(sql, parametros);
        res.json(resultados);
    } catch (error) {
        console.error("Error al buscar el cliente:", error);
        res.status(500).json({ error: "Error al buscar el cliente" });
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

        const [clientes] = await db.promise().query("SELECT * FROM clientes WHERE id = ?", [id]);

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
router.post("/", (req, res) => {

    const datos = req.body;

    db.query("INSERT INTO clientes SET ?", [datos], (err, resultado) => {
        if (err) {
            console.error("Error al insertar cliente:", err);
            return res.status(500).json({ error: "No se pudo guardar el cliente" });
        }
        res.json({ id: resultado.insertId });
    });
});



// ============================================================================
// PUT - Actualiza un cliente
// ============================================================================
router.put("/:id", (req, res) => {

    const id = req.params.id;
    const datos = req.body;

    const query = `UPDATE clientes SET ? WHERE id = ?`;
    db.query(query, [datos, id], (err, resultado) => {
        if (err) {
            console.error("Error al modificar cliente:", err);
            return res.status(500).json({ error: "No se pudo modificar el cliente" });
        }
        res.json({ id: resultado.insertId });
    });
});



// ============================================================================
// DELETE - Desactiva un cliente
// ============================================================================
router.delete("/:id", (req, res) => {

    const id = req.params.id;
    const sql = "UPDATE clientes SET estado = 'inactivo' WHERE id = ?";

    db.query(sql, [id], (error, _resultado) => {
        if (error) {
            console.error("Error al dar de baja al cliente:", error);
            return res.status(500).json({ error: "Error al dar de baja al cliente" });
        }

        res.json({ mensaje: "Cliente dado de baja correctamente" });
    });
});



// ============================================================================
// PUT - Reactivar un cliente
// ============================================================================
router.put("/:id/reactivar", (req, res) => {

    const id = req.params.id;
    const sql = "UPDATE clientes SET estado = 'activo' WHERE id = ?";

    db.query(sql, [id], (error, _resultado) => {
        if (error) {
            console.error("Error al reactivar al cliente:", error);
            return res.status(500).json({ error: "Error al reactivar al cliente" });
        }

        res.json({ mensaje: "Cliente reactivado correctamente" });
    });
});

module.exports = router;

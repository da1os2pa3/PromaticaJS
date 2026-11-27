const express = require("express");
const router = express.Router();
const db = require("../config/db");
const query = (sql, parametros) => db.promise().query(sql, parametros).then(([filas]) => filas);


// ============================================================================
// GET - Obtener los nombres de los rubros
// ============================================================================
router.get("/", async (req, res) => {

    const sql = `
        SELECT id, ru_nombre AS nombre
        FROM rubros
        ORDER BY ru_nombre ASC
        `;

    try {
        const resultados = await query(sql);
        res.json(resultados);
    } catch (error) {
        console.error("Error al obtener registros:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


module.exports = router;

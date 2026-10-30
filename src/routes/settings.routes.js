const express = require("express");
const router = express.Router();
const db = require("../config/db");
const query = (sql, parametros) => db.promise().query(sql, parametros).then(([filas]) => filas);


// ============================================================================
// GET - Obtiene la configuración
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const filas = await query('SELECT * FROM informa LIMIT 1');
        if (filas.length === 0) return res.status(404).json({ error: 'No hay registro de configuración' });
        res.json(filas[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al leer la configuración' });
    }
});


// ============================================================================
// PUT - Guarda la configuración
// ============================================================================
router.put('/', async (req, res) => {
    try {
        const { id, ...datos } = req.body;
        await query('UPDATE informa SET ? LIMIT 1', [datos]);
        res.json({ mensaje: 'Configuración guardada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al guardar la configuración' });
    }
});


module.exports = router;
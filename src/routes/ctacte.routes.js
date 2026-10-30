const express = require("express");
const router = express.Router();
const db = require("../config/db");
const query = (sql, parametros) => db.promise().query(sql, parametros).then(([filas]) => filas);

// ===========================================================================================================
// GET - Carga los movimientos de cuenta corriente de un cliente, con saldo parcial
// ===========================================================================================================
router.get('/:idCliente', async (req, res) => {

    try {
        const idCliente = Number(req.params.idCliente);
        if (!Number.isInteger(idCliente)) {
            return res.status(400).json({ error: 'Id de cliente inválido' });
        }

        const filas = await query(
            `SELECT Id, cc_fecha, cc_detalle, cc_ingreso, cc_egreso
             FROM ctacte
             WHERE cc_idcliente = ?
             ORDER BY cc_fecha, Id`,
            [idCliente]
        );

        let saldo = 0;
        const movimientos = filas.map(fila => {
            const debito = Number(fila.cc_ingreso);
            const credito = Number(fila.cc_egreso);
            saldo = Math.round((saldo + debito - credito) * 100) / 100;
            return {
                id: fila.Id,
                fecha: fila.cc_fecha,
                detalle: fila.cc_detalle,
                debito,
                credito,
                saldo
            };
        });

        res.json({ movimientos, saldoFinal: saldo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al leer la cuenta corriente' });
    }
});


// ===========================================================================================================
// POST /api/ctacte/:id/ajustes  -> registra un ajuste manual en la cuenta del cliente
// ===========================================================================================================
router.post("/:id/ajustes", async (req, res) => {

    try {
        const idCliente = Number(req.params.id);
        const concepto = (req.body.concepto || "").trim();
        const montoDeb = Number(req.body.montoDeb);
        const montoCre = Number(req.body.montoCre);
        let fechaMov = (req.body.fechaMov || "").trim();

        // Validaciones de los datos recibidos
        if (!Number.isInteger(idCliente) || idCliente <= 0) {
            return res.status(400).json({ error: "Cliente inválido" });
        }
        if (concepto === "") {
            return res.status(400).json({ error: "El concepto es obligatorio" });
        }
        if (!Number.isFinite(montoDeb)) {
            return res.status(400).json({ error: "El monto debito no es válido" });
        }
        if (!Number.isFinite(montoCre)) {
            return res.status(400).json({ error: "El monto credito no es válido" });
        }
        if (montoDeb === 0 && montoCre === 0) {
            return res.status(400).json({ error: "Debe existir algún importe." });
        }
        // Validación de la fecha
        if (!fechaMov) {
            fechaMov = null;
        } else {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaMov)) {
                return res.status(400).json({ error: "La fecha debe tener formato AAAA-MM-DD" });
            }
            const fechaObjeto = new Date(fechaMov);
            if (isNaN(fechaObjeto.getTime()) || fechaObjeto.toISOString().slice(0, 10) !== fechaMov) {
                return res.status(400).json({ error: "La fecha es inválida" });
            }
        }

        // El SELECT pide solo la columna id porque no necesitamos los datos del cliente, solo saber si está. 
        // Y los corchetes de const [clientes] son porque db.query devuelve dos cosas (las filas y información 
        // técnica de los campos), y con los corchetes te quedás solo con la primera.
        const [clientes] = await db.promise().query("SELECT id FROM clientes WHERE id = ?", [idCliente]);
        if (clientes.length === 0) {
            return res.status(404).json({ error: "El cliente no existe" });
        }

        const ingreso = montoDeb;
        const egreso = montoCre;

        await db.promise().query(
            `INSERT INTO ctacte (cc_fecha, cc_detalle, cc_ingreso, cc_egreso, cc_idcliente, cc_clavemov)
            VALUES (COALESCE(?, CURDATE()), ?, ?, ?, ?, 0)`,
            [fechaMov, concepto, ingreso, egreso, idCliente]
        );

        res.status(201).json({ mensaje: "Ajuste registrado" });
    } catch (error) {
        console.error("Error al registrar el ajuste:", error);
        res.status(500).json({ error: "No se pudo registrar el ajuste" });
    }
});







module.exports = router;
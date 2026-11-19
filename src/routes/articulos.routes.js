const express = require("express");
const router = express.Router();
const db = require("../config/db");
const query = (sql, parametros) => db.promise().query(sql, parametros).then(([filas]) => filas);

// ============================================================================
// GET - Listar articulos
// ============================================================================
router.get("/", async (req, res) => {

    const texto = req.query.texto || "";
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
        res.json(resultados);
    } catch (error) {
        console.error("Error al obtener registros:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});






module.exports = router;





// // ============================================================================
// // GET - listar articulos con el filtro de búsqueda
// // ============================================================================
// router.get("/buscar", async (req, res) => {

//     try {
//         const texto = (req.query.texto || "").trim();
//         const estado = req.query.estado || "activo";

//         const ordenesPermitidos = {
//             descripcion: "c.descripcion",
//             rubro_marca_descripcion: "r.ru_nombre ASC, m.ma_nombre ASC, c.descripcion",
//         };

//         // toma el orden que viene en la URL "query.orden", si viene en blanco va con "descripcion"
//         const orden = ordenesPermitidos[req.query.orden] || "c.descripcion ASC";



//         const buscar = `%${texto}%`;
//         const condiciones = ["(c.descripcion LIKE ? OR c.codigo LIKE ? OR c.codbar LIKE ?)"];
//         const parametros = [buscar, buscar, buscar];

//         if (estado !== "todos") {
//             condiciones.push("c.estado = ?");
//             parametros.push(estado);
//         }

//         const sql = `SELECT 
//                         c.id, 
//                         c.codigo, 
//                         c.descripcion, 
//                         m.ma_nombre AS marca,
//                         r.ru_nombre AS rubro,     
//                         c.marca_id, 
//                         c.rubro_id, 
//                         c.codbar, 
//                         c.costodolar,
//                         c.iva,
//                         c.percep,
//                         c.porcgan,
//                         c.observa,
//                         c.ultact, 
//                         c.costohist, 
//                         c.imagen,
//                         c.estado
//                     FROM articulos c
//                     LEFT JOIN marcas m ON m.id = c.marca_id LEFT JOIN rubros r ON r.id = c.rubro_id
//                     WHERE ${condiciones.join(" AND ")} ORDER BY ${orden}`;

//         const resultados = await query(sql, parametros);
//         res.json(resultados);
//     } catch (error) {
//         console.error("Error al buscar el articulo:", error);
//         res.status(500).json({ error: "Error al buscar el articulo" });
//     }
// });


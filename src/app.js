//<!-- Para iniciar el servidor: npm run dev -->

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors())

// Rutas de ejemplo para verificar que el servidor funciona
// app.get('/', (req, res) => {
//    res.send('¡Hola Mundo! El servidor está funcionando.');
// });


// Servir la interfaz web estática desde la carpeta 'public'
app.use(express.static(path.join(__dirname, "../public")));

// Rutas de la API REST -----------------------------------------------------------

// Rutas de clientes. Todo lo que agregue despues del "/clientes" lo va a manejar el archivo clientes.routes.js
// por ejemplo "clientes/buscar", "clientes/", "clientes/:id", etc.
const clientesRoutes = require("./routes/clientes.routes");
app.use("/api/clientes", clientesRoutes);

// Ruta settings - idem
const settingsRoutes = require("./routes/settings.routes");
app.use("/api/settings", settingsRoutes);

// Ruta cuenta corriente - idem
const ctacteRouter = require("./routes/ctacte.routes");
app.use("/api/ctacte", ctacteRouter);




//---------------------------------------------------------------------------------

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
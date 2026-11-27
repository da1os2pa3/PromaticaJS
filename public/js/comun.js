function mostrarAviso(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('contenedorAvisos');
    const aviso = document.createElement('div');
    aviso.className = `aviso aviso-${tipo}`;
    aviso.textContent = mensaje;
    contenedor.appendChild(aviso);

    requestAnimationFrame(() => aviso.classList.add('visible'));

    setTimeout(() => {
        aviso.classList.remove('visible');
        setTimeout(() => aviso.remove(), 300);
    }, 3000);
}

// Muestra un número en formato argentino: 7205.48 -> "7.205,48"
function formatearNumero(valor, decimales = 2) {
    if (valor === null || valor === undefined || valor === "") return "";
    return Number(valor).toLocaleString("es-AR", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
        useGrouping: "always"
    });
}

// Lee un texto escrito por el usuario y lo convierte en número
function leerNumero(texto) {
    let limpio = String(texto).trim();
    if (limpio.includes(",")) {
        limpio = limpio.replace(/\./g, "").replace(",", ".");
    }
    return Number(limpio);
}
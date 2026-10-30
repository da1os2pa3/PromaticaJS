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
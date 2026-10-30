// Lo llama el index.html que es la pantalla principal --------------------------------------
const btnMenu = document.getElementById("btnMenu");
const menuDesplegable = document.getElementById("menuDesplegable");
const menuPrincipal = document.querySelector(".menu-principal");

if (btnMenu && menuDesplegable && menuPrincipal) {
    // Abrir / cerrar al hacer clic en el botón
    btnMenu.addEventListener("click", () => {
        const abierto = menuDesplegable.classList.toggle("abierto");
        btnMenu.setAttribute("aria-expanded", abierto);
    });

    // Cerrar si se hace clic fuera del menú
    document.addEventListener("click", (e) => {
        if (!menuPrincipal.contains(e.target)) {
            menuDesplegable.classList.remove("abierto");
            btnMenu.setAttribute("aria-expanded", "false");
        }
    });

    // Cerrar con la tecla Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            menuDesplegable.classList.remove("abierto");
            btnMenu.setAttribute("aria-expanded", "false");
        }
    });
}




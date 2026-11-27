// Lista de opciones del menú: para sumar una opción, se agrega una línea acá
const opcionesMenu = [
    { texto: "Configuración", icono: "settings", url: "/settings.html" },
    { texto: "Acerca de", icono: "info", url: "/acerca.html" },
    { texto: "Cerrar Sesion", icono: "mode_off_on", url: "/despedida.html" }
];

function crearMenu() {
    const barra = document.querySelector(".barra-superior");
    // Si la pantalla no tiene franja superior, o ya tiene el menú, no hace nada
    if (!barra || document.getElementById("btnMenu")) return;

    // Arma el HTML de cada opción a partir de la lista
    const items = opcionesMenu.map(opcion => `
        <a href="${opcion.url}" class="menu-item">
            <span class="material-symbols-outlined">${opcion.icono}</span>
            ${opcion.texto}
        </a>
    `).join("");

    const contenedor = document.createElement("div");
    contenedor.className = "menu-principal";
    contenedor.innerHTML = `
        <button id="btnMenu" class="btn-menu" type="button" aria-expanded="false">
            <span class="material-symbols-outlined">menu</span>
            Menú
        </button>
        <nav id="menuDesplegable" class="menu-desplegable">${items}</nav>
    `;

    // prepend lo pone como primer hijo de la franja, antes de empresa-info
    barra.prepend(contenedor);
}

function activarMenu() {
    const btnMenu = document.getElementById("btnMenu");
    const menuDesplegable = document.getElementById("menuDesplegable");
    const menuPrincipal = document.querySelector(".menu-principal");

    if (!btnMenu || !menuDesplegable || !menuPrincipal) return;

    btnMenu.addEventListener("click", () => {
        const abierto = menuDesplegable.classList.toggle("abierto");
        btnMenu.setAttribute("aria-expanded", abierto);
    });

    document.addEventListener("click", (e) => {
        if (!menuPrincipal.contains(e.target)) {
            menuDesplegable.classList.remove("abierto");
            btnMenu.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            menuDesplegable.classList.remove("abierto");
            btnMenu.setAttribute("aria-expanded", "false");
        }
    });
}

crearMenu();
activarMenu();
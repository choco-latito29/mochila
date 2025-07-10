document.addEventListener("DOMContentLoaded", () => {
  // ===================================================================
  // --- CONFIGURACIÓN GLOBAL ---
  // ===================================================================
  const API_BASE_URL = "http://216.173.77.192:25959/api";
  const SERVER_BASE_URL = "https://216.173.77.192:25959";
  console.log("Script principal cargado.");

  // Rutas por defecto para imágenes
  const DEFAULT_TEAM_LOGO = "../Image/default.png";
  const DEFAULT_CASTER_PHOTO = "../Image/casters.png"; // Ajustado para tu ruta relativa

  // ===================================================================
  // --- REFERENCIAS DEL DOM (Unificado y ajustado a tu HTML) ---
  // ===================================================================
  const dom = {
    // Autenticación y Navegación
    loginButton: document.getElementById("login-button"),
    logoutButton: document.getElementById("logout-button"),
    adminPanelButton: document.getElementById("admin-panel-button"),
    navToggle: document.getElementById("nav-toggle"),
    navMenu: document.getElementById("nav-menu"),

    // Contador Regresivo
    countdownContainer: document.getElementById("countdown"),
    daysSpan: document.getElementById("days"),
    hoursSpan: document.getElementById("hours"),
    minutesSpan: document.getElementById("minutes"),
    secondsSpan: document.getElementById("seconds"),
    heroSubtitle: document.querySelector(".hero-content .subtitle"), // Selector más específico para evitar conflictos

    // Equipos Destacados
    featuredTeamsGrid: document.getElementById("featured-teams-grid"),
    teamModal: document.getElementById("team-modal"),
    closeTeamModalBtn: document.getElementById("close-modal-btn"),
    modalTeamDetails: document.getElementById("modal-team-details"),

    // Casters
    castersGrid: document.getElementById("casters-grid"), // Contenedor para las tarjetas de casters
    casterModal: document.getElementById("caster-modal"), // Tu modal existente para casters
    closeCasterModalBtn: document.getElementById("close-caster-modal-btn"), // Botón de cerrar del modal de caster

    // Elementos dentro del modal de detalles del caster (se esperan DENTRO de #caster-modal o #modal-caster-details)
    // Se asume que #modal-caster-details es el contenedor principal del contenido del modal
    // Ajusta los IDs en tu index.html si no coinciden.
    modalCasterPhoto: document.getElementById("modalCasterPhoto"), // Debe existir en tu HTML
    modalCasterName: document.getElementById("modalCasterName"), // Debe existir en tu HTML
    modalCasterDescription: document.getElementById("modalCasterDescription"), // Debe existir en tu HTML
    modalCasterSocials: document.getElementById("modalCasterSocials"), // Debe existir en tu HTML

    // Footer
    yearSpan: document.getElementById("year"),
  };

  // ===================================================================
  // --- ESTADO GLOBAL (DATOS DE LA APLICACIÓN) ---
  // ===================================================================
  const appState = {
    teamsData: [], // Lista de todos los equipos
    castersData: [], // Lista de todos los casters
    tournamentEndDate: new Date("2025-08-04T00:00:00").getTime(), // Fecha del torneo en milisegundos
  };

  // ===================================================================
  // --- UTILIDADES ---
  // ===================================================================
  const utils = {
    decodeToken: (token) => {
      try {
        return JSON.parse(atob(token.split(".")[1]));
      } catch (e) {
        return null;
      }
    },

    fetchAPI: async (endpoint) => {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Error HTTP: ${response.status}`
          );
        }
        return response.json();
      } catch (error) {
        console.error(`Error al obtener datos de ${endpoint}:`, error);
        // Si quieres mostrar mensajes al usuario en la página pública, aquí iría una implementación
        // de un modal de notificación si lo añades a index.html. Por ahora, solo console.error.
        throw error;
      }
    },

    getFormattedDate: (dateString) => {
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("es-ES", options);
    },

    // Mapa de plataformas a iconos de Font Awesome
    socialIconMap: {
      kick: "fab fa-kickstarter", // Asumo este icono, si no funciona, revisa tu versión de FA o usa 'fas fa-link'
      twitter: "fab fa-twitter", // O 'fab fa-x-twitter' si usas la versión más reciente de FA
      instagram: "fab fa-instagram",
      tiktok: "fab fa-tiktok",
      youtube: "fab fa-youtube",
      twitch: "fab fa-twitch",
      facebook: "fab fa-facebook-f",
      discord: "fab fa-discord",
      website: "fas fa-globe", // Genérico para sitios web
      default: "fas fa-link", // Icono por defecto
    },
  };

  // ===================================================================
  // --- LÓGICA PRINCIPAL DE LA APLICACIÓN ---
  // ===================================================================
  const App = {
    init: () => {
      App.bindEventListeners();
      App.updateAuthUI();
      App.setupCountdown();
      App.loadAllData();
      App.updateFooterYear();
    },

    // --- Manejo de UI de Autenticación ---
    updateAuthUI: () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        const userData = utils.decodeToken(token);
        const isExpired = userData && userData.exp * 1000 < Date.now();

        if (
          userData &&
          !isExpired &&
          (userData.roles.includes("admin") ||
            userData.roles.includes("manager"))
        ) {
          if (dom.adminPanelButton)
            dom.adminPanelButton.classList.remove("hidden");
          if (dom.logoutButton) dom.logoutButton.classList.remove("hidden");
          if (dom.loginButton) dom.loginButton.classList.add("hidden");
        } else {
          localStorage.removeItem("authToken"); // Limpiar token expirado o inválido
          if (dom.adminPanelButton)
            dom.adminPanelButton.classList.add("hidden");
          if (dom.logoutButton) dom.logoutButton.classList.add("hidden");
          if (dom.loginButton) dom.loginButton.classList.remove("hidden");
        }
      } else {
        if (dom.adminPanelButton) dom.adminPanelButton.classList.add("hidden");
        if (dom.logoutButton) dom.logoutButton.classList.add("hidden");
        if (dom.loginButton) dom.loginButton.classList.remove("hidden");
      }
    },

    logoutUser: () => {
      localStorage.removeItem("authToken");
      window.location.href = "../Pages/index.html"; // Redirige a la página principal
      App.updateAuthUI(); // Actualiza la UI de autenticación
      // Si tuvieras un modal de notificación en index.html, podrías usarlo aquí:
      // App.showMessage("Has cerrado sesión.", "success");
    },

    // --- Contador Regresivo ---
    setupCountdown: () => {
      if (!dom.countdownContainer) return; // Asegurarse de que el elemento exista

      const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = appState.tournamentEndDate - now;

        if (distance < 0) {
          clearInterval(countdownInterval);
          dom.countdownContainer.innerHTML =
            "<div class='tournament-live'>¡EL TORNEO ESTÁ EN VIVO!</div>";
          if (dom.heroSubtitle)
            dom.heroSubtitle.textContent = "¡La Batalla ha Comenzado!";
          return;
        }

        if (
          dom.daysSpan &&
          dom.hoursSpan &&
          dom.minutesSpan &&
          dom.secondsSpan
        ) {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (distance % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          dom.daysSpan.textContent = String(days).padStart(2, "0");
          dom.hoursSpan.textContent = String(hours).padStart(2, "0");
          dom.minutesSpan.textContent = String(minutes).padStart(2, "0");
          dom.secondsSpan.textContent = String(seconds).padStart(2, "0");
        }
      };

      updateCountdown();
      const countdownInterval = setInterval(updateCountdown, 1000);
    },

    // --- Carga General de Datos ---
    loadAllData: async () => {
      try {
        // Cargar Equipos
        const teamsResponse = await utils.fetchAPI("/teams");
        appState.teamsData = teamsResponse.teams || [];
        App.renderFeaturedTeams(); // Renderizar equipos destacados

        // Cargar Casters
        const castersResponse = await utils.fetchAPI("/casters");
        appState.castersData = castersResponse.casters || [];
        App.renderCasters(); // Renderizar casters
      } catch (error) {
        console.error("Error al cargar todos los datos de la API:", error);
        // Mensaje al usuario si la carga de datos falla
        if (dom.featuredTeamsGrid)
          dom.featuredTeamsGrid.innerHTML = `<p style="color: white; grid-column: 1 / -1; text-align: center;">No se pudieron cargar los equipos.</p>`;
        if (dom.castersGrid)
          dom.castersGrid.innerHTML = `<p style="color: white; grid-column: 1 / -1; text-align: center;">No se pudieron cargar los casters.</p>`;
      }
    },

    // --- Renderizado de Equipos Destacados ---
    renderFeaturedTeams: () => {
      if (!dom.featuredTeamsGrid) return;

      dom.featuredTeamsGrid.innerHTML = "";
      if (appState.teamsData.length === 0) {
        dom.featuredTeamsGrid.innerHTML = `
                    <div class="info-message">
                        <i class="fas fa-shield-alt"></i>
                        <p>Los equipos contendientes serán revelados próximamente.</p>
                        <p>¡Mantente atento para conocer a los aspirantes a la gloria de la Mochila Cup!</p>
                    </div>`;
        return;
      }

      // Muestra los primeros 2 equipos o ajusta la lógica para elegir los destacados
      const teamsToShow = appState.teamsData;

      teamsToShow.forEach((team) => {
        const teamCard = document.createElement("div");
        teamCard.className = "team-card-index";
        teamCard.dataset.teamId = team._id; // Para el modal de equipo si lo tienes

        const logoUrl = team.logo
          ? `${SERVER_BASE_URL}${team.logo}`
          : DEFAULT_TEAM_LOGO;

        teamCard.innerHTML = `
                    <img src="${logoUrl}" alt="Logo de ${
          team.name
        }" class="team-logo-card" onerror="this.onerror=null; this.src='${DEFAULT_TEAM_LOGO}';">
                    <h3>${team.name}</h3>
                    <p>Grupo ${team.group || "N/A"}</p>
                    <span class="card-link">Ver Perfil</span>
                `;
        dom.featuredTeamsGrid.appendChild(teamCard);
      });
    },

    // --- Renderizado de Casters ---
    renderCasters: () => {
      if (!dom.castersGrid) return;

      dom.castersGrid.innerHTML = "";
      if (appState.castersData.length === 0) {
        dom.castersGrid.innerHTML = `
                    <div class="info-message">
                        <i class="fas fa-microphone-slash"></i>
                        <p>Aún no se han anunciado los casters oficiales del torneo.</p>
                        <p>Vuelve a consultar pronto para conocer a las voces que darán vida a la Mochila Cup.</p>
                    </div>`;
        return;
      }

      appState.castersData.forEach((caster) => {
        const casterCard = document.createElement("div");
        casterCard.className = "caster-card"; // Clase CSS para las tarjetas de caster
        casterCard.dataset.casterId = caster._id; // Almacena el ID para abrir el modal

        const photoUrl = caster.photo
          ? `${SERVER_BASE_URL}${caster.photo}`
          : DEFAULT_CASTER_PHOTO;
        const shortDescription = caster.description
          ? caster.description.substring(0, 100) + "..."
          : "Sin descripción.";

        let socialIconsHtml = "";
        if (caster.socials && Object.keys(caster.socials).length > 0) {
          socialIconsHtml = '<div class="caster-card-social-icons">';
          // Mostrar hasta 3 iconos en la tarjeta para no sobrecargar
          const displayedSocials = Object.entries(caster.socials).slice(0, 3);
          displayedSocials.forEach(([platform, url]) => {
            const iconClass =
              utils.socialIconMap[platform] || utils.socialIconMap.default;
            socialIconsHtml += `<a href="${url}" target="_blank" title="${
              platform.charAt(0).toUpperCase() + platform.slice(1)
            }"><i class="${iconClass}"></i></a>`;
          });
          socialIconsHtml += "</div>";
        } else {
          socialIconsHtml = '<p class="no-socials-card">Sin redes sociales</p>';
        }

        casterCard.innerHTML = `
 <img src="${photoUrl}" alt="Foto de ${
          caster.name
        }" class="caster-photo" onerror="this.onerror=null; this.src='${DEFAULT_CASTER_PHOTO}';" />
 <h4>${caster.name || "Nombre no disponible"}</h4>
 <button class="view-details-btn">Ver Detalles</button>
`;
        dom.castersGrid.appendChild(casterCard);
      });
    },

    showCasterDetailsModal: (casterId) => {
      const caster = appState.castersData.find((c) => c._id === casterId);
      if (!caster) {
        /* ... error handling ... */ return;
      }
      if (
        !dom.modalCasterPhoto ||
        !dom.modalCasterName ||
        !dom.modalCasterDescription ||
        !dom.modalCasterSocials
      ) {
        console.error(
          "Elementos del modal de caster no encontrados en el DOM. Revisa los IDs en index.html."
        );
        alert("Error al mostrar los detalles del caster.");
        return;
      } // --- ESTA ES LA ASIGNACIÓN CORRECTA Y ÚNICA ---

      // --- ESTA ES LA ASIGNACIÓN CORRECTA Y ÚNICA. ELIMINA CUALQUIER OTRA LÍNEA SIMILAR AQUÍ ---
      const photoSrc = caster.photo
        ? `${SERVER_BASE_URL}${caster.photo}` // Construye la URL completa
        : DEFAULT_CASTER_PHOTO; // Usa la imagen por defecto si no hay foto
      dom.modalCasterPhoto.src = photoSrc; // --- FIN DE LA ASIGNACIÓN CORRECTA Y ÚNICA ---
      dom.modalCasterName.textContent = caster.name;
      dom.modalCasterDescription.textContent =
        caster.description || "Este caster no tiene una descripción detallada.";

      dom.modalCasterSocials.innerHTML = ""; // Limpiar redes sociales previas del modal
      if (caster.socials && Object.keys(caster.socials).length > 0) {
        Object.entries(caster.socials).forEach(([platform, url]) => {
          const iconClass =
            utils.socialIconMap[platform] || utils.socialIconMap.default;
          const platformDisplayName =
            platform.charAt(0).toUpperCase() + platform.slice(1);

          const linkEl = document.createElement("a");
          linkEl.href = url;
          linkEl.target = "_blank";
          linkEl.className = "caster-modal-social-link"; // Clase para estilos específicos del modal
          linkEl.innerHTML = `<i class="${iconClass}"></i><span>${platformDisplayName}</span>`;
          dom.modalCasterSocials.appendChild(linkEl);
        });
      } else {
        dom.modalCasterSocials.innerHTML = '<p class="no-socials-modal"></p>';
      }

      dom.casterModal.classList.add("active"); // Esta línea abre el modal
    },

    hideCasterDetailsModal: () => {
      if (dom.casterModal) {
        dom.casterModal.classList.remove("active"); // Ocultar el modal
      }
    },

    // --- Gestión de Eventos ---
    bindEventListeners: () => {
      // Navegación responsive
      if (dom.navToggle && dom.navMenu) {
        dom.navToggle.addEventListener("click", () => {
          dom.navMenu.classList.toggle("active");
        });
      }

      // Botón de Logout
      if (dom.logoutButton) {
        dom.logoutButton.addEventListener("click", App.logoutUser);
      }

      // Clic en tarjetas de equipo para abrir modal (si aplica)
      if (dom.featuredTeamsGrid && dom.teamModal) {
        dom.featuredTeamsGrid.addEventListener("click", (event) => {
          const card = event.target.closest(".team-card-index");
          if (card && card.dataset.teamId) {
            const teamId = card.dataset.teamId;
            const team = appState.teamsData.find((t) => t._id === teamId);
            if (team) {
              App.showTeamDetailsInModal(team); // Llamar a la función del modal de equipo
            }
          }
        });
      }

      // Clic en el botón de cerrar del modal de equipo
      if (dom.closeTeamModalBtn) {
        dom.closeTeamModalBtn.addEventListener("click", () =>
          dom.teamModal.classList.remove("active")
        );
      }
      // Cerrar modal de equipo al hacer clic fuera
      if (dom.teamModal) {
        dom.teamModal.addEventListener("click", (event) => {
          if (event.target === dom.teamModal) {
            dom.teamModal.classList.remove("active");
          }
        });
      }

      // Clic en el botón "Ver Detalles" de la tarjeta de caster
      if (dom.castersGrid) {
        dom.castersGrid.addEventListener("click", (e) => {
          const viewDetailsBtn = e.target.closest(".view-details-btn");
          if (viewDetailsBtn) {
            const casterCard = viewDetailsBtn.closest(".caster-card");
            const casterId = casterCard.dataset.casterId;
            App.showCasterDetailsModal(casterId);
          }
        });
      }

      // Clic en el botón de cerrar del modal de caster
      if (dom.closeCasterModalBtn) {
        dom.closeCasterModalBtn.addEventListener(
          "click",
          App.hideCasterDetailsModal
        );
        // Cerrar modal de caster al hacer clic fuera del contenido
        if (dom.casterModal) {
          dom.casterModal.addEventListener("click", (e) => {
            if (e.target === dom.casterModal) {
              App.hideCasterDetailsModal();
            }
          });
        }
      }
    },

    // --- Lógica de Modal de Equipo (ya la tenías, la integré aquí) ---
    showTeamDetailsInModal: (team) => {
      if (!team || !dom.teamModal || !dom.modalTeamDetails) return;

      const roleOrder = { coach: 1, player: 2, "stand-in": 3 };
      const getIconForRole = (role) => {
        switch (role) {
          case "coach":
            return "fas fa-headset";
          case "player":
            return "fas fa-gamepad";
          case "stand-in":
            return "fas fa-user-clock";
          default:
            return "fas fa-user";
        }
      };

      const sortedMembers = [...(team.members || [])].sort(
        (a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99)
      );
      const playersHTML =
        sortedMembers.length > 0
          ? sortedMembers
              .map(
                (p) =>
                  `<li><i class="${getIconForRole(p.role)}"></i> ${
                    p.name
                  } <span class="role">(${p.role})</span></li>`
              )
              .join("")
          : "<li>No hay jugadores registrados.</li>";

      const logoSrc = team.logo
        ? `${SERVER_BASE_URL}${team.logo}`
        : DEFAULT_TEAM_LOGO;

      dom.modalTeamDetails.innerHTML = `
                <img src="${logoSrc}" alt="Logo de ${
        team.name
      }" class="modal-team-logo" onerror="this.onerror=null; this.src='${DEFAULT_TEAM_LOGO}';">
                <h3>${team.name}</h3>
                <p class="team-group">Grupo ${team.group || "N/A"}</p>
                <p class="team-motto"><em>"${team.motto || "Sin lema"}"</em></p>
                <h4>Alineación</h4>
                <ul>${playersHTML}</ul>
            `;
      dom.teamModal.classList.add("active");
    },

    // --- Año del Footer ---
    updateFooterYear: () => {
      if (dom.yearSpan) {
        dom.yearSpan.textContent = new Date().getFullYear();
      }
    },
  };

  // ===================================================================
  // --- INICIA LA APLICACIÓN CUANDO EL DOM ESTÉ COMPLETAMENTE CARGADO ---
  // ===================================================================
  App.init();
});

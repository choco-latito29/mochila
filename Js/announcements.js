document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://216.173.77.192:25959/api";
  const SERVER_BASE_URL = "https://216.173.77.192:25959";
  const container = document.getElementById("announcements-list");

  // Función para calcular "hace X tiempo"
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return `hace unos segundos`;
  };

  const loadAnnouncements = async () => {
    if (!container) {
      console.error("El contenedor de anuncios no se encontró.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/news`);
      if (!response.ok) throw new Error("No se pudieron cargar los anuncios.");

      const data = await response.json();

      // --- PASO 1: ORDENAR LOS ANUNCIOS ---
      // Aseguramos que la lista esté ordenada de más reciente a más antiguo ANTES de hacer cualquier otra cosa.
      const announcements = data.news.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      container.innerHTML = ""; // Limpiar el loader

      if (announcements.length === 0) {
        container.innerHTML = `
                    <div class="info-message">
                        <i class="fas fa-bullhorn"></i>
                        <p>Aún no hay anuncios oficiales.</p>
                        <p>Vuelve pronto para no perderte ninguna novedad sobre la Mochila Cup.</p>
                    </div>
                `;
        return;
      }

      // --- PASO 2: RENDERIZAR CADA ANUNCIO EN ORDEN ---
      // Ya no es necesario agrupar por fecha, el sort() ya hizo el trabajo principal.
      announcements.forEach((item) => {
        const card = document.createElement("article");
        card.className = "announcement-card";

        const formattedDate = new Date(item.createdAt).toLocaleDateString(
          "es-ES",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        );

        const imageUrl = item.imageUrl
          ? `${SERVER_BASE_URL}${item.imageUrl}`
          : "";

        // Usamos la librería marked.js para convertir el contenido a HTML
        const formattedContent = marked.parse(item.content);

        card.innerHTML = `
                    ${
                      imageUrl
                        ? `<img src="${imageUrl}" alt="Imagen para ${item.title}" class="announcement-image">`
                        : ""
                    }
                    <div class="announcement-content">
                        <div class="announcement-meta">
                            <span>Publicado el ${formattedDate}</span>
                            <span class="time-ago">${timeAgo(
                              item.createdAt
                            )}</span>
                        </div>
                        <h2 class="announcement-title">${item.title}</h2>
                        <hr>
                        <div class="announcement-text">${formattedContent}</div>
                    </div>
                `;
        container.appendChild(card);
      });
    } catch (error) {
      console.error("Error al cargar anuncios:", error);
      container.innerHTML = `<p class="info-message error-message">Hubo un error al cargar los anuncios.</p>`;
    }
  };

  loadAnnouncements();
});

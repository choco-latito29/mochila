document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://216.173.77.192:25959/api";
  const SERVER_BASE_URL = "http://216.173.77.192:25959";

  const groupABody = document.getElementById("group-a-body");
  const groupBBody = document.getElementById("group-b-body");
  // CAMBIO: Ahora apunta al contenedor de las tablas (el div.scoreboard-container)
  const scoreboardTablesContainer = document.getElementById(
    "scoreboard-tables-container"
  );
  // Referencia al elemento del mensaje grande con el escudo
  const scoreboardEmptyMessage = document.getElementById(
    "scoreboard-empty-message"
  );

  // Función para renderizar una tabla completa
  const renderTable = (tbodyElement, teams) => {
    if (!tbodyElement) return; // Si el tbody no existe, salir
    tbodyElement.innerHTML = ""; // Limpiar contenido anterior

    // Si no hay equipos en este grupo ESPECÍFICO, mostrar un mensaje dentro de la tabla
    if (teams.length === 0) {
      const row = tbodyElement.insertRow();
      row.innerHTML = `
 <td colspan="5" style="text-align:center; color: var(--text-muted); padding: 20px;">
 Aún no tenemos equipos en este grupo.
 </td>
`;
      return; // Salir, ya se añadió el mensaje
    }

    // Ordenamos los equipos: primero por puntos, luego por juegos ganados (desempate)
    const sortedTeams = teams.sort((a, b) => {
      if (b.stats.points !== a.stats.points) {
        return b.stats.points - a.stats.points;
      }
      return (b.stats.gamesWon || 0) - (a.stats.gamesWon || 0);
    });

    sortedTeams.forEach((team, index) => {
      const row = tbodyElement.insertRow();
      row.className = `position-${index + 1}`; // Clase para estilizar la fila por posición

      // Fragmento HTML para la fila de la tabla
      row.innerHTML = `
 <td data-label="Pos">${index + 1}</td>
 <td data-label="Equipo" title="${team.name}"> <img src="${SERVER_BASE_URL}${
        team.logo // La URL de la imagen correctamente interpolada
      }" class="bracket-team-logo" alt="${team.name}">
 ${team.name} </td>
 <td data-label="PG">${team.stats.gamesWon || 0}</td>
 <td data-label="PP">${team.stats.gamesLost || 0}</td>
 <td data-label="Puntos">${team.stats.points}</td>
 `;
    });
  };

  // Función para controlar la visibilidad del contenedor principal de tablas o el mensaje general
  const toggleMainContentVisibility = (showTables) => {
    if (showTables) {
      scoreboardTablesContainer.classList.remove("hidden"); // Muestra las tablas
      scoreboardEmptyMessage.classList.add("hidden"); // Oculta el mensaje grande
    } else {
      scoreboardTablesContainer.classList.add("hidden"); // Oculta las tablas
      scoreboardEmptyMessage.classList.remove("hidden"); // Muestra el mensaje grande
    }
  };

  // Función principal para obtener los datos y renderizar las tablas
  const fetchAndRenderTables = async () => {
    try {
      const response = await fetch(`${API_URL}/teams`);
      if (!response.ok) {
        // Si la respuesta HTTP no es exitosa (ej. 404, 500)
        throw new Error(
          `Error HTTP: ${response.status} - ${response.statusText}`
        );
      }
      const { teams } = await response.json();

      if (!teams || teams.length === 0) {
        // Caso 1: La API devuelve un array vacío o nulo/indefinido (no hay NINGÚN equipo en la DB)
        toggleMainContentVisibility(false); // Oculta las tablas, muestra el mensaje GRANDE
        // Aseguramos el contenido original del mensaje grande
        scoreboardEmptyMessage.innerHTML = `<i class="fas fa-shield-alt"></i><p>Los equipos contendientes serán revelados próximamente.</p>`;
      } else {
        // Caso 2: La API SÍ devuelve equipos (aunque sea solo uno o estén todos en un solo grupo)
        toggleMainContentVisibility(true); // Asegura que el contenedor de tablas esté visible

        const groupA = teams.filter((team) => team.group === "A");
        const groupB = teams.filter((team) => team.group === "B");

        // Renderizamos cada tabla. renderTable ahora maneja si el grupo específico está vacío.
        renderTable(groupABody, groupA);
        renderTable(groupBBody, groupB);
      }
    } catch (error) {
      console.error("Error al cargar la tabla de puntuación:", error);
      // Caso 3: Fallo completo de la petición a la API (error de red, JSON inválido, etc.)
      toggleMainContentVisibility(false); // Oculta las tablas, muestra el mensaje GRANDE
      // Personaliza el mensaje grande para indicar un error de carga
      scoreboardEmptyMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i><p>Hubo un problema al cargar los equipos. Por favor, inténtalo de nuevo más tarde.</p>`;
    }
  };

  // Ejecutar la función principal al cargar el DOM
  fetchAndRenderTables();

  // Opcional: Actualizar la tabla cada cierto tiempo (descomenta si lo necesitas)
  // setInterval(fetchAndRenderTables, 60000); // Actualiza cada 60 segundos
});

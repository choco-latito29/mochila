document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://216.173.77.192:25959/api";
  const SERVER_BASE_URL = "http://216.173.77.192:25959";

  const scheduleListContainer = document.querySelector(".schedule-list");
  const daySelect = document.getElementById("day-select");
  const stageSelect = document.getElementById("stage-select");
  const groupSelect = document.getElementById("group-select"); // Referencia al div existente en HTML, que contendrá el mensaje
  const noMatchesMessage = document.querySelector(".no-matches-message");

  let allMatches = []; // Función auxiliar para formatear fecha y hora

  const formatMatchDateTime = (isoDateString) => {
    const date = new Date(isoDateString); // La fecha y hora que viene de la DB es UTC. El offset de Perú es -5 horas respecto a UTC. // getTimezoneOffset() devuelve la diferencia en minutos entre UTC y la hora local. // Necesitamos ajustar a la hora de Lima/Perú. // Ya que el servidor parece manejar UTC, y Date() por defecto usa la zona horaria local del cliente. // Para forzar a la hora de Perú (GMT-5), haremos una conversión manual si es necesario, o usaremos Intl.DateTimeFormat // Para mantener la consistencia con el horario de Perú (GMT-5):
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Formato 24 horas
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Lima", // Forzar la zona horaria de Perú
    }; // Usamos Intl.DateTimeFormat para formatear directamente en la zona horaria deseada

    const formatter = new Intl.DateTimeFormat("es-ES", options);
    const parts = formatter.formatToParts(date);

    let time = "";
    let day = "";
    let isoDatePart = ""; // Para el filtro por día // Reconstruir el día y la hora desde las partes formateadas

    const dayMap = {
      monday: "lunes",
      tuesday: "martes",
      wednesday: "miércoles",
      thursday: "jueves",
      friday: "viernes",
      saturday: "sábado",
      sunday: "domingo",
    };

    const monthMap = {
      january: "enero",
      february: "febrero",
      march: "marzo",
      april: "abril",
      may: "mayo",
      june: "junio",
      july: "julio",
      august: "agosto",
      september: "septiembre",
      october: "octubre",
      november: "noviembre",
      december: "diciembre",
    };

    let weekday = "";
    let month = "";
    let dayOfMonth = "";
    let year = "";
    let hour = "";
    let minute = "";

    parts.forEach((part) => {
      if (part.type === "weekday")
        weekday = dayMap[part.value.toLowerCase()] || part.value;
      if (part.type === "day") dayOfMonth = part.value;
      if (part.type === "month")
        month = monthMap[part.value.toLowerCase()] || part.value;
      if (part.type === "year") year = part.value;
      if (part.type === "hour") hour = part.value;
      if (part.type === "minute") minute = part.value;
    });

    day = `${weekday}, ${dayOfMonth} de ${month} de ${year}`;
    time = `${hour}:${minute}`;
    isoDatePart = date.toISOString().split("T")[0]; // Para el filtro (YYYY-MM-DD)

    return { time, day, isoDate: isoDatePart };
  }; // Función para obtener las partidas de la API

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${API_URL}/matches`);
      if (!response.ok) {
        throw new Error(`Error al cargar las partidas: ${response.statusText}`);
      }
      const { matches } = await response.json();

      allMatches = matches
        .filter((match) => !match.isFinished) // Solo mostrar partidas pendientes
        .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate)); // Ordenar por fecha

      renderFilteredMatches();
      populateDayFilter();
    } catch (error) {
      console.error("Error al obtener partidas:", error); // En caso de error al cargar, mostramos el mensaje de error de carga
      if (noMatchesMessage) {
        noMatchesMessage.style.display = "flex"; // Mostrar el mensaje // Actualizar el contenido del mensaje para indicar un error de carga
        noMatchesMessage.querySelector("i").className =
          "fas fa-exclamation-triangle";
        noMatchesMessage.querySelector("i").style.color =
          "var(--primary-red-dark)";
        noMatchesMessage.querySelector("h4").textContent =
          "Error al cargar los horarios de partidas.";
        noMatchesMessage.querySelector("p").textContent =
          "Por favor, inténtalo de nuevo más tarde o verifica tu conexión.";
      }
    }
  }; // Función para poblar el filtro de día

  const populateDayFilter = () => {
    const uniqueDates = new Set();
    allMatches.forEach((match) => {
      const { isoDate, day } = formatMatchDateTime(match.matchDate);
      uniqueDates.add(JSON.stringify({ isoDate, day }));
    });

    daySelect.innerHTML = '<option value="all">Todos los Días</option>';
    const sortedUniqueDates = Array.from(uniqueDates)
      .map(JSON.parse)
      .sort((a, b) => new Date(a.isoDate) - new Date(b.isoDate));

    sortedUniqueDates.forEach((dateObj) => {
      daySelect.innerHTML += `<option value="${dateObj.isoDate}">${dateObj.day}</option>`;
    });
  }; // Función para renderizar las partidas filtradas

  const renderFilteredMatches = () => {
    const selectedDay = daySelect.value;
    const selectedStage = stageSelect.value;
    const selectedGroup = groupSelect.value;

    let filteredMatches = allMatches; // Aplicar filtros

    if (selectedDay !== "all") {
      filteredMatches = filteredMatches.filter(
        (match) => formatMatchDateTime(match.matchDate).isoDate === selectedDay
      );
    }
    if (selectedStage !== "all") {
      if (selectedStage === "group-stage") {
        filteredMatches = filteredMatches.filter((match) => !match.isPlayoff);
      } else if (selectedStage === "playoffs") {
        filteredMatches = filteredMatches.filter(
          (match) =>
            match.isPlayoff &&
            match.playoffRound &&
            match.playoffRound !== "grand-final"
        );
      } else if (selectedStage === "final") {
        filteredMatches = filteredMatches.filter(
          (match) => match.isPlayoff && match.playoffRound === "grand-final"
        );
      }
    }
    if (selectedGroup !== "all") {
      filteredMatches = filteredMatches.filter(
        (match) =>
          !match.isPlayoff &&
          match.group &&
          match.group.toLowerCase() === selectedGroup.replace("group-", "")
      );
    }

    const matchesByDay = {};
    filteredMatches.forEach((match) => {
      const { day, isoDate } = formatMatchDateTime(match.matchDate);
      if (!matchesByDay[isoDate]) {
        matchesByDay[isoDate] = { displayDay: day, matches: [] };
      }
      matchesByDay[isoDate].matches.push(match);
    }); // Limpiar el contenedor principal de partidas antes de renderizar // Dejamos el noMatchesMessage en el DOM, solo controlamos su visibilidad

    Array.from(scheduleListContainer.children).forEach((child) => {
      if (child !== noMatchesMessage) {
        child.remove();
      }
    });

    if (Object.keys(matchesByDay).length === 0) {
      // Si no hay partidas para mostrar después de los filtros
      if (noMatchesMessage) {
        noMatchesMessage.style.display = "flex"; // Muestra el mensaje // Restablece el contenido original si fue modificado por un error de carga
        noMatchesMessage.querySelector("i").className = "fas fa-calendar-times";
        noMatchesMessage.querySelector("i").style.color = ""; // Resetea color
        noMatchesMessage.querySelector("h4").textContent =
          "Aún no hay partidas programadas.";
        noMatchesMessage.querySelector("p").textContent =
          "Consulta más tarde el horario de la Mochila Cup.";
      }
      return;
    } else {
      // Si hay partidas, ocultar el mensaje
      if (noMatchesMessage) {
        noMatchesMessage.style.display = "none";
      }
    } // Renderizar los días y sus partidas

    const sortedDays = Object.keys(matchesByDay).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    sortedDays.forEach((isoDate) => {
      const dayData = matchesByDay[isoDate];
      const dayContainer = document.createElement("div");
      dayContainer.className = "schedule-day";
      dayContainer.id = `day-${isoDate}`;

      const firstMatchInDay = dayData.matches[0];
      const stageInfo = firstMatchInDay.isPlayoff
        ? firstMatchInDay.playoffRound === "grand-final"
          ? "Gran Final"
          : "Fase de Playoffs"
        : "Fase de Grupos";
      dayContainer.innerHTML = `<h3 class="day-header-title">Día: ${dayData.displayDay} (${stageInfo})</h3>`;

      dayData.matches
        .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate))
        .forEach((match) => {
          const { time } = formatMatchDateTime(match.matchDate);
          const stageText = match.isPlayoff
            ? (match.playoffRound ? `${match.playoffRound} - ` : "") +
              (match.playoffRound === "grand-final" ? "Bo5" : "Bo3")
            : `${
                match.group ? `Grupo ${match.group}` : "Fase de Grupos"
              } - Bo2`;

          const team1Name = match.team1
            ? match.team1.name
            : "Equipo Desconocido";
          const team2Name = match.team2
            ? match.team2.name
            : "Equipo Desconocido";
          const team1Logo =
            match.team1 && match.team1.logo
              ? `${SERVER_BASE_URL}${match.team1.logo}`
              : "/Image/default.png";
          const team2Logo =
            match.team2 && match.team2.logo
              ? `${SERVER_BASE_URL}${match.team2.logo}`
              : "/Image/default.png";

          let scoreDisplay = "";
          let matchStatusClass = "";
          if (match.isFinished) {
            scoreDisplay = `<span class="match-score">${match.result.scoreTeam1} - ${match.result.scoreTeam2}</span>`;
            matchStatusClass = "match-finished";
          } else {
            scoreDisplay = `<a href="/Pages/live.html" class="match-stream-link"><i class="fa-brands fa-kickstarter"></i> En Vivo</a>`;
            matchStatusClass = "match-upcoming";
          }

          const matchCard = document.createElement("div");
          matchCard.className = `match-card ${
            match.isPlayoff ? "playoffs-match" : "group-stage-match"
          } ${matchStatusClass} ${
            match.group ? `group-${match.group.toLowerCase()}` : ""
          }`;

          matchCard.innerHTML = `
  <div class="match-details-left">
   <span class="match-time"><i class="far fa-clock"></i> ${time}</span>
   <span class="match-stage">${stageText}</span>
  </div>
  <div class="match-teams">
   <div class="team-info">
    <img src="${team1Logo}" alt="${team1Name}" class="team-logo">
    <span class="team-name">${team1Name}</span>
   </div>
   <span class="vs">vs</span>
   <div class="team-info">
    <img src="${team2Logo}" alt="${team2Name}" class="team-logo">
    <span class="team-name">${team2Name}</span>
   </div>
  </div>
  <div class="match-details-right">
   ${scoreDisplay}
  </div>
`;
          dayContainer.appendChild(matchCard);
        });
      scheduleListContainer.appendChild(dayContainer);
    });
  }; // Event Listeners para los filtros

  daySelect.addEventListener("change", renderFilteredMatches);
  stageSelect.addEventListener("change", renderFilteredMatches);
  groupSelect.addEventListener("change", renderFilteredMatches); // Inicializar: obtener y renderizar partidas

  fetchMatches();
});

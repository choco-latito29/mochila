document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://216.173.77.192:25959/api";
  const SERVER_BASE_URL = "http://216.173.77.192:25959";
  const bracketContainer = document.getElementById("bracket-container");

  if (!bracketContainer) {
    console.error(
      "El contenedor del bracket (#bracket-container) no se encontró."
    );
    return;
  }

  const renderMatch = (matchData) => {
    // Si no hay datos de partida, devuelve un placeholder limpio.
    if (!matchData) {
      return `
            <div class="team-entry"><span class="team-name">Por definir</span></div>
            <div class="team-entry"><span class="team-name">Por definir</span></div>
        `;
    }

    // Extraemos los datos de la partida
    const { team1, team2, result, isFinished, winner } = matchData;
    const score1 = isFinished ? result.scoreTeam1 : "";
    const score2 = isFinished ? result.scoreTeam2 : "";

    // Lógica para asignar clases de ganador y perdedor
    let class1 = "";
    let class2 = "";
    if (isFinished && winner) {
      // --- LÍNEA CORREGIDA ---
      // Comparamos el ID del objeto ganador con el ID de cada equipo
      if (winner._id === team1?._id) {
        class1 = "winner";
        class2 = "loser";
      } else if (winner._id === team2?._id) {
        class2 = "winner";
        class1 = "loser";
      }
    }

    // Construcción del HTML para cada equipo
    const team1HTML = team1
      ? `<img src="${SERVER_BASE_URL}${team1.logo}" class="bracket-team-logo" alt=""> ${team1.name}`
      : "Por definir";
    const team2HTML = team2
      ? `<img src="${SERVER_BASE_URL}${team2.logo}" class="bracket-team-logo" alt=""> ${team2.name}`
      : "Por definir";

    // Devolvemos el HTML final para la caja del match
    return `
        <div class="team-entry ${class1}">
            <span class="team-name">${team1HTML}</span>
            <span class="score">${score1}</span>
        </div>
        <div class="team-entry ${class2}">
            <span class="team-name">${team2HTML}</span>
            <span class="score">${score2}</span>
        </div>
    `;
  };

  const fetchAndDisplayBracket = async () => {
    try {
      const response = await fetch(`${API_URL}/matches`);
      if (!response.ok) throw new Error("No se pudieron cargar las partidas.");
      const { matches } = await response.json();
      const playoffMatches = matches.filter(
        (m) => m.isPlayoff && m.playoffRound
      );
      const matchesByRoundId = playoffMatches.reduce((acc, match) => {
        acc[match.playoffRound] = match;
        return acc;
      }, {});

      bracketContainer.innerHTML = "";

      // Contenedor principal para Upper y Lower
      const mainBracket = document.createElement("div");
      mainBracket.className = "main-bracket";

      // Estructura de rondas
      const upperRounds = [
        {
          title: "Upper Bracket - Cuartos",
          ids: ["ub-qf-1", "ub-qf-2", "ub-qf-3", "ub-qf-4"],
        },
        { title: "Upper Bracket - Semis", ids: ["ub-sf-1", "ub-sf-2"] },
        { title: "Upper Bracket - Final", ids: ["ub-final"] },
      ];
      const lowerRounds = [
        { title: "Lower Bracket - Ronda 1", ids: ["lb-r1-1", "lb-r1-2"] },
        { title: "Lower Bracket - Cuartos", ids: ["lb-qf-1", "lb-qf-2"] },
        { title: "Lower Bracket - Semifinal", ids: ["lb-sf-1"] },
        { title: "Lower Bracket - Final", ids: ["lb-final"] },
      ];

      // Función para dibujar una rama (Upper o Lower)
      const createBranchHTML = (roundsData, isLower) => {
        const branchDiv = document.createElement("div");
        branchDiv.className = "bracket-branch";

        roundsData.forEach((roundInfo) => {
          const roundDiv = document.createElement("div");
          roundDiv.className = "bracket-round";
          roundDiv.innerHTML = `<h3 class="round-title ${
            isLower ? "lower-title" : ""
          }">${roundInfo.title}</h3>`;

          const matchList = document.createElement("div");
          matchList.className = "match-list";
          roundInfo.ids.forEach((matchId) => {
            const matchDiv = document.createElement("div");
            matchDiv.className = "match-item";
            matchDiv.innerHTML = renderMatch(matchesByRoundId[matchId]);
            matchList.appendChild(matchDiv);
          });

          roundDiv.appendChild(matchList);
          branchDiv.appendChild(roundDiv);
        });
        return branchDiv;
      };

      const upperBranchEl = createBranchHTML(upperRounds, false);
      const lowerBranchEl = createBranchHTML(lowerRounds, true);
      mainBracket.append(upperBranchEl, lowerBranchEl);

      const finalCol = document.createElement("div");
      finalCol.className = "bracket-round grand-final-col";
      finalCol.innerHTML = `<h3 class="round-title grand-final-title">Gran Final</h3>`;
      const finalMatch = document.createElement("div");
      finalMatch.className = "match-item final";
      finalMatch.innerHTML = renderMatch(matchesByRoundId["grand-final"]);
      finalCol.appendChild(finalMatch);

      bracketContainer.append(mainBracket, finalCol);
    } catch (error) {
      console.error("Error al cargar el bracket:", error);
      bracketContainer.innerHTML = `<div class="info-message">Error al cargar el bracket.</div>`;
    }
  };

  fetchAndDisplayBracket();
});

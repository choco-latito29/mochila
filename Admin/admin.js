// Usamos un IIFE (Immediately Invoked Function Expression) para encapsular todo el código
// y no contaminar el scope global. Es una buena práctica.
(function () {
  // =================================================================
  // --- 1. CONFIGURACIÓN Y ESTADO GLOBAL ---
  // =================================================================
  const config = {
    API_URL: "http://216.173.77.192:25959/api",
    SERVER_BASE_URL: "http://216.173.77.192:25959", // <-- ¡AÑADE ESTA LÍNEA!
  };

  const state = {
    teams: [],
    matches: [],
    news: [],
    casters: [],
    currentCasterSocials: {},
    users: [],
    sanctions: [],
    logs: [],
    currentUser: null,
    selectedTeamId: null,
    editingNewsId: null,
    editingUserId: null,
    editingCasterId: null, // Add this for tracking the caster being edited
  };

  // =================================================================
  // --- 2. ELEMENTOS DEL DOM (CENTRALIZADOS) ---
  // =================================================================
  const dom = {
    createTeamForm: document.getElementById("create-team-form"),
    editTeamForm: document.getElementById("edit-team-form"),
    createMatchForm: document.getElementById("create-match-form"),
    updateScoreForm: document.getElementById("update-score-form"),
    newsForm: document.getElementById("news-form"),
    casterForm: document.getElementById("caster-form"),

    // ELEMENTOS DE REDES SOCIALES DEL CASTER (IDs ACTUALIZADOS)
    addSocialButton: document.getElementById("add-social-button"), // ID CORREGIDO EN HTML
    socialPlatformSelect: document.getElementById("social-platform-select"), // ID CORREGIDO EN HTML
    socialUrlInput: document.getElementById("social-url-input"), // ID CORREGIDO EN HTML
    otherPlatformInputGroup: document.getElementById(
      "other-platform-input-group"
    ), // Nuevo grupo para "Otro"
    otherPlatformNameInput: document.getElementById("other-platform-name"), // Nuevo input para nombre "Otro"
    socialsListContainer: document.getElementById("socials-list-container"), // ID CORREGIDO EN HTML

    createUserForm: document.getElementById("create-user-form"),
    sanctionForm: document.getElementById("sanction-form"),
    masterTeamSelect: document.getElementById("master-team-select"),
    manualTeam1Select: document.getElementById("manual-team1-select"),
    manualTeam2Select: document.getElementById("manual-team2-select"),
    matchSelect: document.getElementById("match-select"),
    sanctionTeamSelect: document.getElementById("sanction-team-select"),
    matchDetailsContainer: document.getElementById("match-details"),
    editFieldsContainer: document.getElementById("edit-fields-container"),
    membersListContainer: document.getElementById("members-list-container"),
    newsListContainer: document.getElementById("news-list-container"),
    castersListContainer: document.getElementById("casters-list-container"),
    usersListContainer: document.getElementById("users-list-container"),
    sanctionsListContainer: document.getElementById("sanctions-list-container"),
    logsListContainer: document.getElementById("logs-list-container"),
    deleteTeamButton: document.getElementById("delete-team-button"),
    addMemberButton: document.getElementById("add-member-button"),
    newsFormCancelButton: document.getElementById("news-form-cancel"),
    isPlayoffCheckbox: document.getElementById("is-playoff-checkbox"),
    playoffRoundGroup: document.getElementById("playoff-round-group"),
    casterFormCancelButton: document.getElementById("caster-form-cancel"), // Asumiendo este ID
  };

  // =================================================================
  // --- 3. UTILIDADES Y FUNCIONES COMPARTIDAS ---
  // =================================================================
  const utils = {
    showMessage(message, type = "success") {
      const modal = document.getElementById("notificationModal");
      if (!modal) return;
      const modalContent = modal.querySelector(".modal-content");
      const modalIcon = document.getElementById("modalIcon");
      const modalMessage = document.getElementById("modalMessage");

      modalMessage.textContent = message;
      modalContent.className = "modal-content " + type;
      modalIcon.className = `fas modal-icon ${
        type === "success" ? "fa-check-circle" : "fa-times-circle"
      }`;
      modal.classList.add("show");
      setTimeout(() => modal.classList.remove("show"), 2500);
    },
    showConfirmationModal(message) {
      return new Promise((resolve) => {
        const modal = document.getElementById("confirmationModal");
        if (!modal) return resolve(false);
        const messageEl = document.getElementById("confirmationMessage");
        const confirmBtn = document.getElementById("confirmBtn");
        const cancelBtn = document.getElementById("cancelBtn");

        messageEl.textContent = message;
        modal.classList.add("show");

        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        const close = (confirmation) => {
          modal.classList.remove("show");
          resolve(confirmation);
        };

        newConfirmBtn.onclick = () => close(true);
        newCancelBtn.onclick = () => close(false);
      });
    },
    decodeToken(token) {
      try {
        return JSON.parse(atob(token.split(".")[1]));
      } catch (e) {
        return null;
      }
    },
    fetchWithAuth(url, options = {}) {
      const token = localStorage.getItem("authToken");
      const headers = { ...options.headers, Authorization: `Bearer ${token}` };
      if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }
      return fetch(url, { ...options, headers });
    },
    setButtonLoading: (button, isLoading) => {
      if (!button) return;
      if (isLoading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando...`;
      } else {
        button.disabled = false;
        if (button.dataset.originalHtml) {
          button.innerHTML = button.dataset.originalHtml;
        }
      }
    },
  };

  // =================================================================
  // --- 4. RENDERIZADO DE COMPONENTES ---
  // =================================================================
  const render = {
    list: (container, items, renderItem) => {
      if (!container) return;
      container.innerHTML = "";
      if (items.length === 0) {
        container.innerHTML = "<p>No hay elementos para mostrar.</p>";
        return;
      }
      items.forEach((item) => container.appendChild(renderItem(item)));
    },
    news: () => {
      render.list(dom.newsListContainer, state.news, (item) => {
        const el = document.createElement("div");
        el.className = "admin-list-item";
        el.innerHTML = `
          <div class="admin-list-item-content">
            <h5>${item.title}</h5>
            <p>Publicado por: <strong>${
              item.author || "Desconocido"
            }</strong> el ${new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
          <div class="admin-list-item-actions">
            <button class="edit-btn" data-id="${
              item._id
            }" title="Editar Anuncio"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" data-id="${
              item._id
            }" title="Eliminar Anuncio"><i class="fas fa-trash"></i></button>
          </div>
        `;
        return el;
      });
    },
    casters: () => {
      render.list(dom.castersListContainer, state.casters, (item) => {
        const el = document.createElement("div");
        el.className = "admin-list-item";
        const photoHtml = item.photo
          ? // CAMBIO: Usamos SERVER_BASE_URL para la ruta completa
            `<img src="${config.SERVER_BASE_URL}${item.photo}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%; margin-right: 10px;">`
          : "";

        let socialsHtml = "<p>Sin redes sociales.</p>";
        if (item.socials && Object.keys(item.socials).length > 0) {
          socialsHtml =
            "<p>Redes: " +
            Object.entries(item.socials)
              .map(
                ([platform, url]) =>
                  // Capitalizar la primera letra de la plataforma para mostrar
                  `<a href="${url}" target="_blank">${
                    platform.charAt(0).toUpperCase() + platform.slice(1)
                  }</a>`
              )
              .join(", ") +
            "</p>";
        }

        el.innerHTML = `
          <div class="admin-list-item-content" style="display: flex; align-items: center;">
            ${photoHtml}
            <div>
              <h5>${item.name}</h5>
              <p>Descripción: ${item.description || "No especificada"}</p>
              ${socialsHtml}
            </div>
          </div>
          <div class="admin-list-item-actions">
            <button class="edit-btn" data-id="${
              item._id
            }" title="Editar Caster"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" data-id="${
              item._id
            }" title="Eliminar Caster"><i class="fas fa-trash"></i></button>
          </div>
        `;
        return el;
      });
    },
    users: () => {
      render.list(dom.usersListContainer, state.users, (item) => {
        const el = document.createElement("div");
        el.className = "admin-list-item";
        const isCurrentUser = item._id === state.currentUser.id;
        const deleteButtonDisabled = isCurrentUser
          ? 'disabled title="No puedes eliminar tu propia cuenta"'
          : 'title="Eliminar Usuario"';
        el.innerHTML = `
          <div class="admin-list-item-content">
            <h5>${item.email} ${isCurrentUser ? "(Tú)" : ""}</h5>
            <p>Roles: ${item.roles.join(", ")}</p>
          </div>
          <div class="admin-list-item-actions">
            <button class="edit-user-btn" data-id="${
              item._id
            }" title="Editar Usuario"><i class="fas fa-edit"></i></button>
            <button class="delete-user-btn" data-id="${
              item._id
            }" ${deleteButtonDisabled}><i class="fas fa-trash"></i></button>
          </div>
        `;
        return el;
      });
    },
    sanctions: () => {
      render.list(dom.sanctionsListContainer, state.sanctions, (item) => {
        const el = document.createElement("div");
        el.className = "admin-list-item";
        el.innerHTML = `
          <div class="admin-list-item-content">
            <h5>${item.team ? item.team.name : "Equipo no encontrado"}</h5>
            <p>${item.reason} - <strong>Penalización:</strong> ${
          item.penalty
        }</p>
          </div>
          <div class="admin-list-item-actions">
            <button class="delete-btn" data-id="${
              item._id
            }" title="Eliminar Sanción"><i class="fas fa-trash"></i></button>
          </div>
        `;
        return el;
      });
    },
    logs: () => {
      render.list(dom.logsListContainer, state.logs, (item) => {
        const el = document.createElement("div");
        el.className = "admin-list-item";
        const rolesString = item.roles
          .map((r) => r.charAt(0).toUpperCase() + r.slice(1))
          .join(", ");
        el.innerHTML = `
          <div class="admin-list-item-content log-item-content">
            <p class="log-detail log-user">
              <i class="fas fa-user-shield log-icon"></i>
              <strong>Responsable:</strong> ${
                item.user
              } <span class="log-role">(${rolesString})</span>
            </p>
            <p class="log-detail">
              <i class="fas fa-bolt log-icon"></i>
              <strong>Acción:</strong> ${item.action}
            </p>
            <p class="log-detail">
              <i class="fas fa-info-circle log-icon"></i>
              <strong>Detalles:</strong> ${item.details}
            </p>
            <p class="log-date">${new Date(item.createdAt).toLocaleString(
              "es-ES"
            )}</p>
          </div>
        `;
        return el;
      });
    },
    teamMembers: (team) => {
      if (!dom.membersListContainer) return;
      dom.membersListContainer.innerHTML = "";
      if (!team.members || team.members.length === 0) {
        dom.membersListContainer.innerHTML =
          "<p>Este equipo no tiene miembros registrados.</p>";
        return;
      }
      team.members.forEach((member) => {
        const el = document.createElement("div");
        el.className = "member-item";
        el.innerHTML = `<span class="member-item-info">${member.name}<span class="role">${member.role}</span></span><button class="delete-member-btn" data-member-name="${member.name}"><i class="fas fa-trash"></i></button>`;
        dom.membersListContainer.appendChild(el);
      });
    },
    allTeamSelects: () => {
      const selects = [
        dom.masterTeamSelect,
        dom.manualTeam1Select,
        dom.manualTeam2Select,
        dom.sanctionTeamSelect,
      ];
      selects.forEach((select) => {
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML =
          '<option value="" disabled>Selecciona un equipo...</option>';
        state.teams.forEach((team) =>
          select.add(new Option(team.name, team._id))
        );
        select.value = currentVal;
      });
      if (dom.masterTeamSelect) dom.masterTeamSelect.value = "";
    },
    pendingMatches: () => {
      if (!dom.matchSelect) return;
      dom.matchSelect.innerHTML =
        '<option value="" disabled selected>Selecciona una partida...</option>';
      const pendingMatches = state.matches.filter(
        (m) => !m.isFinished && m.team1 && m.team2
      );
      pendingMatches.forEach((match) => {
        dom.matchSelect.add(
          new Option(`${match.team1.name} vs ${match.team2.name}`, match._id)
        );
      });
    },

    // Nueva función para renderizar las redes sociales en el formulario del caster
    renderCasterSocialsInForm: () => {
      if (!dom.socialsListContainer) return;
      dom.socialsListContainer.innerHTML = "";
      if (Object.keys(state.currentCasterSocials).length === 0) {
        // Comprobar si el objeto está vacío
        dom.socialsListContainer.innerHTML =
          "<p>No se han añadido redes sociales.</p>";
        return;
      }
      // Iterar sobre pares clave-valor (plataforma: url) para el esquema Map
      Object.entries(state.currentCasterSocials).forEach(([platform, url]) => {
        const el = document.createElement("div");
        el.className = "social-item"; // Aplica estilos CSS para este item
        // Capitalizar la primera letra para la visualización
        const displayPlatformName =
          platform.charAt(0).toUpperCase() + platform.slice(1);
        el.innerHTML = `
                <span>${displayPlatformName}: <a href="${url}" target="_blank">${url}</a></span>
                <button type="button" class="delete-social-btn" data-platform="${platform}"><i class="fas fa-times"></i></button>
            `;
        dom.socialsListContainer.appendChild(el);
      });
    },
  };

  // =================================================================
  // --- 5. MÓDULOS DE FUNCIONALIDAD (CON CORRECCIONES) ---
  // =================================================================
  const featureModules = {
    initNews() {
      if (dom.newsForm)
        dom.newsForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const button = e.submitter;
          utils.setButtonLoading(button, true);
          try {
            const formData = new FormData(dom.newsForm);
            const url = state.editingNewsId
              ? `${config.API_URL}/news/${state.editingNewsId}`
              : `${config.API_URL}/news`;
            const method = state.editingNewsId ? "PUT" : "POST";
            const response = await utils.fetchWithAuth(url, {
              method,
              body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            utils.showMessage(
              `Anuncio ${
                state.editingNewsId ? "actualizado" : "creado"
              } con éxito.`
            );
            dom.newsForm.reset();
            state.editingNewsId = null;
            document.getElementById("news-form-button-text").textContent =
              "Guardar Anuncio";
            if (dom.newsFormCancelButton)
              dom.newsFormCancelButton.classList.add("hidden");
            App.fetchAllData();
          } catch (error) {
            utils.showMessage(error.message, "error");
          } finally {
            utils.setButtonLoading(button, false);
          }
        });
      if (dom.newsListContainer)
        dom.newsListContainer.addEventListener("click", async (e) => {
          console.log(
            "Evento de clic disparado en newsListContainer:",
            e.target
          ); // <-- Nueva línea
          const editBtn = e.target.closest(".edit-btn");
          const deleteBtn = e.target.closest(".delete-btn");
          console.log("deleteBtn encontrado:", deleteBtn); //
          if (editBtn) {
            const id = editBtn.dataset.id;
            const newsItem = state.news.find((n) => n._id === id);
            if (newsItem) {
              state.editingNewsId = id;
              document.getElementById("news-title").value = newsItem.title;
              document.getElementById("news-content").value = newsItem.content;
              document.getElementById("news-form-button-text").textContent =
                "Actualizar Anuncio";
              if (dom.newsFormCancelButton)
                dom.newsFormCancelButton.classList.remove("hidden");
              dom.newsForm.scrollIntoView({ behavior: "smooth" });
            }
          }
          if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            console.log("Botón de eliminar clicado, ID:", id); // <-- Nueva línea
            const confirmed = await utils.showConfirmationModal(
              "¿Estás seguro de que quieres eliminar este anuncio?"
            );
            if (confirmed) {
              try {
                const response = await utils.fetchWithAuth(
                  `${config.API_URL}/news/${id}`,
                  { method: "DELETE" }
                );
                if (!response.ok)
                  throw new Error((await response.json()).message);
                utils.showMessage("Anuncio eliminado.");
                App.fetchAllData();
              } catch (error) {
                utils.showMessage(error.message, "error");
              }
            }
          }
        });
      if (dom.newsFormCancelButton)
        dom.newsFormCancelButton.addEventListener("click", () => {
          state.editingNewsId = null;
          dom.newsForm.reset();
          document.getElementById("news-form-button-text").textContent =
            "Guardar Anuncio";
          dom.newsFormCancelButton.classList.add("hidden");
        });
    },
    initMatches() {
      if (dom.isPlayoffCheckbox && dom.playoffRoundGroup) {
        dom.isPlayoffCheckbox.addEventListener("change", (e) => {
          dom.playoffRoundGroup.style.display = e.target.checked
            ? "block"
            : "none";
        });
      }

      if (dom.createMatchForm)
        dom.createMatchForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const button = e.submitter;
          utils.setButtonLoading(button, true);
          try {
            const data = Object.fromEntries(
              new FormData(dom.createMatchForm).entries()
            );
            if (data.team1 === data.team2)
              return utils.showMessage(
                "Un equipo no puede jugar contra sí mismo.",
                "error"
              );
            data.group = (
              state.teams.find((t) => t._id === data.team1) || {}
            ).group;
            const response = await utils.fetchWithAuth(
              `${config.API_URL}/matches`,
              { method: "POST", body: JSON.stringify(data) }
            );
            if (!response.ok) throw new Error((await response.json()).message);
            utils.showMessage("Partida programada exitosamente.");
            dom.createMatchForm.reset();
            dom.playoffRoundGroup.style.display = "none";
            await App.fetchAllData();
          } catch (error) {
            utils.showMessage(error.message, "error");
          } finally {
            utils.setButtonLoading(button, false);
          }
        });
      if (dom.updateScoreForm)
        dom.updateScoreForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const button = e.submitter;
          utils.setButtonLoading(button, true);
          try {
            const matchId = dom.matchSelect.value;
            const data = {
              scoreTeam1: document.getElementById("team1-score").value,
              scoreTeam2: document.getElementById("team2-score").value,
            };
            const response = await utils.fetchWithAuth(
              `${config.API_URL}/matches/${matchId}/score`,
              { method: "PUT", body: JSON.stringify(data) }
            );
            if (!response.ok) throw new Error((await response.json()).message);
            utils.showMessage(
              "Resultado guardado y estadísticas actualizadas."
            );
            dom.updateScoreForm.reset();
            dom.matchDetailsContainer.classList.add("hidden");
            await App.fetchAllData();
          } catch (error) {
            utils.showMessage(error.message, "error");
          } finally {
            utils.setButtonLoading(button, false);
          }
        });
      if (dom.matchSelect)
        dom.matchSelect.addEventListener("change", () => {
          if (dom.matchSelect.value) {
            const match = state.matches.find(
              (m) => m._id === dom.matchSelect.value
            );
            if (match && match.team1 && match.team2) {
              document.getElementById("match-team1-label").textContent =
                match.team1.name;
              document.getElementById("match-team2-label").textContent =
                match.team2.name;
              dom.matchDetailsContainer.classList.remove("hidden");
            }
          } else {
            dom.matchDetailsContainer.classList.add("hidden");
          }
        });
    },
    initTeams() {
      if (dom.createTeamForm)
        dom.createTeamForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const button = e.submitter;
          utils.setButtonLoading(button, true);
          try {
            const response = await utils.fetchWithAuth(
              `${config.API_URL}/teams`,
              { method: "POST", body: new FormData(dom.createTeamForm) }
            );
            if (!response.ok) throw new Error((await response.json()).message);
            utils.showMessage("¡Equipo creado exitosamente!");
            dom.createTeamForm.reset();
            await App.fetchAllData();
          } catch (error) {
            utils.showMessage(error.message, "error");
          } finally {
            utils.setButtonLoading(button, false);
          }
        });
      if (dom.editTeamForm)
        dom.editTeamForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!state.selectedTeamId) return;
          const button = e.submitter;
          utils.setButtonLoading(button, true);
          try {
            const response = await utils.fetchWithAuth(
              `${config.API_URL}/teams/${state.selectedTeamId}`,
              { method: "PUT", body: new FormData(dom.editTeamForm) }
            );
            if (!response.ok) throw new Error((await response.json()).message);
            utils.showMessage("¡Equipo actualizado exitosamente!");
            await App.fetchAllData();
            if (dom.masterTeamSelect)
              dom.masterTeamSelect.value = state.selectedTeamId;
          } catch (error) {
            utils.showMessage(error.message, "error");
          } finally {
            utils.setButtonLoading(button, false);
          }
        });
      if (dom.masterTeamSelect)
        dom.masterTeamSelect.addEventListener("change", () => {
          state.selectedTeamId = dom.masterTeamSelect.value;
          if (!state.selectedTeamId) {
            if (dom.editFieldsContainer)
              dom.editFieldsContainer.classList.add("hidden");
            return;
          }
          const team = state.teams.find((t) => t._id === state.selectedTeamId);
          if (team) {
            document.getElementById("edit-team-name").value = team.name;
            document.getElementById("edit-team-motto").value = team.motto;
            document.getElementById("edit-team-group").value = team.group;
            render.teamMembers(team);
            if (dom.editFieldsContainer)
              dom.editFieldsContainer.classList.remove("hidden");
          }
        });
      if (dom.deleteTeamButton)
        dom.deleteTeamButton.addEventListener("click", async () => {
          if (!state.selectedTeamId)
            return utils.showMessage(
              "Por favor, selecciona un equipo primero.",
              "error"
            );
          const team = state.teams.find((t) => t._id === state.selectedTeamId);
          const confirmed = await utils.showConfirmationModal(
            `¿Estás seguro de que quieres eliminar al equipo "${team.name}"?`
          );
          if (confirmed) {
            try {
              const response = await utils.fetchWithAuth(
                `${config.API_URL}/teams/${state.selectedTeamId}`,
                { method: "DELETE" }
              );
              if (!response.ok)
                throw new Error((await response.json()).message);
              utils.showMessage("Equipo eliminado exitosamente.");
              if (dom.editFieldsContainer)
                dom.editFieldsContainer.classList.add("hidden");
              await App.fetchAllData();
            } catch (error) {
              utils.showMessage(error.message, "error");
            }
          }
        });
      if (dom.addMemberButton)
        dom.addMemberButton.addEventListener("click", async () => {
          if (!state.selectedTeamId) return;
          const nameInput = document.getElementById("add-member-name");
          const roleInput = document.getElementById("add-member-role");
          const name = nameInput.value.trim();
          if (!name)
            return utils.showMessage(
              "El nombre del miembro es obligatorio.",
              "error"
            );
          const team = state.teams.find((t) => t._id === state.selectedTeamId);
          const updatedMembers = [
            ...team.members,
            { name, role: roleInput.value },
          ];
          try {
            const response = await utils.fetchWithAuth(
              `${config.API_URL}/teams/${state.selectedTeamId}`,
              {
                method: "PUT",
                body: JSON.stringify({ members: updatedMembers }),
              }
            );
            if (!response.ok) throw new Error((await response.json()).message);
            utils.showMessage("Miembro añadido con éxito.");
            nameInput.value = "";
            await App.fetchAllData();
            if (dom.masterTeamSelect) {
              dom.masterTeamSelect.value = state.selectedTeamId;
              dom.masterTeamSelect.dispatchEvent(new Event("change"));
            }
          } catch (error) {
            utils.showMessage(error.message, "error");
          }
        });
      if (dom.membersListContainer)
        dom.membersListContainer.addEventListener("click", async (e) => {
          const deleteBtn = e.target.closest(".delete-member-btn");
          if (deleteBtn) {
            if (!state.selectedTeamId) return;
            const memberName = deleteBtn.dataset.memberName;
            const confirmed = await utils.showConfirmationModal(
              `¿Estás seguro de que quieres eliminar a ${memberName}?`
            );
            if (confirmed) {
              const team = state.teams.find(
                (t) => t._id === state.selectedTeamId
              );
              const updatedMembers = team.members.filter(
                (m) => m.name !== memberName
              );
              try {
                const response = await utils.fetchWithAuth(
                  `${config.API_URL}/teams/${state.selectedTeamId}`,
                  {
                    method: "PUT",
                    body: JSON.stringify({ members: updatedMembers }),
                  }
                );
                if (!response.ok)
                  throw new Error((await response.json()).message);
                utils.showMessage("Miembro eliminado con éxito.");
                await App.fetchAllData();
                if (dom.masterTeamSelect) {
                  dom.masterTeamSelect.value = state.selectedTeamId;
                  dom.masterTeamSelect.dispatchEvent(new Event("change"));
                }
              } catch (error) {
                utils.showMessage(error.message, "error");
              }
            }
          }
        });
    },
    initSanctions() {
      if (dom.sanctionForm)
        dom.sanctionForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const button = e.submitter;
          utils.setButtonLoading(button, true);
          try {
            const data = Object.fromEntries(
              new FormData(dom.sanctionForm).entries()
            );
            const response = await utils.fetchWithAuth(
              `${config.API_URL}/sanctions`,
              { method: "POST", body: JSON.stringify(data) }
            );
            if (!response.ok) throw new Error((await response.json()).message);
            utils.showMessage("Sanción aplicada con éxito.");
            dom.sanctionForm.reset();
            await App.fetchAllData();
          } catch (error) {
            utils.showMessage(error.message, "error");
          } finally {
            utils.setButtonLoading(button, false);
          }
        });
      if (dom.sanctionsListContainer)
        dom.sanctionsListContainer.addEventListener("click", async (e) => {
          const deleteBtn = e.target.closest(".delete-btn");
          if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            const confirmed = await utils.showConfirmationModal(
              "¿Seguro que quieres eliminar esta sanción?"
            );
            if (confirmed) {
              try {
                const response = await utils.fetchWithAuth(
                  `${config.API_URL}/sanctions/${id}`,
                  { method: "DELETE" }
                );
                if (!response.ok)
                  throw new Error((await response.json()).message);
                utils.showMessage("Sanción eliminada.");
                App.fetchAllData();
              } catch (error) {
                utils.showMessage(error.message, "error");
              }
            }
          }
        });
    },
    // INICIO DE featureModules.initCasters() (Versión CORREGIDA FINAL Y COMPLETA)
    initCasters() {
      if (!dom.casterForm) return; // Alternar visibilidad del input 'Otro'

      if (dom.socialPlatformSelect && dom.otherPlatformInputGroup) {
        dom.socialPlatformSelect.addEventListener("change", () => {
          if (dom.socialPlatformSelect.value === "other") {
            dom.otherPlatformInputGroup.classList.remove("hidden");
            dom.otherPlatformNameInput.setAttribute("required", "true");
          } else {
            dom.otherPlatformInputGroup.classList.add("hidden");
            dom.otherPlatformNameInput.removeAttribute("required");
            dom.otherPlatformNameInput.value = ""; // Limpiar input cuando se oculta
          }
        });
      } // Event listener para el botón "Añadir Red"

      if (dom.addSocialButton) {
        dom.addSocialButton.addEventListener("click", () => {
          let platform = dom.socialPlatformSelect.value; // Obtener valor del select
          const url = dom.socialUrlInput.value.trim(); // Validar si la plataforma es "Otro" y obtener el nombre del input adicional

          if (platform === "other") {
            platform = dom.otherPlatformNameInput.value.trim().toLowerCase(); // Usar input de "Otro" y convertir a minúsculas
            if (!platform) {
              utils.showMessage(
                "Debes especificar el nombre de la plataforma 'Otro'.",
                "error"
              );
              return;
            }
          }

          if (!platform || !url) {
            utils.showMessage(
              "La plataforma y la URL son obligatorios.",
              "error"
            );
            return;
          } // Validación básica de URL

          try {
            new URL(url);
          } catch (_) {
            utils.showMessage(
              "La URL no es válida. Asegúrate de incluir http:// o https://",
              "error"
            );
            return;
          } // Verificar si ya existe una red social con esa plataforma (clave)

          if (state.currentCasterSocials[platform]) {
            utils.showMessage(
              `Ya existe una red social para "${
                platform.charAt(0).toUpperCase() + platform.slice(1)
              }". Edítala o elimina la existente.`,
              "error"
            );
            return;
          }

          state.currentCasterSocials[platform] = url; // Almacenar como par clave-valor (Map)
          render.renderCasterSocialsInForm(); // Actualizar la interfaz de usuario // Resetear campos del formulario

          dom.socialPlatformSelect.value = ""; // Resetear select
          dom.socialUrlInput.value = ""; // Limpiar URL
          dom.otherPlatformNameInput.value = ""; // Limpiar input "Otro"
          dom.otherPlatformInputGroup.classList.add("hidden"); // Ocultar input "Otro"
          dom.socialPlatformSelect.focus(); // Mantener el foco en el select
        });
      } // Event listener para eliminar items de redes sociales de la lista

      if (dom.socialsListContainer) {
        dom.socialsListContainer.addEventListener("click", (e) => {
          const deleteBtn = e.target.closest(".delete-social-btn");
          if (deleteBtn) {
            const platformToDelete = deleteBtn.dataset.platform; // Obtener la plataforma del atributo data-
            delete state.currentCasterSocials[platformToDelete]; // Eliminar del objeto (Map)
            render.renderCasterSocialsInForm(); // Volver a renderizar la lista
          }
        });
      } // Manejador de envío del formulario del caster

      if (dom.casterForm) {
        dom.casterForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const button = e.submitter;
          utils.setButtonLoading(button, true);
          try {
            // Solo aplicar esta condición si estamos creando un NUEVO caster (no editando uno existente)
            if (!state.editingCasterId && state.casters.length >= 6) {
              utils.showMessage(
                "No se pueden añadir más de 6 casters. Por favor, elimina uno existente para añadir uno nuevo.",
                "error"
              );
              return; // Detiene la ejecución del resto de la función
            }

            const formData = new FormData(dom.casterForm); // Adjuntar las redes sociales como una cadena JSON al FormData
            formData.append(
              "socials",
              JSON.stringify(state.currentCasterSocials)
            );

            const url = state.editingCasterId // Determinar si es POST (crear) o PUT (actualizar)
              ? `${config.API_URL}/casters/${state.editingCasterId}`
              : `${config.API_URL}/casters`;
            const method = state.editingCasterId ? "PUT" : "POST";

            const response = await utils.fetchWithAuth(url, {
              method,
              body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            utils.showMessage(
              `Caster ${
                state.editingCasterId ? "actualizado" : "añadido"
              } con éxito.`
            ); // Resetear el formulario y el estado de redes sociales
            dom.casterForm.reset();
            state.currentCasterSocials = {}; // Resetear a objeto vacío
            render.renderCasterSocialsInForm(); // Actualizar UI para mostrar redes sociales vacías
            state.editingCasterId = null; // Limpiar estado de edición // Restablecer texto del botón de enviar

            const casterFormButtonTextElement = document.getElementById(
              "caster-form-button-text"
            );
            if (casterFormButtonTextElement) {
              casterFormButtonTextElement.textContent = "Guardar Caster";
            } else {
              console.warn(
                "Advertencia: Elemento 'caster-form-button-text' no encontrado al enviar formulario. No se pudo restablecer el texto del botón."
              );
            }

            if (dom.casterFormCancelButton) {
              dom.casterFormCancelButton.classList.add("hidden");
            }
            if (dom.otherPlatformInputGroup)
              dom.otherPlatformInputGroup.classList.add("hidden"); // Ocultar input "Otro"

            App.fetchAllData(); // Volver a cargar todos los datos para actualizar las listas
          } catch (error) {
            utils.showMessage(error.message, "error");
          } finally {
            utils.setButtonLoading(button, false);
          }
        });
      } // Listener para los botones de editar y eliminar en la lista de casters

      if (dom.castersListContainer) {
        dom.castersListContainer.addEventListener("click", async (e) => {
          const editBtn = e.target.closest(".edit-btn");
          const deleteBtn = e.target.closest(".delete-btn");

          if (editBtn) {
            const id = editBtn.dataset.id;
            const casterItem = state.casters.find((c) => c._id === id);
            if (casterItem) {
              state.editingCasterId = id; // Establecer el ID del caster que se está editando
              document.getElementById("caster-name").value = casterItem.name;
              document.getElementById("caster-description").value =
                casterItem.description; // Limpiar el input de archivo por seguridad

              document.getElementById("caster-photo").value = ""; // Considera si necesitas una previsualización de la foto existente aquí // Cargar redes sociales para edición
              state.currentCasterSocials = casterItem.socials || {};
              render.renderCasterSocialsInForm(); // Renderizar redes sociales existentes en el formulario // Cambiar texto del botón de enviar

              const casterFormButtonTextElement = document.getElementById(
                "caster-form-button-text"
              );
              if (casterFormButtonTextElement) {
                // Comprobación de existencia
                casterFormButtonTextElement.textContent = "Actualizar Caster";
              } else {
                console.warn(
                  "Advertencia: Elemento 'caster-form-button-text' no encontrado al editar. No se pudo actualizar el texto del botón."
                );
              }

              if (dom.casterFormCancelButton) {
                dom.casterFormCancelButton.classList.remove("hidden");
              }
              if (dom.otherPlatformInputGroup)
                dom.otherPlatformInputGroup.classList.add("hidden"); // Ocultar input "Otro"

              dom.casterForm.scrollIntoView({ behavior: "smooth" });
            }
          }
          if (deleteBtn) {
            // Depuración de logs
            console.log("Delete button clicked (Casters)."); // Log al inicio del bloque delete
            const id = deleteBtn.dataset.id;
            console.log("Caster ID to delete:", id); // Log el ID

            const confirmed = await utils.showConfirmationModal(
              "¿Seguro que quieres eliminar este caster?"
            );
            console.log("Confirmation modal result (Casters):", confirmed); // Log resultado del modal

            if (confirmed) {
              try {
                console.log("Sending DELETE request for caster..."); // Log antes del fetch
                const response = await utils.fetchWithAuth(
                  `${config.API_URL}/casters/${id}`,
                  { method: "DELETE" }
                );
                console.log(
                  "DELETE request response (Casters):",
                  response.status,
                  response.statusText
                ); // Log respuesta del fetch
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(
                    errorData.message || `Error HTTP: ${response.status}`
                  );
                }
                utils.showMessage("Caster eliminado.");
                App.fetchAllData();
              } catch (error) {
                utils.showMessage(error.message, "error");
              }
            } else {
              console.log("Caster deletion cancelled by user."); // Log if cancelled
            }
          }
        });
      } // Event listener para el botón de cancelar del formulario del caster

      if (dom.casterFormCancelButton) {
        dom.casterFormCancelButton.addEventListener("click", () => {
          dom.casterForm.reset();
          state.currentCasterSocials = {}; // Limpiar redes sociales al cancelar
          render.renderCasterSocialsInForm(); // Actualizar UI
          state.editingCasterId = null; // Resetear estado de edición
          const casterFormButtonText = document.getElementById(
            "caster-form-button-text"
          );
          if (casterFormButtonText) {
            casterFormButtonText.textContent = "Guardar Caster";
          } else {
            console.warn(
              "Advertencia: Elemento 'caster-form-button-text' no encontrado al cancelar. No se pudo restablecer el texto del botón."
            );
          }
          dom.casterFormCancelButton.classList.add("hidden");
          if (dom.otherPlatformInputGroup)
            dom.otherPlatformInputGroup.classList.add("hidden"); // Ocultar input "Otro"
        });
      }
    },
    // FIN DE featureModules.initCasters()
    initUsers() {
      if (dom.createUserForm)
        dom.createUserForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const button = e.submitter;
          utils.setButtonLoading(button, true);
          try {
            const data = Object.fromEntries(
              new FormData(dom.createUserForm).entries()
            );
            if (state.editingUserId && !data.password) {
              delete data.password;
            }
            const url = state.editingUserId
              ? `${config.API_URL}/users/${state.editingUserId}`
              : `${config.API_URL}/users`;
            const method = state.editingUserId ? "PUT" : "POST";
            const response = await utils.fetchWithAuth(url, {
              method: method,
              body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error((await response.json()).message);
            utils.showMessage(
              `Usuario ${
                state.editingUserId ? "actualizado" : "creado"
              } con éxito.`
            );
            state.editingUserId = null;
            dom.createUserForm.reset();
            const submitButton = dom.createUserForm.querySelector(
              'button[type="submit"]'
            );
            submitButton.textContent = "Crear Usuario";
            const cancelButton = document.getElementById(
              "cancel-edit-user-btn"
            );
            if (cancelButton) cancelButton.remove();
            await App.fetchAllData();
          } catch (error) {
            utils.showMessage(error.message, "error");
          } finally {
            utils.setButtonLoading(button, false);
          }
        });
      if (dom.usersListContainer)
        dom.usersListContainer.addEventListener("click", async (e) => {
          const editBtn = e.target.closest(".edit-user-btn");
          const deleteBtn = e.target.closest(".delete-user-btn");
          if (editBtn) {
            const id = editBtn.dataset.id;
            const user = state.users.find((u) => u._id === id);
            if (user) {
              state.editingUserId = id;
              document.getElementById("user-email").value = user.email;
              document.getElementById("user-role").value =
                user.roles[0] || "manager";
              const passwordInput = document.getElementById("user-password");
              passwordInput.value = "";
              passwordInput.placeholder = "Dejar en blanco para no cambiar";
              const submitButton = dom.createUserForm.querySelector(
                'button[type="submit"]'
              );
              submitButton.textContent = "Actualizar Usuario";
              if (!document.getElementById("cancel-edit-user-btn")) {
                const cancelButton = document.createElement("button");
                cancelButton.type = "button";
                cancelButton.id = "cancel-edit-user-btn";
                cancelButton.textContent = "Cancelar";
                cancelButton.className = "cta-button offline-button";
                submitButton.after(cancelButton);
                cancelButton.addEventListener("click", () => {
                  state.editingUserId = null;
                  dom.createUserForm.reset();
                  submitButton.textContent = "Crear Usuario";
                  passwordInput.placeholder = "";
                  cancelButton.remove();
                });
              }
              dom.createUserForm.scrollIntoView({ behavior: "smooth" });
            }
          }
          if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            const confirmed = await utils.showConfirmationModal(
              "¿Seguro que quieres eliminar este usuario?"
            );
            if (confirmed) {
              try {
                const response = await utils.fetchWithAuth(
                  `${config.API_URL}/users/${id}`,
                  { method: "DELETE" }
                );
                if (!response.ok)
                  throw new Error((await response.json()).message);
                utils.showMessage("Usuario eliminado.");
                App.fetchAllData();
              } catch (error) {
                utils.showMessage(error.message, "error");
              }
            }
          }
        });
    },
    initLogs() {
      /* No hay eventos para los logs por ahora */
    },
  };

  // =================================================================
  // --- 6. LÓGICA PRINCIPAL DE LA APLICACIÓN ---
  // =================================================================
  const App = {
    async fetchAllData() {
      try {
        const dataSources = [
          { key: "teams", url: `${config.API_URL}/teams` },
          { key: "matches", url: `${config.API_URL}/matches` },
          { key: "news", url: `${config.API_URL}/news` },
          { key: "casters", url: `${config.API_URL}/casters` },
          { key: "users", url: `${config.API_URL}/users` },
          { key: "sanctions", url: `${config.API_URL}/sanctions` },
          { key: "logs", url: `${config.API_URL}/logs` },
        ];
        const responses = await Promise.all(
          dataSources.map((source) =>
            utils.fetchWithAuth(source.url).catch((err) => null)
          )
        );
        for (let i = 0; i < responses.length; i++) {
          const response = responses[i];
          if (response && response.ok) {
            const data = await response.json();
            state[dataSources[i].key] =
              data[dataSources[i].key] || data[Object.keys(data)[0]] || [];
          } else if (response) {
            console.error(
              `Error fetching ${dataSources[i].key}: ${response.status} ${response.statusText}`
            );
          }
        }
        this.renderAll();
      } catch (error) {
        utils.showMessage(
          `Error fatal al cargar los datos: ${error.message}`,
          "error"
        );
      }
    },

    renderAll() {
      render.allTeamSelects();
      render.pendingMatches();
      render.news();
      render.casters(); // Esto renderiza la lista de casters
      render.users();
      render.sanctions();
      render.logs();
      // Asegurar que la lista de redes sociales del formulario también se actualice
      // cuando se obtienen los datos, especialmente al cargar la página o al resetear
      render.renderCasterSocialsInForm();
    },

    init() {
      const token = localStorage.getItem("authToken");
      if (!token) {
        document.body.innerHTML =
          '<div style="text-align: center; padding: 50px; color: white;"><h1>Acceso Denegado</h1><p>No tienes permiso para ver esta página. Por favor, <a href="/Admin/login.html" style="color: var(--accent-gold);">inicia sesión</a>.</p></div>';
        return;
      }
      state.currentUser = utils.decodeToken(token);

      const isAdmin = state.currentUser.roles.includes("admin");
      const isManager = state.currentUser.roles.includes("manager");

      const setCardVisibility = (id, condition) => {
        const el = document.getElementById(id);
        if (el) el.style.display = condition ? "block" : "none";
        else
          console.warn(
            `Element with id '${id}' not found for permission check.`
          );
      };

      const allCards = [
        "card-anuncios",
        "card-partidas",
        "card-crear-equipo",
        "card-gestionar-equipos",
        "card-sanciones",
        "card-casters",
        "card-usuarios",
        "card-logs",
      ];
      allCards.forEach((id) => setCardVisibility(id, false));

      if (isAdmin || isManager) {
        setCardVisibility("card-anuncios", true);
        featureModules.initNews();

        setCardVisibility("card-partidas", true);
        featureModules.initMatches();

        setCardVisibility("card-crear-equipo", true);
        featureModules.initTeams();

        setCardVisibility("card-gestionar-equipos", true); // <-- ¡AÑADE ESTA LÍNEA AQUÍ!

        setCardVisibility("card-sanciones", true);
        featureModules.initSanctions();
      }

      if (isAdmin) {
        setCardVisibility("card-casters", true);
        featureModules.initCasters(); // Llamar a initCasters cuando el módulo esté habilitado

        setCardVisibility("card-usuarios", true);
        featureModules.initUsers();

        setCardVisibility("card-logs", true);
        featureModules.initLogs();
      }

      this.fetchAllData();
    },
  };

  // =================================================================
  // --- 7. PUNTO DE ENTRADA ---
  // =================================================================
  App.init();
})();

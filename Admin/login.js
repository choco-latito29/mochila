document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURACIÓN ---
  const API_URL = "http://216.173.77.192:25959/api";

  // --- ELEMENTOS DEL DOM ---
  const loginForm = document.getElementById("login-form");
  const messageBox = document.getElementById("login-message");

  // --- MANEJADOR DEL FORMULARIO ---
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      // Previene la recarga de la página, que es el comportamiento por defecto de un formulario.
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const submitButton = loginForm.querySelector('button[type="submit"]');

      // Deshabilita el botón para evitar múltiples clics mientras se procesa.
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Ingresando...';

      // Limpia mensajes de error anteriores.
      if (messageBox) {
        messageBox.textContent = "";
        messageBox.classList.remove("show", "error", "success");
      }

      try {
        // Realiza la petición a la API para iniciar sesión.
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        // Si la respuesta del servidor no es exitosa (ej. 400, 401), lanza un error.
        if (!response.ok) {
          throw new Error(
            data.message || "Error desconocido al iniciar sesión."
          );
        }

        // --- LÓGICA CORREGIDA ---

        // 1. Guarda el token de autenticación en el almacenamiento local del navegador.
        localStorage.setItem("authToken", data.token);

        // 2. Redirige al usuario al panel de administración inmediatamente.
        window.location.href = "/Admin/admin.html";
      } catch (error) {
        // Si ocurre cualquier error, muéstralo en pantalla.
        if (messageBox) {
          messageBox.textContent = error.message;
          messageBox.className = "login-message-box show error";
        }

        // Vuelve a habilitar el botón para que el usuario pueda intentarlo de nuevo.
        submitButton.disabled = false;
        submitButton.textContent = "Ingresar";
      }
    });
  }
});

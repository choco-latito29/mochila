document.addEventListener("DOMContentLoaded", () => {
  // Selecciona todos los elementos que tienen la clase 'faq-question'
  const faqQuestions = document.querySelectorAll(".faq-question");

  // Itera sobre cada pregunta encontrada
  faqQuestions.forEach((question) => {
    // Añade un event listener para el clic en cada pregunta
    question.addEventListener("click", () => {
      // Selecciona la respuesta asociada a esta pregunta
      // La respuesta es el siguiente elemento hermano (sibling) de la pregunta
      const answer = question.nextElementSibling;

      // Primero, cierra todas las demás preguntas abiertas en la misma categoría
      // Esto asegura que solo una respuesta esté abierta a la vez.
      const currentCategory = question.closest(".faq-category");
      if (currentCategory) {
        currentCategory
          .querySelectorAll(".faq-question.active")
          .forEach((activeQuestion) => {
            if (activeQuestion !== question) {
              // No cerrar la que se acaba de cliquear
              activeQuestion.classList.remove("active");
              activeQuestion.nextElementSibling.style.maxHeight = null;
            }
          });
      }

      // Alterna la clase 'active' en la pregunta clicada
      // Esta clase se usará en CSS para cambiar el estilo de la pregunta (ej. icono, color)
      question.classList.toggle("active");

      // Comprueba si la respuesta está actualmente visible (tiene una altura máxima)
      if (answer.style.maxHeight) {
        // Si está visible, ocúltala estableciendo maxHeight a null
        answer.style.maxHeight = null;
      } else {
        // Si está oculta, muéstrala estableciendo maxHeight a su altura de scroll
        // Esto permite que la animación CSS funcione
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
});

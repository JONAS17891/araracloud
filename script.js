/*
 * CONFIGURAÇÃO DO LINK DE COMPRA
 * Quando seu site de contratação estiver pronto, cole a URL de cada plano
 * entre as aspas correspondentes. Se usar um único endereço, repita-o nos dois.
 */
const LINKS_DE_COMPRA = {
  Inicial: "https://financeiro.araracloud.site/store/hospedagem-de-bots-ryzen-5-7430u/hospedagem-easy-400-mb-de-ram",
  Pro: "https://financeiro.araracloud.site/store/hospedagem-de-bots-ryzen-5-7430u/hospedagem-fast-800-mb-de-ram",
};

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");

if (menuButton && navigation) {
  const menuIcon = menuButton.querySelector("use");
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
    navigation.classList.toggle("main-nav--open", !isOpen);
    if (menuIcon) menuIcon.setAttribute("href", isOpen ? "#i-menu" : "#i-x");
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("main-nav--open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menu");
      if (menuIcon) menuIcon.setAttribute("href", "#i-menu");
    });
  });
}

document.querySelectorAll(".faq-question").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const answer = item?.querySelector(".faq-answer");
    if (!item || !answer) return;
    const willOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(willOpen));
    item.classList.toggle("faq-item--open", willOpen);
    answer.hidden = !willOpen;
  });
});

const buyNotice = document.querySelector("#buy-notice");
document.querySelectorAll("[data-buy-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.getAttribute("data-buy-plan") || "";
    const destination = LINKS_DE_COMPRA[plan]?.trim();
    if (destination) {
      window.open(destination, "_blank", "noopener,noreferrer");
      return;
    }

    if (buyNotice) {
      buyNotice.textContent = `O link de compra do plano ${plan} ainda não foi configurado. Quando seu site estiver pronto, cole o endereço ao lado de “${plan}” na constante LINKS_DE_COMPRA, no início do arquivo script.js.`;
      buyNotice.hidden = false;
      buyNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
});

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

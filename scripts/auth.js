import { API, SELECTORS } from "./config.js";
import { handleError } from "./utils.js";

export const handleLogin = () => {
  document
    .getElementById(SELECTORS.LOGIN_FORM)
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      const credentials = btoa(`${username}:${password}`);
      try {
        const response = await fetch(API.AUTH, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("jwt", data);
          window.location.href = "profile.html";
        } else {
          handleError(response);
        }
      } catch (error) {
        document.getElementById("error-message").textContent =
          "Network error. Please check your connection and try again.";
      }
    });
};

export const handleLogout = () => {
  document
    .getElementById(SELECTORS.LOGOUT_BTN)
    ?.addEventListener("click", () => {
      localStorage.removeItem("jwt");
      window.location.href = "index.html";
    });
};

export const checkAuth = () => {
  if (
    !localStorage.getItem("jwt") &&
    !window.location.pathname.includes("index")
  ) {
    window.location.href = "index.html";
  }
};

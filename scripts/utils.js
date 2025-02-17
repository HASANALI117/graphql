import { SELECTORS } from "./config.js";

export const formatNumber = (num, precision = 2) => {
  if (num >= 1e6) return `${(num / 1e6).toFixed(precision)} MB`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(precision)} kB`;
  return `${num} B`;
};

// Function to determine the rank based on the level
export const getRank = (level) => {
  if (level >= 60) return "Full-Stack Developer";
  if (level >= 55) return "Confirmed Developer";
  if (level >= 50) return "Junior Developer";
  if (level >= 40) return "Basic Developer";
  if (level >= 30) return "Assistant Developer";
  if (level >= 20) return "Apprentice Developer";
  if (level >= 10) return "Beginner Developer";
  return "Aspiring Developer";
};

export const handleError = (response) => {
  const errorMessage = document.getElementById(SELECTORS.ERROR_MESSAGE);
  switch (response.status) {
    case 404:
      errorMessage.textContent =
        "The login service could not be found. Please check the URL or try again later.";
      break;
    case 401:
    case 403:
      errorMessage.textContent = "Invalid username or password.";
      break;
    case 500:
      errorMessage.textContent = "Server error. Please try again later.";
      break;
    default:
      errorMessage.textContent =
        "An unexpected error occurred. Please try again.";
  }
};

export const getUserIdFromJWT = () => {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) return null;

  try {
    const payload = jwt.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const userId = JSON.parse(decoded).sub;
    return userId;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

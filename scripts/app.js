import { handleLogin, checkAuth } from "./auth.js";
import { fetchProfileData, displayProfile } from "./profile.js";
import { blobAnimation } from "./visualization.js";

document.addEventListener("DOMContentLoaded", () => {
  blobAnimation();
  checkAuth();
  if (window.location.pathname.includes("profile")) {
    fetchProfileData()
      .then((data) => {
        if (data) {
          displayProfile(data);
        }
      })
      .catch((error) => console.log(error.message));
  } else {
    handleLogin();
  }
});

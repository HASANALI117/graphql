const jwt = localStorage.getItem("jwt");
if (!jwt) {
  window.location.href = "index.html";
}

// Load D3.js from CDN
const script = document.createElement("script");
script.src = "https://d3js.org/d3.v7.min.js";
document.head.appendChild(script);

const fetchProfileData = async () => {
  const query = `
    {
      user{
          id
          auditRatio
          campus
          createdAt
          email
          firstName
          lastName
          login
          totalUp
          totalDown
      }
      transaction(where: { type: { _eq: "xp" } }, order_by: { createdAt: asc }) {
        amount
        createdAt
        type
        objectId
      }
      progress {
        grade
        objectId
        createdAt
        isDone
      }
      audit {
        grade
        createdAt
        auditorId
        resultId
      }
      group_user {
        group {
          id
          objectId
          status
          createdAt
        }
      }
      event_user {
        event {
          id
          objectId
          path
          createdAt
        }
      }
    }
  `;

  const response = await fetch(
    "https://learn.reboot01.com/api/graphql-engine/v1/graphql",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (response.ok) {
    const data = await response.json();
    console.log(data.data.user[0]);

    displayProfile(data.data);
  } else {
    alert("Failed to fetch profile data");
  }
};

const formatNumber = (num) => {
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + " MB";
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + " KB";
  } else {
    return num;
  }
};

const displayProfile = (data) => {
  const user = data.user[0];
  console.log({ user });

  const username = document.getElementById("username");
  const fullName = document.getElementById("fullName");
  const midColumn = document.getElementById("midColumn");
  const coreStats = document.getElementById("coreStats");

  const total = user.totalUp + user.totalDown;
  const auditsDonePercentage = ((user.totalUp / total) * 100).toFixed(2);
  const auditsReceivedPercentage = ((user.totalDown / total) * 100).toFixed(2);

  document
    .querySelector("#audit-ratio-done")
    .setAttribute("width", (300 * user.totalUp) / total);
  document
    .querySelector("#audit-ratio-received")
    .setAttribute("width", (300 * user.totalDown) / total);

  document.querySelector(
    "#audit-ratio-done-text"
  ).textContent = `Audits Done (${auditsDonePercentage}%)`;
  document.querySelector(
    "#audit-ratio-received-text"
  ).textContent = `Audits Received (${auditsReceivedPercentage}%)`;

  document.querySelector("#audit-ratio-done-number").textContent = formatNumber(
    user.totalUp
  );
  document.querySelector("#audit-ratio-received-number").textContent =
    formatNumber(user.totalDown);

  fullName.innerHTML = `${user.firstName} ${user.lastName}`;
  username.innerHTML = `@${user.login} #${user.id}`;
  midColumn.innerHTML = `
  <p class="text-white/80">
    <span class="font-bold">Clan:</span> Reboot01
  </p>
  <p class="text-white/80">
    <span class="font-bold">Campus:</span> ${user.campus.toUpperCase()}
  </p>
  <p class="text-white/80">
    <span class="font-bold">Member Since:</span> ${new Date(
      user.createdAt
    ).toLocaleDateString()}
  </p>
  `;
  coreStats.innerHTML = `
  <div class="text-center">
    <div class="text-3xl font-bold text-purple-300">cds</div>
    <div class="text-sm text-white/80">Total XP</div>
  </div>
  <div class="text-center">
    <div class="text-3xl font-bold text-green-400">A+</div>
    <div class="text-sm text-white/80">Grade</div>
  </div>
  <div class="text-center">
    <div class="text-3xl font-bold text-blue-400">${parseFloat(
      user.auditRatio
    ).toFixed(2)}</div>
    <div class="text-sm text-white/80">Audit Ratio</div>
  </div>
`;
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  });
});

fetchProfileData();

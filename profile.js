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
      transaction(
        where: {type: {_eq: "xp"}, object: {type: {_eq: "project"}}}
        order_by: {createdAt: asc}
      ) {
        id
        type
        amount
        createdAt
        object {
          id
          name
        }
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
    return (num / 1e6).toFixed(2) + " MB";
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + " kB";
  } else {
    return num;
  }
};

const displayProfile = (data) => {
  const user = data.user[0];
  console.log({ user });
  console.log(data.transaction);

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

  // Calculate total XP from transactions
  const totalXP = data.transaction.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  // Correct formatting function (1 KB = 1024 B)
  const formatXP = (xp) => {
    if (xp >= 1048576) return `${(xp / 1048576).toFixed(1)} MB`; // 1024*1024
    if (xp >= 1024) return `${(xp / 1024).toFixed(1)} kB`;
    return `${xp} B`;
  };

  coreStats.innerHTML = `
  <div class="text-center">
    <div class="text-3xl font-bold text-purple-300">${formatXP(totalXP)}</div>
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

  createXpOverTimeGraph(data.transaction);
};

const createXpOverTimeGraph = (transactions) => {
  const svg = d3.select("#xp-progress");
  svg.selectAll("*").remove();

  // Parse and sort transactions
  const parsedData = transactions
    .map((t) => ({
      date: new Date(t.createdAt),
      createdAt: t.createdAt,
      amount: Number(t.amount),
      cumulativeXp: 0,
    }))
    .sort((a, b) => a.date - b.date);

  // Calculate cumulative XP
  let cumulative = 0;
  parsedData.forEach((d) => {
    cumulative += d.amount;
    d.cumulativeXp = cumulative;
  });

  // Set up dimensions
  const width = 400;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  // Create scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(parsedData, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(parsedData, (d) => d.cumulativeXp)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Create line generator
  const line = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.cumulativeXp))
    .curve(d3.curveMonotoneX);

  // Draw line
  svg
    .append("path")
    .datum(parsedData)
    .attr("fill", "none")
    .attr("stroke", "#c62368")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Create tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(255, 255, 255, 0.1)")
    .style("backdrop-filter", "blur(10px)")
    .style("border-radius", "4px")
    .style("color", "white")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Add interactive circles
  svg
    .selectAll("circle")
    .data(parsedData)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.date))
    .attr("cy", (d) => yScale(d.cumulativeXp))
    .attr("r", 3)
    .attr("fill", "#fff")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `
        ${new Date(d.createdAt).toLocaleString()}<br>
        XP: ${d.amount}<br>
        Total: ${d.cumulativeXp}
      `
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Remove axis elements
  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("pointer-events", "all");
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  });
});

fetchProfileData();

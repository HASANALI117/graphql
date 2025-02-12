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
          labels{
            labelName
          }
      }
      xp: transaction_aggregate(where: {type: {_eq: "xp"}, eventId: {_eq: 20}}) {
        aggregate {
          sum {
            amount
          }
        }
      }
      level: transaction(
        limit: 1
        order_by: {amount: desc}
        where: {type: {_eq: "level"}}
      ) {
        amount
      }
      skills: transaction(
        where: {type: {_like:"skill_%"}}
        distinct_on:[type]
      ) {
        type
      }
      projects: transaction(
          where: {
            type: {_eq: "xp"},
            object: {type: {_eq: "project"}}
          },
          order_by: {createdAt: asc}
        ) {
          amount
          createdAt
          object {
            name
            attrs
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
  const level = data.level[0].amount;
  const xp = data.xp.aggregate.sum.amount;
  const projects = data.projects;

  console.log(projects);
  // console.log(xp);
  // console.log({ user });
  // console.log(data.skills);

  const leftColumn = document.getElementById("left-col");
  const midColumn = document.getElementById("mid-col");
  const rightColumn = document.getElementById("right-col");
  const skills = document.getElementById("skills");
  const coreStats = document.getElementById("coreStats");

  leftColumn.innerHTML = `<h1 class="text-3xl font-bold mb-2 text-white">${user.firstName} ${user.lastName}</h1>
            <p class="text-purple-300">@${user.login} #${user.id}</p>`;

  midColumn.innerHTML = `
  <p class="text-white/80">
    <span class="font-bold">Cohort:</span> ${user.labels[0].labelName.replace(
      "Cohort ",
      ""
    )}
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

  rightColumn.innerHTML = `
  <h1 class="text-4xl font-bold mb-2 self-center">
    <div class="level-badge">
      <span>Level ${level}</span>
    </div>
  </h1>
`;

  const skillElements = data.skills
    .map((skill) => {
      const skillType = skill.type.replace("skill_", "");
      return `<span class="skill-badge px-3 py-1 rounded-full text-white">${skillType}</span>`;
    })
    .join(" ");

  skills.innerHTML = skillElements;

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

  // formatting xp function
  const formatXP = (xp) => {
    if (xp >= 1e6) return `${(xp / 1e6).toFixed(2)} MB`;
    if (xp >= 1e3) return `${(xp / 1e3).toFixed(2)} kB`;
    return `${xp} B`;
  };

  coreStats.innerHTML = `
  <div class="text-center">
    <div class="text-3xl font-bold text-purple-300">${formatXP(xp)}</div>
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

  // createXpOverTimeGraph(data.transaction);
  renderProjectsMap(projects);
};

// const createXpOverTimeGraph = (transactions) => {
//   const svg = d3.select("#xp-progress");
//   svg.selectAll("*").remove();

//   // Parse and sort transactions
//   const parsedData = transactions
//     .map((t) => ({
//       date: new Date(t.createdAt),
//       createdAt: t.createdAt,
//       amount: Number(t.amount),
//       cumulativeXp: 0,
//     }))
//     .sort((a, b) => a.date - b.date);

//   // Calculate cumulative XP
//   let cumulative = 0;
//   parsedData.forEach((d) => {
//     cumulative += d.amount;
//     d.cumulativeXp = cumulative;
//   });

//   // Set up dimensions
//   const width = 400;
//   const height = 200;
//   const margin = { top: 20, right: 20, bottom: 20, left: 20 };

//   // Create scales
//   const xScale = d3
//     .scaleTime()
//     .domain(d3.extent(parsedData, (d) => d.date))
//     .range([margin.left, width - margin.right]);

//   const yScale = d3
//     .scaleLinear()
//     .domain([0, d3.max(parsedData, (d) => d.cumulativeXp)])
//     .nice()
//     .range([height - margin.bottom, margin.top]);

//   // Create line generator
//   const line = d3
//     .line()
//     .x((d) => xScale(d.date))
//     .y((d) => yScale(d.cumulativeXp))
//     .curve(d3.curveMonotoneX);

//   // Draw line
//   svg
//     .append("path")
//     .datum(parsedData)
//     .attr("fill", "none")
//     .attr("stroke", "#c62368")
//     .attr("stroke-width", 2)
//     .attr("d", line);

//   // Create tooltip
//   const tooltip = d3
//     .select("body")
//     .append("div")
//     .style("position", "absolute")
//     .style("padding", "8px")
//     .style("background", "rgba(255, 255, 255, 0.1)")
//     .style("backdrop-filter", "blur(10px)")
//     .style("border-radius", "4px")
//     .style("color", "white")
//     .style("font-size", "12px")
//     .style("pointer-events", "none")
//     .style("opacity", 0);

//   // Add interactive circles
//   svg
//     .selectAll("circle")
//     .data(parsedData)
//     .enter()
//     .append("circle")
//     .attr("cx", (d) => xScale(d.date))
//     .attr("cy", (d) => yScale(d.cumulativeXp))
//     .attr("r", 3)
//     .attr("fill", "#fff")
//     .on("mouseover", (event, d) => {
//       tooltip.transition().duration(200).style("opacity", 1);
//       tooltip
//         .html(
//           `
//         ${new Date(d.createdAt).toLocaleString()}<br>
//         XP: ${d.amount}<br>
//         Total: ${d.cumulativeXp}
//       `
//         )
//         .style("left", event.pageX + 10 + "px")
//         .style("top", event.pageY - 28 + "px");
//     })
//     .on("mouseout", () => {
//       tooltip.transition().duration(500).style("opacity", 0);
//     });

//   // Remove axis elements
//   svg
//     .append("rect")
//     .attr("width", width)
//     .attr("height", height)
//     .attr("fill", "none")
//     .attr("pointer-events", "all");
// };

const renderProjectsMap = (projects) => {
  const container = document.getElementById("projects-map");
  container.innerHTML = projects
    .map(
      (project) => `
      <div class="flex-shrink-0 w-48 p-4 bg-white/10 rounded-lg text-center hover:bg-white/20 transition-all">
        <h4 class="font-bold text-white mb-2">${project.object.name}</h4>
        <div class="text-purple-300 text-sm">
          +${formatNumber(project.amount)}
        </div>
        <div class="text-xs text-white/60 mt-2">
          ${new Date(project.createdAt).toLocaleDateString()}
        </div>
        <div class="mt-2">
          <span class="px-2 py-1 bg-[#c62368] rounded-full text-xs text-white">
            ${project.object.attrs.language}
          </span>
        </div>
      </div>
    `
    )
    .join("");
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  });
});

fetchProfileData();

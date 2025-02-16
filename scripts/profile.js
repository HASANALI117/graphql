const jwt = localStorage.getItem("jwt");
if (!jwt) {
  window.location.href = "index.html";
}

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
      progress: transaction(
        where: {type: {_eq: "xp"}, eventId: {_eq: 20}}
        order_by: {createdAt: asc}
      ) {
        amount
        createdAt
        object {
          name
          type
          createdAt
        }
        type
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
const formatNumber2 = (num) => {
  if (num >= 1e6) {
    return Math.round(num / 1e6) + " MB";
  } else if (num >= 1e3) {
    return Math.round(num / 1e3) + " kB";
  } else {
    return num;
  }
};

const displayProfile = (data) => {
  const user = data.user[0];
  const level = data.level[0].amount;
  const xp = data.xp.aggregate.sum.amount;
  const projects = data.projects;

  // console.log(projects);
  // console.log(xp);
  // console.log({ user });
  // console.log(data.skills);

  const leftColumn = document.getElementById("left-col");
  const midColumn = document.getElementById("mid-col");
  const rightColumn = document.getElementById("right-col");
  const skills = document.getElementById("skills");
  const coreStats = document.getElementById("coreStats");

  leftColumn.innerHTML = `<h1 class="text-3xl font-bold mb-2 text-white">${user.firstName} ${user.lastName}</h1>
            <p class="text-purple-300">@${user.login} #${user.id}</p>
            <button id="logout-button" class="logout-btn">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Logout
        </button>`;

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

  renderProjectsMap(projects);
  createXpByProjectGraph(data.progress);

  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("jwt");
      window.location.href = "index.html";
    });
  }
};

const createXpByProjectGraph = (progress) => {
  let cumulativeXP = 0;
  const cumulativeData = progress.map((item) => {
    cumulativeXP += item.amount;
    return {
      amount: item.amount,
      cumulativeXP,
      createdAt: new Date(item.createdAt),
      object: {
        name: item.object.name,
        type: item.object.type,
      },
    };
  });

  // Filter project transactions for dots only
  const projectData = cumulativeData.filter((d) => d.object.type === "project");

  console.log(projectData);

  const svg = d3.select("#xp-progress");
  svg.selectAll("*").remove();

  // Set up dimensions
  const width = 400;
  const height = 200;
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create scales
  const x = d3
    .scaleTime()
    .domain(d3.extent(cumulativeData, (d) => d.createdAt))
    .range([0, innerWidth]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(cumulativeData, (d) => d.cumulativeXP)])
    .range([innerHeight, 0]);

  // Create the line generator
  const line = d3
    .line()
    .x((d) => x(d.createdAt))
    .y((d) => y(d.cumulativeXP))
    .curve(d3.curveStepAfter);

  // Create gradient
  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "lineGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

  gradient.append("stop").attr("offset", "0%").style("stop-color", "#ff47b5");
  gradient.append("stop").attr("offset", "100%").style("stop-color", "#ff8c64");

  // Create container group
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add the line path
  g.append("path")
    .datum(cumulativeData)
    .attr("class", "line")
    .attr("d", line)
    .style("fill", "none")
    .style("stroke", "url(#lineGradient)")
    .style("stroke-width", 2)
    .style("filter", "drop-shadow(0px 0px 6px rgba(255, 71, 181, 0.8))");

  // Add dots
  const dots = g
    .selectAll(".dot")
    .data(projectData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(new Date(d.createdAt)))
    .attr("cy", (d) => y(d.cumulativeXP))
    .attr("r", 2)
    .style("fill", "#fff")
    .style("filter", "drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.7))");

  // Add tooltip
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

  // Add interactions
  dots
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget).transition().duration(200).attr("r", 3);

      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `
          <div class="font-bold">${d.object.name}</div>
          <div>Project XP: +${formatNumber(d.amount)}</div>
          <div>Total XP: ${formatNumber(d.cumulativeXP)}</div>
          <div>Completed: ${new Date(d.createdAt).toLocaleDateString()}</div>
          <div>Type: ${d.object.type}</div>
        `
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).transition().duration(200).attr("r", 2);

      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Add axes
  const xAxis = d3
    .axisBottom(x)
    .ticks(5)
    .tickFormat((d) => d.toLocaleDateString());
  const yAxis = d3.axisLeft(y).ticks(5).tickFormat(formatNumber2);

  // Add x-axis
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "middle")
    .style("fill", "#fff")
    .style("font-size", "10px");

  // Add y-axis
  g.append("g")
    .call(yAxis)
    .selectAll("text")
    .style("fill", "#fff")
    .style("font-size", "10px");

  // Style axes
  g.selectAll(".domain").style("stroke", "rgba(255, 255, 255, 0.2)");

  g.selectAll(".tick line").style("stroke", "rgba(255, 255, 255, 0.2)");
};

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
  fetchProfileData();
});

// Animate blob1 -> blob2 -> blob3 -> blob1 in a loop
const tween1 = KUTE.fromTo(
  "#blob1",
  { path: "#blob1" },
  { path: "#blob2" },
  { duration: 3000 }
);
const tween2 = KUTE.fromTo(
  "#blob1",
  { path: "#blob2" },
  { path: "#blob3" },
  { duration: 3000 }
);
const tween3 = KUTE.fromTo(
  "#blob1",
  { path: "#blob3" },
  { path: "#blob1" },
  { duration: 3000 }
);

tween1.chain(tween2);
tween2.chain(tween3);
tween3.chain(tween1);

tween1.start();

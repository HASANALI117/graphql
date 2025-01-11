 const jwt = localStorage.getItem('jwt');
if (!jwt) {
  window.location.href = 'index.html';
}

// Load D3.js from CDN
const script = document.createElement('script');
script.src = 'https://d3js.org/d3.v7.min.js';
document.head.appendChild(script);

const fetchProfileData = async () => {
  const query = `
    {
      user {
        id
        login
        campus
        createdAt
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
    'https://learn.reboot01.com/api/graphql-engine/v1/graphql',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  if (response.ok) {
    const data = await response.json();
    console.log(data.data.user[0] );
    
    displayProfile(data.data);
    generateGraphs(data.data);
  } else {
    alert('Failed to fetch profile data');
  }
};

const displayProfile = (data) => {
  const profileInfo = document.getElementById('profile-info');
  const user = data.user[0];
  console.log({ user });
  
  const totalXp = data.transaction.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  // Calculate audit ratio
  const totalAudits = data.audit.length;
  const passedAudits = data.audit.filter(a => a.grade >= 1).length;
  const auditRatio = totalAudits > 0 ? (passedAudits / totalAudits).toFixed(2) : 'N/A';

  // Calculate group participation
  const activeGroups = data.group_user.filter(g => g.group.status !== 'finished').length;
  const completedGroups = data.group_user.filter(g => g.group.status === 'finished').length;

  // Calculate event participation
  const eventsAttended = data.event_user.length;

  profileInfo.innerHTML = `
    <div class="profile-info-card">
      <h3>User ID</h3>
      <p>${user.id}</p>
    </div>
    <div class="profile-info-card">
      <h3>Login</h3>
      <p>${user.login}</p>
    </div>
    <div class="profile-info-card">
      <h3>Campus</h3>
      <p>${user.campus || 'Not specified'}</p>
    </div>
    <div class="profile-info-card">
      <h3>Member Since</h3>
      <p>${new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
    <div class="profile-info-card">
      <h3>Total XP</h3>
      <p>${totalXp}</p>
    </div>
    <div class="profile-info-card">
      <h3>Audit Ratio</h3>
      <p>${auditRatio}</p>
    </div>
    <div class="profile-info-card">
      <h3>Groups</h3>
      <p>${activeGroups} active, ${completedGroups} completed</p>
    </div>
    <div class="profile-info-card">
      <h3>Events Attended</h3>
      <p>${eventsAttended}</p>
    </div>
    <div class="profile-info-card">
      <h3>Progress</h3>
      <p>${data.progress.filter(p => p.isDone).length} completed</p>
    </div>
  `;
};

const generateGraphs = (data) => {
  // Wait for D3.js to load
  script.onload = () => {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Tooltip setup
    const tooltip = d3.select('.tooltip');

    // XP over time line chart with tooltips
    const xpData = data.transaction.map((t) => ({
      date: new Date(t.createdAt),
      amount: t.amount,
      type: t.type,
      objectId: t.objectId,
      cumulative: 0,
    }));

    // Calculate cumulative XP
    xpData.reduce((acc, curr) => {
      curr.cumulative = acc + curr.amount;
      return curr.cumulative;
    }, 0);

    const xpSvg = d3
      .select('#xp-graph')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(xpData, (d) => d.date))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(xpData, (d) => d.cumulative)])
      .range([height, 0]);

    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.cumulative));

    xpSvg
      .append('path')
      .datum(xpData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--primary)')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add tooltip circles
    xpSvg
      .selectAll('.xp-circle')
      .data(xpData)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.date))
      .attr('cy', (d) => y(d.cumulative))
      .attr('r', 4)
      .attr('fill', 'var(--primary)')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.amount} XP</strong><br>
                Type: ${d.type}<br>
                Date: ${d.date.toLocaleDateString()}`)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => tooltip.style('opacity', 0));

    // Add axes
    xpSvg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    xpSvg.append('g').call(d3.axisLeft(y));

    // Audit ratio pie chart using actual audit data
    const auditData = [
      {
        label: 'Passed',
        value: data.audit.filter(a => a.grade >= 1).length,
      },
      {
        label: 'Failed',
        value: data.audit.filter(a => a.grade < 1).length,
      },
    ];

    const pie = d3.pie().value((d) => d.value);
    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(Math.min(width, height) / 2 - 1);

    const color = d3
      .scaleOrdinal()
      .domain(auditData.map((d) => d.label))
      .range(['var(--success)', 'var(--error)']);

    const pieSvg = d3
      .select('#audit-graph')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr(
        'transform',
        `translate(${width / 2 + margin.left},${height / 2 + margin.top})`
      );

    pieSvg
      .selectAll('path')
      .data(pie(auditData))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.label))
      .attr('stroke', 'var(--card-background)')
      .style('stroke-width', '2px');

    // Add legend
    const legend = pieSvg
      .selectAll('.legend')
      .data(auditData)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr(
        'transform',
        (d, i) => `translate(${width / 2 - 100},${i * 20 - height / 2})`
      );

    legend
      .append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', (d) => color(d.label));

    legend
      .append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .text((d) => `${d.label}: ${d.value}`);

    // Group participation over time
    const groupData = data.group_user.map(g => ({
      date: new Date(g.group.createdAt),
      status: g.group.status,
      type: g.group.objectId ? 'Project' : 'Raid'
    }));

    const groupSvg = d3
      .select('#group-graph')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group participation timeline
    const groupX = d3
      .scaleTime()
      .domain(d3.extent(groupData, d => d.date))
      .range([0, width]);

    const groupY = d3
      .scaleBand()
      .domain(['Project', 'Raid'])
      .range([height, 0])
      .padding(0.1);

    const statusColor = d3.scaleOrdinal()
      .domain(['setup', 'working', 'audit', 'finished'])
      .range(['#fbbf24', '#3b82f6', '#9333ea', '#10b981']);

    // Add X axis
    groupSvg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(groupX));

    // Add Y axis
    groupSvg.append('g').call(d3.axisLeft(groupY));

    // Add dots for each group participation
    groupSvg
      .selectAll('.group-dot')
      .data(groupData)
      .enter()
      .append('circle')
      .attr('cx', d => groupX(d.date))
      .attr('cy', d => groupY(d.type))
      .attr('r', 5)
      .attr('fill', d => statusColor(d.status))
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.type}</strong><br>
                Status: ${d.status}<br>
                Date: ${d.date.toLocaleDateString()}`)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => tooltip.style('opacity', 0));

    // Add group status legend
    const groupLegend = groupSvg
      .selectAll('.group-legend')
      .data(statusColor.domain())
      .enter()
      .append('g')
      .attr('class', 'group-legend')
      .attr('transform', (d, i) => `translate(${width - 100},${i * 20})`);

    groupLegend
      .append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', d => statusColor(d));

    groupLegend
      .append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .text(d => d.charAt(0).toUpperCase() + d.slice(1));
  };
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
  });
});

fetchProfileData();

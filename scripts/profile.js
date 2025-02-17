import {
  renderXpChart,
  renderSkills,
  renderUserInfo,
  renderCoreStats,
  renderProjects,
  renderAuditRatio,
} from "./visualization.js";

import { handleLogout } from "./auth.js";
import { API } from "./config.js";

export const fetchProfileData = async () => {
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
      group(
        where: {members: {userId: {_eq: 3289}}, _or: [{eventId: {_eq: 20}}, {event: {parentId: {_eq: 20}}}]}
      ) {
        id
        status
        captainLogin
        captainId
        object{
          name
        }
        members {
          id
          userId
          userLogin
          userAuditRatio
          accepted
          user {
            firstName
            lastName
          }
        }
        updatedAt
      }
    }
  `;

  const response = await fetch(API.GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (response.ok) {
    const data = await response.json();
    // console.log(data.data);
    return data.data;
  } else {
    console.log("Failed to fetch profile data");
    return null;
  }
};

export const displayProfile = (data) => {
  renderSkills(data.skills);
  renderUserInfo(data.user[0], data.level[0].amount);
  renderCoreStats(data.user[0], data.xp.aggregate.sum.amount);
  renderProjects(data.projects, data.group);
  renderAuditRatio(data.user[0]);
  renderXpChart(data.progress);
  handleLogout();
};

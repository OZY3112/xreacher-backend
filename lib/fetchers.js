const axios = require("axios");

async function getListByUserId(apiKey, userId, cursor) {
  // const url = `https://twitter2.good6.top/api/base/apitools/blueVerifiedFollowersV2?apiKey=${encodeURIComponent(
  //  apiKey
  // )}&cursor=${encodeURIComponent(cursor)}&userId=${userId}`;

  const url = `https://twitter2.good6.top/api/base/apitools/blueVerifiedFollowersV2?apiKey=NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6%7C1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI&cursor=${cursor}&userId=${userId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        accept: "*/*",
      },
    });

    const body = response.data;
    console.log("verified body", body); // log the response body to the console

    // Record counts for future limiting
    const headers = response.headers;
    for (const headerName of Object.keys(headers)) {
      if (headerName.toLowerCase().includes("limit")) {
        const headerValue = headers[headerName];
      }
    }

    if (response.status === 429) {
      return "1";
    }

    return body;
  } catch (error) {
    console.error(error);
    return "0";
  }
}
async function getAllBlueFollowers(apiKey, userId, cursor, userData) {
  try {
    const jsonStr = await getListByUserId(apiKey, userId, cursor);

    const jsonObject = JSON.parse(jsonStr.data);

    const instructions =
      jsonObject.data.user.result.timeline.timeline.instructions;

    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];

      if (instruction.type === "TimelineAddEntries") {
        const userArrays = instruction.entries;

        for (let j = 0; j < userArrays.length; j++) {
          const content = userArrays[j].content;

          if (content.entryType === "TimelineTimelineItem") {
            const userJson = content.itemContent.user_results.result;

            // userData.push(userJson);
            console.log(userData.length);
          } else if (
            content.entryType === "TimelineTimelineCursor" &&
            content.cursorType === "Bottom"
          ) {
            const cursorValue = content.value;
            console.log(`index: ${j}, cursor = ${cursorValue}`);

            if (cursorValue.startsWith("0|")) {
              return;
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
            await getAllBlueFollowers(apiKey, userId, cursorValue, userData);
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function fetchNoneBlueFollowers(nextPageId, profile) {
  try {
    const options = {
      method: "GET",
      url: `https://twitter2.good6.top/api/base/apitools/followersList`,
      params: {
        apiKey:
          "NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6|1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI",
        cursor: nextPageId,
        screenName: profile,
      },
      headers: { accept: "*/*" },
    };

    const userData = await axios.request(options);
    const parsedData = await JSON.parse(userData.data.data);

    return parsedData;
  } catch (error) { }
}

async function userLookUp(profile) {
  try {
    const options = {
      method: "GET",
      url: `https://twitter2.good6.top/api/base/apitools/uerByIdOrNameLookUp`,
      params: {
        apiKey:
          "NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6|1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI",
        screenName: profile,
      },
      headers: { accept: "*/*" },
    };

    const res = await axios.request(options);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

async function unlockProfile(auth_token, ct0) {
  try {
    const options = {
      method: "GET",
      url: `https://twitter2.good6.top/api/base/apitools/unlockProfile`,
      params: {
        apiKey:
          "NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6|1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI",
        auth_token: auth_token,
        ct0: ct0,
      },
      headers: { accept: "*/*" },
    };
    const res = await axios.request(options);

    return res;
  } catch (error) {
  }
}

module.exports = { getListByUserId, unlockProfile, fetchNoneBlueFollowers, getAllBlueFollowers }
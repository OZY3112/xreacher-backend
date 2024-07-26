const axios = require("axios")
const User = require("../mongodb/user.model")
const Op = require("../mongodb/operation.model")
const Profile = require("../mongodb/profile.model")


function pickRandomString(strings) {
  const randomIndex = Math.floor(Math.random() * strings.length);
  return strings[randomIndex];
}

function shuffleTimer() {
  // Generate a random number between 1 and 4 representing minutes
  const randomMinutes = Math.floor(Math.random() * 4) + 1;

  // Convert minutes to milliseconds
  const timerDuration = randomMinutes * 60 * 1000;

  return timerDuration;
}

async function countdown(seconds) {
  return new Promise((resolve) => {
    let interval = setInterval(() => {
      // console.log(`Time remaining: ${seconds} seconds`);
      seconds--;

      if (seconds < 0) {
        clearInterval(interval);
        resolve("Timer completed");
      }
    }, 1000);
  });
}
async function sendDMs(
  users,
  profile,
  salesLetters,
  opId,
  currentUserId,
  sentDMs,
  totalDMsSent,
  maxDMsPerDay,
  usersDMedToday,
) {
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let terminated = false;
  for (const user of users) {
    // checks if the user terminated the compaign

    const firstName = user.name.split(" ");

    let dmSuccessful = false;

    // Randomize the sales letter
    const randomString = pickRandomString(salesLetters);
    // options for send dm request
    const options = {
      method: "GET",
      url: "https://twitter2.good6.top/api/base/apitools/sendDMS",
      params: {
        apiKey:
          "NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6|1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI",
        auth_token: profile.authTokens.auth_token,
        ct0: profile.authTokens.ct0,
        recipient_id: user.id,
        text: randomString.replace("[name]", firstName[0]),


        type: "message_create",
      },
      headers: { accept: "*/*" },
    };

    //send dm request
    await axios
      .request(options)
      .then(async (data) => {
        const timer = (ms) => new Promise((res) => setTimeout(res, ms));
        await timer(5000);
        console.log(`Sending DM to ${user.name}`);

        // console.log("direct", data.data);
        console.log("Server resonse", data.data);
        if (data.data?.msg === "SUCCESS" || data.data?.data?.recipient_id) {
          console.log(`
               DM sent to ${user.name}  successfully

               operation: ${opId}
               profile: ${profile._id}

               
               `, user);

          usersDMedToday.push({
            id: user.id,
            name: user.name,
          });
          await Profile.findOneAndUpdate(
            { _id: profile._id },
            {
              $push: {
                live_updates: {
                  messageType: "dm_sent",
                  message: `DM sent: ${user.name} `,
                },
              },
            }
          );

          await Op.findOneAndUpdate(
            { _id: opId },
            {
              $push: {
                usersDMed: {
                  id: user.id,
                },
              },
            }
          );

          await Profile.findOneAndUpdate(
            { _id: profile._id },
            {
              $push: {
                usersDMed: {
                  id: user.id,
                },
              },
            }
          );

          console.log(usersDMedToday.length);

          dmSuccessful = true;
          sentDMs++;
          totalDMsSent++;

          // termination functionality
          const op = await Op.findById(opId).select("_id status");
          let dateObj = new Date();
          let day = dateObj.getDate();
          let month = dateObj.getMonth() + 1; // months from 1-12
          let year = dateObj.getFullYear();
          let currentDate = day + "/" + month + "/" + year;

          console.log("OP status for:", opId, op.status);
          // if it's terminiated it will record the stats and end the op
          if (op.status === "TERMINATED") {
            await Profile.findOneAndUpdate(
              { _id: profile._id },
              {
                $push: {
                  statistics: {
                    date: currentDate,
                    usersDMed: usersDMedToday,
                    usersResponded: [],
                  },
                },
              }
            );

            console.log("TERMINATED", op._id);
            console.log("STATS RECORDED");
            terminated = true;
          }
        } else {
          if (data?.data?.data === "Unauthorized") {
            await Op.findOneAndUpdate(
              { _id: opId },
              {
                status: "TERMINATED",
              }
            );

            terminated = true;
          }
          if (
            data?.data?.data === "Unknown" ||
            data?.data?.data === "Too Many Requests"
          ) {
            console.log(data?.data?.data, profile._id);
            console.log("Resting for 40 minutes...", opId);
            await countdown(40 * 60);

            await Profile.findOneAndUpdate(
              { _id: profile._id },
              {
                $push: {
                  live_updates: {
                    messageType: "sleep",
                    message: `safety: Resting for 40 minutes...`,
                  },
                },
              }
            );
            // termination functionality
            const op = await Op.findById(opId).select("_id status");
            let dateObj = new Date();
            let day = dateObj.getDate();
            let month = dateObj.getMonth() + 1; // months from 1-12
            let year = dateObj.getFullYear();
            let currentDate = day + "/" + month + "/" + year;

            console.log("OP status for:", opId, op.status);
            // if it's terminiated it will record the stats and end the op
            if (op.status === "TERMINATED") {
              await Profile.findOneAndUpdate(
                { _id: profile._id },
                {
                  $push: {
                    statistics: {
                      date: currentDate,
                      usersDMed: usersDMedToday,
                      usersResponded: [],
                    },
                  },
                }
              );

              console.log("TERMINATED", op._id);
              console.log("STATS RECORDED");
              terminated = true;
            }

            const url = `https://twitter2.good6.top/api/base/apitools/unlock?apiKey=NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6%7C1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI&auth_token=${profile.authTokens.auth_token}&ct0=${profile.authTokens.ct0}`;

            const response = await axios.get(url, {
              headers: {
                accept: "*/*",
              },
            });
            console.log("unlocking: ", profile._id, response.data);
          }

          console.log(`Fail to send DM to ${user.name}`);
          dmSuccessful;
          sentDMs++;
        }
      })

    if (dmSuccessful) {
      if (usersDMedToday?.length < maxDMsPerDay) {
        console.log("going to wait for a minute...");


        // Shuffle the timer
        const timerDuration = shuffleTimer();
        console.log(`Timer set for ${timerDuration / 1000 / 60} minute(s).`);
        await delay(timerDuration);
        console.log("pause stopped");

      } else {
        console.log(
          "Maximum number of DMs reached for today. Stopping for a day."
        );


        await Profile.findOneAndUpdate(
          { _id: profile._id },
          {
            $push: {
              live_updates: {
                messageType: "sleep",
                message: `Sleep: DM limit exceeded for the day`,
              },
            },
          }
        );
        let dateObj = new Date();
        let day = dateObj.getDate();
        let month = dateObj.getMonth() + 1; // months from 1-12
        let year = dateObj.getFullYear();
        let currentDate = day + "/" + month + "/" + year;

        await Profile.findOneAndUpdate(
          { _id: profile._id },
          {
            $push: {
              statistics: {
                date: currentDate,
                usersDMed: usersDMedToday,
                usersResponded: [],
              },
            },
          }
        );
        usersDMedToday.splice(0, usersDMedToday.length);
        console.log("usersDMedToday: ", usersDMedToday);
        console.log(usersDMedToday.length);
        sentDMs = 0;



        console.log("Resting for 16 hours", opId);
        await countdown(7 * 60 * 60); // 20 hours in seconds
        console.log("Coundown done", opId);

        // unlocks the twitter profile
        const url = `https://twitter2.good6.top/api/base/apitools/unlock?apiKey=NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6%7C1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI&auth_token=${profile.authTokens.auth_token}&ct0=${profile.authTokens.ct0}`;

        const response = await axios.get(url, {
          headers: {
            accept: "*/*",
          },
        });
        console.log("Unlocked", response.data);


      }
    }

    if (terminated) {
      break;
    }
  }
}
async function sortUsers(users, options,
  //  usersDMed
) {
  let sortedUsers = users;

  console.log(options)

  sortedUsers = sortedUsers.filter(user => {
    const bio = user.description;
    // Check if bio is not empty and does not contain special characters
    // Adjust the regex pattern based on allowed characters
    return bio && /^[a-zA-Z0-9\s.,'-]+$/i.test(bio);
  });


  if (options.followers) {
    const res = await sortedUsers.filter(
      (person) =>
        person.followers >= options.followers[0] &&
        person.followers <= options.followers[1]
    );
    sortedUsers = res;
  }

  if (options.bioInclude && options.bioInclude.length !== 0) {
    console.log("bioInclude", options.bioInclude);
    const wordSet = new Set(options.bioInclude);
    const res = await sortedUsers.filter((user) => {
      const descriptionWords = user.description.split(" ");
      return descriptionWords
        .some((word) => wordSet.has(word.toLowerCase()));
    });
    sortedUsers = res;
  }

  if (options.bioExclude && options.bioExclude.length !== 0) {
    console.log("bioExclude", options.bioExclude);
    const wordSet = new Set(options.bioExclude);
    const res = await sortedUsers.filter((user) => {
      const descriptionWords = user.description.split(" ");
      return !descriptionWords
        .some((word) => wordSet.has(word.toLowerCase()));
    });
    sortedUsers = res;
  }

  // if (options.bioInclude && options.bioInclude.length !== 0) {
  //   console.log("bioInclude", options.bioInclude);
  //   const wordSet = new Set(options.bioInclude.map(word => word.toLowerCase()));
  //   console.log(wordSet)
  //   sortedUsers = await sortedUsers.filter((user) => {
  //     const descriptionWords = user.description.toLowerCase().split(/\s+/);
  //     return descriptionWords.some(word => wordSet.has(word));
  //   });
  // }
  // if (options.bioExclude && options.bioExclude.length !== 0) {
  //   console.log("bioExclude", options.bioExclude);
  //   const wordSet = new Set(options.bioExclude.map(word => word.toLowerCase()));
  //   console.log(wordSet)
  //   sortedUsers = await sortedUsers.filter((user) => {
  //     const descriptionWords = user.description.toLowerCase().split(/\s+/);
  //     return !descriptionWords.some(word => wordSet.has(word));
  //   });
  // }
  // location excludes
  if (options.locationExclude && options.locationExclude.length !== 0) {
    console.log("locationExclude", options.locationExclude);
    const wordSet = new Set(options.locationExclude);
    const res = await sortedUsers.filter((user) => {
      const descriptionWords = user.location.split(" ");
      return !descriptionWords.some((word) => wordSet.has(word.toLowerCase()));
    });
    sortedUsers = res;
  }
  if (options.locationInclude && options.locationInclude.length !== 0) {
    console.log("locationInclude", options.locationInclude);
    const wordSet = new Set(options.locationInclude);
    const res = await sortedUsers.filter((user) => {
      const descriptionWords = user.location.split(" ");
      return descriptionWords.some((word) => wordSet.has(word.toLowerCase()));
    });
    sortedUsers = res;
  }


  return sortedUsers;
}

module.exports = { sortUsers, sendDMs }
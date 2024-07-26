const express = require("express")
const cors = require("cors")
const connectToDB = require("./mongodb/connect.js");
const Op = require("./mongodb/operation.model.js");
const Profile = require("./mongodb/profile.model.js");
const { scrape } = require("./routes/scrape.js");
const { blueSea } = require("./routes/blueSea.js")

const app = express();
app.use(express.json());
 
// CORS
app.use(cors({ origin: ["http://localhost:3000", /\.xreacher.com$/] }));

const port = 4020; // old port was set to 3030
//const port = 3030; // old port was set to 3030

app.listen(port, (req, res) => {
  console.log("we are up and running");
  console.log(`Server is running on PORT: ${port}`);
});

// creating routes
app.get("/api", (req, res) => {
  res.send({ message: "Hello world!" });
  console.log("Hello world!");
});


app.get("/api/scrape", async (req, res) => {

  // const { opId } = req.query;
  const opId = "66960b2bca2135a160413721"
  scrape(opId, res);
});


app.get("/api/scrape/opensea", async (req, res) => {

  const { opId } = req.query;

  // const opId = "668b9b79f4c05ca1e17a26ad"
  blueSea(opId);

  return
})

// app.get("/api/record", async (req, res) => {
//   await connectToDB();

//   const profiles = await Profile.find({}).populate({
//     path: "operations",
//     model: Op,
//     select: "_id usersDMed usersResponded",
//   });

//   for (let profile of profiles) {
//     if (!profile) return;
//     if (!profile.authTokens) return;

//     const options = { method: "GET", headers: { accept: "*/*" } };

//     try {
//       const data = await axios.request(
//         `https://twitter2.good6.top/api/base/apitools/getDMSInitIdV2?apiKey=NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6%7C1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI&auth_token=${profile.authTokens.auth_token}&ct0=${profile.authTokens.ct0}`,
//         options
//       );

//       console.log(data.data);

//       if (data?.data?.msg !== "SUCCESS") {
//         console.log("Forbidden or Unauthorized");
//         continue;
//       }
//       const parsedDMs = await JSON.parse(data.data.data);
//       console.log("Parsed DMs", parsedDMs);

//       const dms = parsedDMs.inbox_initial_state.entries;

//       console.log(dms);

//       let days = [];
//       let DMedUsers = [];
//       let userResponded = [];

//       profile.statistics.forEach(async (day) => {
//         day.usersDMed.forEach((user) => {
//           for (let message of dms) {
//             console.log(message.message_data);
//             if (
//               message?.message_data.sender_id &&
//               message?.message_data.sender_id === user.id
//             ) {
//               let client = message?.message_data;

//               //  console.log(client);
//               DMedUsers.push({
//                 id: user.id,
//                 name: user.name,
//               });

//               userResponded.push({
//                 id: user.id,
//                 name: user.name,
//               });
//             } else {
//               DMedUsers.push({
//                 id: user.id,
//                 name: user.name,
//               });
//             }
//           }
//         });

//         let uniqueDMedUsers = [
//           ...new Map(DMedUsers.map((user) => [user.id, user])).values(),
//         ];
//         let uniqueDMedResponded = [
//           ...new Map(
//             [...userResponded, ...day.usersResponded].map((user) => [
//               user.id,
//               user,
//             ])
//           ).values(),
//         ];

//         days.push({
//           date: day.date,
//           usersDMed: uniqueDMedUsers,
//           usersResponded: uniqueDMedResponded,
//         });

//         DMedUsers = [];
//         userResponded = [];
//       });

//       let mergedData = {};

//       console.log(days);

//       days.reduce((acc, obj) => {
//         if (!acc[obj.date]) {
//           acc[obj.date] = {
//             date: obj.date,
//             usersDMed: [],
//             usersResponded: [],
//           };
//         }

//         let userDMedSet = new Set(
//           acc[obj.date].usersDMed.map((user) => user.id)
//         );
//         let userRespondedSet = new Set(
//           acc[obj.date].usersResponded.map((user) => user.id)
//         );

//         obj.usersDMed.forEach((user) => {
//           if (!userDMedSet.has(user.id)) {
//             acc[obj.date].usersDMed.push(user);
//             userDMedSet.add(user.id);
//           }
//         });

//         obj.usersResponded.forEach((user) => {
//           if (!userRespondedSet.has(user.id)) {
//             acc[obj.date].usersResponded.push(user);
//             userRespondedSet.add(user.id);
//           }
//         });

//         return acc;
//       }, mergedData);

//       let mergedArray = Object.values(mergedData);

//       console.log("full stats for: ", profile.name, mergedArray);

//       await Profile.findByIdAndUpdate(
//         {
//           _id: profile._id,
//         },
//         {
//           statistics: mergedArray,
//         }
//       );

//       mergedData = {};
//       days = [];
//       DMedUsers = [];
//       userResponded = [];
//       let dmsRepliedId = [];

//       for (let op of profile.operations) {
//         op.usersDMed.forEach((user) => {
//           for (let message of dms) {
//             if (
//               message?.message?.message_data.sender_id &&
//               message?.message?.message_data.sender_id === user.id
//             ) {
//               let client = message.message?.message_data;
//               console.log(client);
//               dmsRepliedId.push({
//                 id: client.sender_id,
//               });
//             }
//           }
//         });

//         dmsRepliedId = [...new Set(dmsRepliedId)];

//         await Op.findOneAndUpdate(
//           { _id: op._id },
//           {
//             usersResponded: [...dmsRepliedId],
//           }
//         );
//       }
//     } catch (err) {
//       throw new Error(err);
//     }
//   }

//   console.log("stats recorded.");
// });

app.get("/api/users/available", async (req, res) => {
  try {
    await connectToDB();

    const profiles = await Profile.find({});

    // Set all profiles' status to "AVAILABLE"
    const updatedProfiles = profiles.map((profile) => {
      profile.status = "AVAILABLE";
      return profile;
    });

    // Save all profiles
    await Promise.all(updatedProfiles.map((profile) => profile.save()));

    res.send({ message: "All profiles' status set to 'AVAILABLE'." });

    console.log("All profiles' status set to 'AVAILABLE'.");
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error." });
  }
});

app.get("/api/ops/terminate", async (req, res) => {
  try {
    await connectToDB();

    const ops = await Op.find({ status: "PENDING" });

    // Set all ops' status to "TERMINATED"
    const updatedOps = ops.map((op) => {
      op.status = "TERMINATED";
      return op;
    });

    console.log(updatedOps);

    // Save all ops
    await Promise.all(updatedOps.map((op) => op.save()));

    res.send({
      message: "All operations with status 'PENDING' have been terminated.",
    });

    console.log("All operations with status 'PENDING' have been terminated.");
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error." });
  }
});

// app.get("/api/bluesea", async (req, res) => {
//  await connectToDB();

//  for (let id of [
//   "WrongsToWrite",
//   "thejustinwelsh",
//   "thedankoe",
//   "AlexHormozi",
//  ]) {
//   let userData = [];

//   const blueIds = await BlueSea.find({}).select("_id id");
//   /*
//    * Recursively obtain blue authenticated users
//    */
//   async function getAllBlueFollowers(apiKey, userId, cursor) {
//    try {
//     const jsonStr = await getListByUserId(apiKey, userId, cursor);

//     const jsonObject = JSON.parse(jsonStr.data);
//     console.log(jsonObject);

//     const instructions =
//      jsonObject.data.user.result.timeline.timeline.instructions;
//     console.log(instructions);

//     for (let i = 0; i < instructions.length; i++) {
//      const instruction = instructions[i];

//      if (instruction.type === "TimelineAddEntries") {
//       const userArrays = instruction.entries;

//       for (let j = 0; j < userArrays.length; j++) {
//        const content = userArrays[j].content;

//        if (content.entryType === "TimelineTimelineItem") {
//         const userJson = content.itemContent.user_results.result;

//         userData.push(userJson);
//         console.log(userData.length);
//        } else if (
//         content.entryType === "TimelineTimelineCursor" &&
//         content.cursorType === "Bottom"
//        ) {
//         const cursorValue = content.value;
//         console.log(`index: ${j}, cursor = ${cursorValue}`);

//         if (cursorValue.startsWith("0|")) {
//          return;
//         }

//         await new Promise((resolve) => setTimeout(resolve, 500));
//         await getAllBlueFollowers(apiKey, userId, cursorValue);
//        }
//       }
//      }
//     }
//    } catch (error) {
//     console.error(error);
//    }
//   }

//   /*
//    * This method calls the v2 followers blue endpoint by user ID
//    */
//   async function getListByUserId(apiKey, userId, cursor) {
//     const url = `https://twitter2.good6.top/api/base/apitools/blueVerifiedFollowersV2?apiKey=NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6%7C1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI&cursor=${cursor}&userId=${userId}`;

//     try {
//       const response = await axios.get(url, {
//         headers: {
//           accept: "*/*",
//         },
//       });

//       const body = response.data;

//       // Log the response body
//       console.log("Response:", body);

//       // Record counts for future limiting
//       const headers = response.headers;
//       for (const headerName of Object.keys(headers)) {
//         if (headerName.toLowerCase().includes("limit")) {
//           const headerValue = headers[headerName];
//           console.log(`Header ${headerName}: ${headerValue}`);
//         }
//       }

//       if (response.status === 429) {
//         console.log("API rate limit exceeded");
//         return "1";
//       }

//       return body;
//     } catch (error) {
//       console.error("Error occurred:", error);
//       return "0";
//     }
//   }

//   const options = { method: "GET", headers: { accept: "*/*" } };
//   const apiKey =
//    "NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6|1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI";
//     const scrapeUserData = await axios.request(
//     `https://twitter2.good6.top/api/base/apitools/uerByIdOrNameLookUp?apiKey=NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6%7C1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI&screenName=${id}`,
//     options
//     );

//     if (scrapeUserData.data.data === "Not Found") {
//       console.error("User not found");
//       // Handle the error case here
//     } else {
//       const parsedScrapeUserData = JSON.parse(scrapeUserData.data.data);

//       console.log("parsed stuff", parsedScrapeUserData);

//       function removeUsersWithMatchingIds(userArray, idsToRemove) {
//         const idsToRemoveArray = idsToRemove.map((item) => item.id);
//         const filteredUsers = userArray.filter(
//           (user) => !idsToRemoveArray.includes(user.id)
//         );

//         return filteredUsers;
//       }

//       const userId = parsedScrapeUserData[0].id_str;
//       await getAllBlueFollowers(apiKey, userId, "-1");

//       const parsedUserData = userData?.map(({ rest_id, legacy }) => {
//         return {
//           id: rest_id,
//           screenName: legacy.screen_name,
//           name: legacy.name,
//           location: legacy.location.toLowerCase(),
//           description: legacy.description.toLowerCase(),
//           followers: legacy.followers_count,
//         };
//       });

//       const updatedUsers = removeUsersWithMatchingIds(parsedUserData, blueIds);

//       const filteredUsers = updatedUsers.filter(
//       (person) => person.followers >= 200
//       );

//       console.log(filteredUsers);
//       console.log(filteredUsers.length);

//       await BlueSea.insertMany([...filteredUsers]);
//     }
//   }
// });

//




const express = require("express")
const cors = require("cors")
const axios = require("axios")
const connectToDB = require("../mongodb/connect.js");
const Op = require("../mongodb/operation.model.js");
const User = require("../mongodb/user.model.js");
const { sendDMs, sortUsers } = require("../lib/index.js");
const Profile = require("../mongodb/profile.model.js");
const {
 getAllBlueFollowers,
 unlockProfile,
 fetchNoneBlueFollowers,
} = require("../lib/fetchers.js");
const { checkPaymentPlan } = require("../lib/checkers.js");

async function scrape(opId, res) {
 await connectToDB();


 const CurrOp = await Op.findById(opId);
 if (!CurrOp) {
  return res.status(404).send({ message: "Operation not found" });
 }
 res.send({ message: "scrape in progress!" });


 const profilesToBeUsed = await Profile.find({ _id: { $in: CurrOp.settings.profilesToBeUsed } }).select('authTokens _id');

 console.log(profilesToBeUsed)

 // add operation to profile
 await Profile.updateMany(
  { _id: { $in: profilesToBeUsed } },
  {
   status: "RUNNING",
  }
 );

 console.log(CurrOp);


 // vars 

 const apiKey =
  "NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6|1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI";

 let users = [];
 let limitCount = 0;
 let userData = [];


 let sentDMs = 0;
 let totalDMsSent = 0;
 let usersDMedToday = [];

 let maxDMsPerDay = 0;


 for (let profile of CurrOp.settings.scrapeProfiles) {
  console.log(profile)
  //new account
  let nextPageId = "-1";
  const user = await User.findById(CurrOp.user).select("_id paymentInfo");

  profilesToBeUsed.forEach(async (profile, index) => {

   unlockProfile(
    profile.authTokens.auth_token,
    profile.authTokens.ct0
   );
  })

  checkPaymentPlan(maxDMsPerDay, user.paymentInfo?.plan);
  // console.log(maxDMsPerDay);

  while (nextPageId != 0 || limitCount > 500) {
   let parsedUserData;

   if (CurrOp.options.verified) {
    const options = { method: "GET", headers: { accept: "*/*" } };

    const scrapeUserData = await axios.request(
     `https://twitter2.good6.top/api/base/apitools/uerByIdOrNameLookUp?apiKey=NJFa6ypiHNN2XvbeyZeyMo89WkzWmjfT3GI26ULhJeqs6%7C1539340831986966534-8FyvB4o9quD9PLiBJJJlzlZVvK9mdI&screenName=${profile}`,
     options
    );
    const parsedScrapeUserData = JSON.parse(scrapeUserData.data.data);

    const userId = parsedScrapeUserData[0].id_str;
    await getAllBlueFollowers(apiKey, userId, "-1", userData);

    parsedUserData = userData?.map(({ rest_id, legacy }) => {
     return {
      id: rest_id,
      name: legacy?.name,
      location: legacy?.location.toLowerCase(),
      description: legacy?.description.toLowerCase(),
      followers: legacy?.followers_count,
     };
    });


    nextPageId = 0;
   } else {
    const parsedData = await fetchNoneBlueFollowers(nextPageId, profile);
    parsedUserData = parsedData.users?.map(
     ({ id_str, name, location, description, followers_count }) => {
      return {
       id: id_str,
       name,
       location: location.toLowerCase(),
       description: description.toLowerCase(),
       followers: followers_count,
      };
     }
    );
    nextPageId = parsedData.next_cursor_str;
   }

   limitCount++;

   users = [...parsedUserData];

   console.log("users fetched: ", users.length);
   console.log("parsing...");

   const sortedUsers = await sortUsers(
    parsedUserData,
    CurrOp.options,
    // profileData.usersDMed
   );

   console.log("found prospects: ", sortedUsers.length);
   console.log("found prospects: ", sortedUsers);


   const dmsPerProfile = Math.floor(sortedUsers.length / profilesToBeUsed.length);
   let dmPromises = [];

   if (sortedUsers.length < profilesToBeUsed.length) {
    const randomIndex = Math.floor(Math.random() * profilesToBeUsed.length);
    const randomProfile = profilesToBeUsed[randomIndex];

    await sendDMs(
     sortedUsers,
     randomProfile,
     CurrOp.scripts,
     opId,
     profile._id,
     sentDMs,
     totalDMsSent,
     CurrOp.settings.dmsPerDay,
     usersDMedToday,
    );
   } else {


    profilesToBeUsed.forEach(async (profile, index) => {
     let start = index * dmsPerProfile;
     let end = start + dmsPerProfile;
     let slicedUsers = users.slice(start, end);

     let promise = sendDMs(
      slicedUsers,
      profile,
      CurrOp.scripts,
      opId,
      profile._id,
      sentDMs,
      totalDMsSent,
      CurrOp.settings.dmsPerDay,
      usersDMedToday,
     );
     dmPromises.push(promise);
    });

    maxDMsPerDay,
     await Promise.all(dmPromises);
    }

    
    let op = await Op.findById(opId).select("_id status");
    let dateObj = new Date();
   if (op.status === "TERMINATED") {
    await Profile.updateMany(
     { _id: CurrOp.settings.profilesToBeUsed },
     {
      $push: {
       statistics: {
        date: dateObj,
        usersDMed: usersDMedToday,
        usersResponded: [],
       },
      },
     }
    );

    console.log("TERMINATED", opId);
    console.log("STATS RECORDED");
    break;
   }
   console.log("another one.");
  }
 }

 let dateObj = new Date();
 let day = dateObj.getDate();
 let month = dateObj.getMonth() + 1; // months from 1-12
 let year = dateObj.getFullYear();
 let currentDate = day + "/" + month + "/" + year;

 const opData = await Op.findById(opId).select("_id status");


 if (opData.status === "PENDING") {
  await Profile.updateMany(
   { _id: CurrOp.settings.profilesToBeUsed },
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

  console.log("statistics recorded!");
 }
 const totalDms = await Op.findById(opId).select("usersDMed");

 await Op.findOneAndUpdate(
  { _id: opId },
  {
   status: "COMPLETED",
  }
 );

 await Profile.updateMany(
  { _id: CurrOp.settings.profilesToBeUsed },
  {
   status: "AVAILABLE",
   $push: {
    live_updates: {
     messageType: "done",
     message: `Scrape done: ${totalDms.usersDMed.length} Dms sent`,
    },
   },
  }
 );

 console.log("scrape is complete");
 return;
}

module.exports = { scrape }
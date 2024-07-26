const { sendDMs } = require("../lib/index.js");
const BlueSea = require("../mongodb/BlueSea.model");
const connectToDB = require("../mongodb/connect");
const Op = require("../mongodb/operation.model");
const Profile = require("../mongodb/profile.model");


async function blueSea(opId) {
 await connectToDB();

 const currOp = await Op.findById(opId);


 if (!currOp) {
  return res.status(404).send({ message: 'Operation not found' });
 }

 const profilesToBeUsed = await Profile.find({ _id: { $in: currOp.settings.profilesToBeUsed } }).select('authTokens _id');

 console.log(profilesToBeUsed)

 // add operation to profile
 await Profile.updateMany(
  { _id: { $in: profilesToBeUsed } },
  {
   status: "RUNNING",
  }
 );

 const dmsPerProfile = Math.floor(currOp.settings.dmsPerDay / profilesToBeUsed.length);

 let usersDMedToday = [];


 // Construct the query based on the operation parameters
 let query = {};

 if (currOp.options.bioExclude.length) {
  query.description = { $not: { $regex: currOp.options.bioExclude.join("|"), $options: 'i' } };
 }

 if (currOp.options.bioInclude.length) {
  query.description = { $regex: currOp.options.bioInclude.join("|"), $options: 'i' };
 }

 if (currOp.options.locationInclude.length) {
  query.location = { $regex: currOp.options.locationInclude.join("|"), $options: 'i' };
 }

 if (currOp.options.locationExclude.length) {
  query.location = { $not: { $regex: currOp.options.locationExclude.join("|"), $options: 'i' } };
 }

 if (currOp.options.followers.length === 2) {
  query.followers = { $gte: currOp.options.followers[0], $lte: currOp.options.followers[1] };
 }

 if (currOp.options.following.length === 2) {
  query.following = { $gte: currOp.options.following[0], $lte: currOp.options.following[1] };
 }

 console.log(query);


 let dmPromises = [];

 const batchSize = 500; // Number of users to fetch per page
 let page = 0;
 let hasMoreUsers = true;

 while (hasMoreUsers) {
  const skipAmount = page * batchSize;
  const users = await BlueSea.find({})
   .select('id name')
   .limit(batchSize)
   .skip(skipAmount);

  console.log(users)

  if (users.length === 0) {
   hasMoreUsers = false; // Stop the loop if no more users are fetched
  } else {
   const dmsPerProfile = Math.floor(users.length / profilesToBeUsed.length);
   let dmPromises = [];

   profilesToBeUsed.forEach(async (profile, index) => {
    let start = index * dmsPerProfile;
    let end = start + dmsPerProfile;
    let slicedUsers = users.slice(start, end);

    let promise = sendDMs(
     slicedUsers,
     profile,
     currOp.scripts,
     sentDMs,
     0,
     currOp.settings.dmsPerDay,
     usersDMedToday,
    );
    dmPromises.push(promise);
   });

   await Promise.all(dmPromises);

  }
  page++; // Increment page to fetch the next batch of users
 }

 let dateObj = new Date();
 let day = dateObj.getDate();
 let month = dateObj.getMonth() + 1; // months from 1-12
 let year = dateObj.getFullYear();
 let currentDate = day + "/" + month + "/" + year;

 const opData = await Op.findById(opId).select("_id status");


 if (opData.status === "PENDING") {
  await Profile.updateMany(
   { _id: currOp.settings.profilesToBeUsed },
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
  { _id: currOp.settings.profilesToBeUsed },
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

 return
}

module.exports = { blueSea }
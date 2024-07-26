const mongoose = require("mongoose");

const OperationSchema = new mongoose.Schema(
 {
  title: String,
  user: {
   type: mongoose.Schema.Types.ObjectId,
   ref: "user",
  },
  progress: Number,
  settings: {
   profilesToBeUsed: [
    {
     type: mongoose.Schema.Types.ObjectId,
     ref: "profile",
    },
   ],
   dmsPerDay: Number,
   skipPreviouslyContacted: Boolean,
   crossAccountPrevent: Boolean,
   scrapeProfiles: [String]
  },

  options: {
   bioExclude: [String],
   bioInclude: [String],
   locationInclude: [String],
   locationExclude: [String],
   followers: [Number],
   following: [Number],
   verified: Boolean,
  },

  status: String,
  usersDMed: [{ id: String }],
  usersResponded: [{ id: String }],
  scripts: [String],
 },
 {
  timestamps: true,
 }
);

const Op =
 mongoose.models.operation || mongoose.model("operation", OperationSchema);

module.exports = Op;

function checkPaymentPlan(maxDMsPerDay, plan) {
  switch (plan) {
    case "price_1OP32TH5JVWNW8rNaZkUVxEv":
      // Execute code for basic plan
      maxDMsPerDay = 100;
      break;
    case "price_1OP34iH5JVWNW8rNgMrWPZlf":
      // Execute code for standard plan
      maxDMsPerDay = 200;
      break;
    case "price_1OP35uH5JVWNW8rNOq5BHgo5":
      // Execute code for premium plan
      maxDMsPerDay = 400;
      break;
    default:
      console.log("User does not have any of the available plans");
      return;
  }
}

module.exports = { checkPaymentPlan }
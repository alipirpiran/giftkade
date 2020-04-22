const CronJob = require('cron').CronJob;
const cleanUpTokens = require('./cleanUpTokens');

// check db for pending tokens every 20 min.
const job = new CronJob('* */20 * * * *', cleanUpTokens, null, true);

job.start();

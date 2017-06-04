const PAIR = ["BTC", "ETH"];
const STOP_LOSS = 0.06;
const TAKE_PROFIT = 0.09;

var fs = require('fs'),
    config = require('dotenv').config(),
	cp = require('child_process'),
	request = require('request'),
	cron = require('node-cron'),
	chalk = require('chalk'),
	Poloniex = require('poloniex.js'),
	poloniex = new Poloniex(process.env.POLO_KEY, process.env.POLO_SECRET);




function tick(pairs) {

	return new Promise((resolve, reject) => {
		poloniex.returnTicker((err, data) => {
			if (err) reject(err);
			else resolve(data);
		})
	})
}



var task = cron.schedule('*/10 * * * * *', function () {
	var time = (new Date).toString('utf-8').split('GMT')[0];
	tick().then((result) => {

		poloniex.getMarginPosition(PAIR[0], PAIR[1],
			(err, data) => {
				if (!err) {
					var pair = result[PAIR.join('_')];
					var pl = data.pl > 0 ? chalk.green.bold(data.pl) : chalk.red.bold(data.pl);
					console.log(`${chalk.bold.yellow(time)}\n`,
							`last:  ${chalk.bold(pair.last)}\n`,
							`lowestAsk: ${chalk.bold(pair.lowestAsk)}\n`,
						 	`highestBid: ${chalk.bold(pair.highestBid)}\n`,
							`pl: ${pl}\n`);

					// close any open margins in the given currency pair at the appropriate trigger prices
					if (pair.highestBid <= STOP_LOSS ||
					    pair.lowestAsk >= TAKE_PROFIT) {
						console.log(chalk.bold.yellow(time), chalk.bold.red('CLOSING MARGIN POSITION'));
						poloniex.closeMarginPosition(PAIR[0], PAIR[1],
							function (err, result) {
								if (err) console.log(err);
								else console.log(result);
						});
					}
				} else {
					console.log(err);
				}
			})
	});
});

const xoauth2 = require("xoauth2");
module.exports = {
	emailFrom: "tnah@rvn.com",
	smtpOptions: {
		service: "gmail",
		auth: {
			xoauth2: xoauth2.createXOAuth2Generator({
				user: "yellowdragon1999qn@gmail.com",
				clientId:
					"586327316542-9mtefisavm8ula4d4thbdu1391i2dhu5.apps.googleusercontent.com",
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				refreshToken: process.env.GOOGLE_CLIENT_REFRESH,
			}),
		},
	},
	smtpOptions2: {
		service: "gmail",
		auth: {
			user: "greatestauctionever",
			pass: "greatestauctionever123456789",
		},
	},
};

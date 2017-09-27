const fs = require('fs');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));

exports.auth = function(req, res, next) {
	if(req.session && req.cookies && req.session.sessionId == req.cookies.sessionId) {
		next();
	} else {
		res.status(401).json({
			message: messages.notAuthorized
		});
	}
}
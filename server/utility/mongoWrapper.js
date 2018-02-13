var Q = require('q');

exports.findAll = function(db, collection, query, limit, skip) {
	var deferred = Q.defer();
	db.collection(collection).find(query).limit(limit || 999999).skip(skip || 0).toArray().then(function(docs) {
		deferred.resolve(docs);
	}).catch(function(err) {
		deferred.reject(new Error(err));
	})

	return deferred.promise;
} 
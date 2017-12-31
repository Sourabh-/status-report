var Q = require('q');

exports.findAll = function(db, collection, query, limit, skip) {
	var deferred = Q.defer();
	db.collection(collection).find(query).limit(limit || '').skip(skip || '').then(function(docs) {
		deferred.resolve(docs);
	}).catch(function(err) {
		deferred.reject(new Error(err));
	})

	return deferred.promise;
} 
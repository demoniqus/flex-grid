/**
 * Универсальное самоочищающееся хранилище.
 * При удалении всех ссылок на объект хранилище автоматически освобождает выделенное для объекта место под хранение дополнительной информации
 * @type {{get: (function(*=): any|null), create: (function(*=): any), remove: (function(*=): any)}}
 */
export const Storage = new function(){
	let storage = new WeakMap();

	let pub = {
		create: function(object){
			//Выделяем место в хранилище для объекта
			if (!storage.has(object)) {
				let o = {};
				storage.set(object, o);
				return o;
			}
			return storage.get(object);
		},
		get: function(object){
			return /*storage.has(object) ?*/ storage.get(object) //:
			//null;
			// return storage.has(object) ?
			// 	storage.get(object) :
			// 	null;
		},
		remove: function (object) {
			//Принудительно освобождаем выделенное под объект место в хранилище
			let container = storage.has(object) ? storage.get(object) : null;
			storage.has(object) && (storage.delete(object));
			return container;
		},
		// create: function(object){
		// 	//Выделяем место в хранилище для объекта
		// 	!storage.has(object) && storage.set(object, {});
		// 	return storage.get(object);
		// },
		// get: function(object){
		// 	return storage.has(object) ?
		// 		storage.get(object) :
		// 		null;
		// },
		// remove: function (object) {
		// 	//Принудительно освобождаем выделенное под объект место в хранилище
		// 	let container = storage.has(object) ? storage.get(object) : null;
		// 	storage.has(object) && (storage.delete(object));
		// 	return container;
		// },
	};

	return pub;
}


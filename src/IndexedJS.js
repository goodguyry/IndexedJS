/**
 * IndexedJS
 * Initialize the database
 *
 * @param {String} name Database name
 */
function IndexedJS(name) {
  'use strict';

  // Include prefixed implementations
  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  this._schema = {};
  this._schema.database = name || null;
  this._db = null;

  if (! name) {
    throw 'IndexedJS Schema error: You must specify a database name.';
  }

  return this;
}


/**
 * IndexedJS.schema
 * Define the database schema
 *
 * @param {Object} schema The database schema values
 */
IndexedJS.prototype.schema = function(schema) {
  schema = schema || {};

  if (! Array.isArray(schema.stores)) {
    throw 'IndexedJS Schema error: The `stores` schema property must be an Array';
  }

  if (! schema.version) {
    throw 'IndexedJS Schema error: You must specify a database version number (int).';
  }

  this._schema.version = schema.version || null;
  this._schema.stores = schema.stores || null;

  return this;
};


/**
 * IndexedJS.open
 * Open the database
 */
IndexedJS.prototype.open = function() {

  var setKey,
      self = this;

  /**
   * Key Path vs. Key Generator
   *
   * @returns the keyPath setting for the passed options object
   * https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#Structuring_the_database
   */
  function setKeyOption(options) {
    if (options.keyPath) {
      // Use a key path
      return { keyPath: options.keyPath };
    } else if (options.autoIncrement) {
      // Use a key generator
      return { autoIncrement: true };
    } else {
      return false;
    }
  }

  // IDBOpenDBRequest
  var request = window.indexedDB.open(self._schema.database, self._schema.version);

  // Sets up the datastore
  // Only on first run and version change
  request.onupgradeneeded = function(e) {
    var db = e.target.result;
    var objStore;

    e.target.result.onerror = function(e) {
      console.error('IndexedJS: ' + e.target.error.name + ': ' + e.target.error.message);
    };

    // Create the ObjectStores
    for(var i = 0; i < self._schema.stores.length; i++) {

      if(db.objectStoreNames.contains(self._schema.stores[i].name)) {
        db.deleteObjectStore(self._schema.stores[i].name);
      }

      // Set the key option
      setKey = setKeyOption(self._schema.stores[i]);

      if(!db.objectStoreNames.contains(self._schema.stores[i].name)) {
        // Create the ObjectStore
        if (setKey) {
          objStore = db.createObjectStore(self._schema.stores[i].name, setKey);
        }
        // Create indexes by which environments can be found
        if (self._schema.stores[i].indexes) {
          for (var key in self._schema.stores[i].indexes) {
            // store.createIndex("String", "String", { unique: Boolean });
            objStore.createIndex(key, key, { unique: self._schema.stores[i].indexes[key] });
          }
        }
      }
    }

  };

  request.onsuccess = function(e) {
    // Assign the reult back to the IndexedJS Object
    self._db = e.target.result;
    console.log('IndexedJS.open: Successful', self._db);
  };

  request.onerror = function(e) {
    console.error('IndexedJS (IDBOpenDBRequest)', e.target.error.name + ':', e.target.error.message);
  };

  return self;
};


/**
 * IndexedJS.in
 * Sets the ObjectStore(s) for a transaction
 *
 * @param {Array|String}  stores ObjectStore(s) to access
 */
IndexedJS.prototype.in = function(stores) {

  this._in = [];

  if (! stores || ! (Array.isArray(stores) || typeof stores === 'string')) {
    console.error('IndexedJS: A String of one ObjectStore or Array of ObjectStores is required.');
    return false;
  }

  // Test for type; convert a String to an Array
  if (typeof stores === 'string') {
    // Convert the String into an Array
    stores = new Array(stores)
  }

  // Make sure each of the stores is a valid ObjectStore name
  var globalStores = this._schema.stores;

  for (var i = 0; i < stores.length; i++) {
    for (var j = 0; j < globalStores.length; j++) {
      if (stores[i] === globalStores[j].name) {
        // Add to IndexedJS Object
        this._in.push(stores[i]);
        break;
      }
    }
  }

  return this;
};


/**
 * IndexedJS.count
 * Count objects in an ObjectStore
 *
 * @param {Array}  stores ObjectStores to access
 */
IndexedJS.prototype.count = function(stores) {

  if (! stores) {
    console.error('IndexedJS: count() requires an Array of ObjectStores as its argument.');
    return false;
  }

  if (! (Array.isArray(stores) || typeof stores === 'string')) {
    console.error('IndexedJS: A String of one ObjectStore or Array of ObjectStores is required.');
    return false;
  }

  // Test for type; convert a String to an Array
  if (typeof stores === 'string') {
    // Convert the String into an Array
    stores = new Array(stores)
  }

  var self = this,
      objStore, request;

  if (self._db) {

    self._count = [];

    var transaction = self._db.transaction(stores, 'readonly'),
        request;

    // IDBTransaction.objectStore() accepts a String
    // Loop through the Array
    for (var i = 0; i < stores.length; i++) {
      objStore = transaction.objectStore(stores[i]);
      // Count the stored objects
      request = objStore.count();

      request.onsuccess = function(e) {
        // The number of objects found
        self._count.push(e.target.result);
        console.log('count', self._count);
      };

      request.onerror = function(e) {
        console.error('IndexedJS: ' + e.target.error.name + ': ' + e.target.error.message);
      };

      transaction.oncomplete = function() {
        console.log('IndexedJS.count: Complete', self._count);
      };
    }
  }
};


/**
 * IndexedJS.add
 * Add to ObjectStore(s)
 */
IndexedJS.prototype.add = function(data) {

  if (!this._in) {
    console.error('IndexedJS.add: You must specify an ObjectStore.');
    return false;
  }

  var self = this,
      objStore,
      request;

  if (self._db) {
    var transaction = self._db.transaction(self._in, 'readwrite');

    // IDBTransaction.objectStore() accepts a String
    // Loop through the Array
    for (var i = 0; i < self._in.length; i++) {
      objStore = transaction.objectStore(self._in[i]);
      request = objStore.add(data);
    }

    request.onsuccess = function(e) {
      self._result = e.target.result;
      console.log('IndexedJS.add: ' + self._result + ' successful');
    };

    request.onerror = function(e) {
      console.error('IndexedJS: ' + e.target.error.name + ': ' + e.target.error.message);
    };

    transaction.oncomplete = function(e) {
      console.log('IndexedJS.add: Complete');
    };

  }

  return self;
}

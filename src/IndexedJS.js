/**
 * IndexedJS
 * Initialize the database
 *
 * @param {Object} The scheme with which to create the database,
 *                 along with success, error and complete callbacks to be used by IndexedJS.open
 */
function IndexedJS(options) {
  'use strict';

  // Include prefixed implementations
  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  options = options || {};
  this.opts = {};
  this.opts.database = options.name || null;
  this.opts.version = options.version || null;
  this.opts.store = options.store || null;

  if (!this.opts.database || !this.opts.version) {
    console.error('You must specify a name and version number (int) for the database');
  }

  /**
   * Key Path vs. Key Generator
   * https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#Structuring_the_database
   */
  this.opts.keyPath = options.keyPath || false;
  this.opts.autoIncrement = options.autoIncrement || false;
  this.opts.indexes = options.indexes || null;

  this.opts.onsuccess = options.onsuccess || false;
  this.opts.onerror = options.onerror || false;

  this.db = null;

  this.open(this.opts);
}

/**
 * IndexedJS.open
 * Open the database
 *
 * @param {Object} opts The options parsed by the IndexedJS object
 */
IndexedJS.prototype.open = function(opts) {
  var setKey;

  if (opts.keyPath) {
    // Use a key path
    setKey = { keyPath: opts.keyPath };
  } else if (opts.autoIncrement) {
    // Use a key generator
    setKey = { autoIncrement: true };
  } else {
    setKey = false;
  }

  var request = indexedDB.open(opts.database, opts.version);

  // Sets up the datastore
  // Only on first run and version change
  request.onupgradeneeded = function(e) {
    var db = e.target.result;
    var objStore;

    e.target.result.onerror = function(e) {
      console.error('IndexedJS.onupgradeneeded: Error', e);
    };

    if(db.objectStoreNames.contains(opts.store)) {
      db.deleteObjectStore(opts.store);
    }

    if(!db.objectStoreNames.contains(opts.store)) {
      // Create the ObjectStore
      if (setKey) {
        objStore = db.createObjectStore(opts.store, setKey);
      }
      // Create indexes by which environments can be found
      if (opts.indexes) {
        for (var key in opts.indexes) {
          // store.createIndex("String", "String", { unique: Boolean });
          objStore.createIndex(key, key, { unique: opts.indexes[key] });
        }
      }
    }

  };

  request.onsuccess = function(e) {
    IndexedJS.db = e.target.result;
    console.log('IndexedJS.open: Successful');
    if (opts.onsuccess) {
      opts.onsuccess(e);
    }
  };

  request.onerror = function(e) {
    console.error(request.errorCode);
    if (opts.onerror) {
      opts.onerror(e);
    }
  };

};

/**
 * IndexedJS.verifyOptions
 * Verify all options are set and accounted for
 *
 * @param {Object} The options passed to one of the IndexedJS methods
 * @return {Object} The verified options object, ready to be used
 */
IndexedJS.prototype.verifyOptions = function(options) {
  var opts = options || {};
  opts.mode = options.mode || "readonly";
  opts.index = options.index || false;
  opts.key = options.key || false;
  opts.data = options.data || [];

  opts.cursor = options.cursor || false;
  opts.cursor.bound = options.cursor.bound || null;
  opts.cursor.only = options.cursor.only || false;
  opts.cursor.lower = options.cursor.lower || false;
  opts.cursor.upper = options.cursor.upper || false;
  opts.cursor.advance = options.cursor.advance || false;

  opts.onerror = options.onerror || false;
  opts.oncomplete = options.oncomplete || false;
  opts.onsuccess = options.onsuccess || false;

  return opts;
};

/**
 * IndexedJS.query
 * Query the database
 *
 * @param {Object} Definition of [how/for what] to query the database, along with success, error and complete callbacks
 * @param {Array}  An array of object store to query
 */
IndexedJS.prototype.query = function(queryOptions, storeArray) {
  var options = this.verifyOptions(queryOptions);

  if (!storeArray) {
    storeArray = this.opts.store;
    console.warn('IndexedJS.query: No Object Store given; assuming "'+storeArray+'"');
  }

  if (options.key || options.index || options.cursor) {
    // If both are declared, use the keyPath (since it's guaranteed unique)
  } else {
    console.error('IndexedJS.query: You must specify a search value (keyPath or index).');
    console.info('See http://github.com/goodguyry/IndexedDB.js for documentation.');
    return false;
  }

  if (IndexedJS.db) {
    var transaction = IndexedJS.db.transaction(storeArray, options.mode);
    var objStore = transaction.objectStore(storeArray);

    var result;

    // search precedence: cursor, key, index

    /**
     * Cursor: Find all or a range of objects
     * https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor
     **/
    if (options.cursor) {

      var cursor, keyRange = null;

      // To exclude the searched item, the second IDBKeyRange argument should be true
      // But setting `include` is more intuitive (IMHO) than setting `exclude`
      // So if `include` is false, we set the open bound argument to true and vice versa
      // If include is an array, make sure both of its values are set
      if (typeof options.cursor.include === "object") {
        if (options.cursor.include.length === 0) {
          options.cursor.include[0] = false;
          options.cursor.include[1] = false;
        } else if (options.cursor.include.length === 1) {
          options.cursor.include[1] = false;
        }
      } else {
        options.cursor.include = options.cursor.include || false;
      }

      if (options.cursor.bound === false) {
        // no bound (cursor over all keys)
        cursor = objStore.openCursor();
        console.log('IndexedJS.query: Cursor set to iterate over all object store keys');
      } else if (options.cursor.only) {
        // only the specified key
        keyRange = IDBKeyRange.only(options.cursor.only);
        cursor = objStore.openCursor(keyRange);
        console.log('IndexedJS.query: Cursor set to iterate over one specific object store key');
      } else if (options.cursor.lower && options.cursor.upper) {
        // between these two keys
        keyRange = IDBKeyRange.bound(options.cursor.lower, options.cursor.upper, !options.cursor.include[0], !options.cursor.include[1]);
        cursor = objStore.openCursor(keyRange);
        console.log('IndexedJS.query: Cursor set to iterate between a range of object store keys');
      } else if (options.cursor.lower) {
        // lowerBound
        // Cursor over all keys above the specified key
        keyRange = IDBKeyRange.lowerBound(options.cursor.lower, !options.cursor.include);
        cursor = objStore.openCursor(keyRange);
        console.log('IndexedJS.query: Cursor set to iterate over all object store keys above the specified key');
      } else if (options.cursor.upper) {
        // upperBound
        // Cursor over all keys below the specified key
        keyRange = IDBKeyRange.upperBound(options.cursor.upper, !options.cursor.include);
        cursor = objStore.openCursor(keyRange);
        console.log('IndexedJS.query: Cursor set to iterate over all object store keys below the specified key');
      } else {
        // default to query all
        cursor = objStore.openCursor();
        console.log('IndexedJS.query: Cursor set to iterate over all object store keys');
      }

      // Cursor through all saved environments
      cursor.onsuccess = function(e) {
        var moveCursor;
        result = e.target.result;
        if (result) {
          console.dir(result.value);

          if (options.onsuccess) {
            options.onsuccess.call(result);
          }

          if (options.cursor.advance) {
            result.advance(options.cursor.advance);
          } else {
            result.continue();
          }
        }
      };

      transaction.oncomplete = function() {
        console.log('IndexedJS.query: Complete');
        if (options.oncomplete) {
          if (options.data) {
            options.oncomplete(options.data);
          } else {
            options.oncomplete();
          }
        }
      };

    } else if (options.key || options.index) {
      var request;

      if (options.key) {
        // Get the stored object based on the keyPath
        request = objStore.get(options.key);
        console.log('IndexedJS.query: Querying for '+options.key);
      } else if (options.index) {
        console.log('IndexedJS.query: Querying for '+options.index);
        // The index name is the options.index.______ property name
        // Since we won't know it, we grab it and use it to get the property's value
        var indexName = Object.keys(options.index)[0];
        var indexValue = options.index[indexName];
        // Get the stored object based on an index
        request = objStore.index(indexName).get(indexValue);
      }

      request.onsuccess = function(e) {
        // Object found
        result = e.target.result;
        console.log(result);
        if (options.onsuccess) {
          options.onsuccess.call(result);
        }
      };

      transaction.oncomplete = function() {
        console.log('IndexedJS.query: Complete');
        if (options.oncomplete) {
          options.oncomplete();
        }
      };

    }

  }

};

/**
 * IndexedJS.add
 * Add information to an object store
 *
 * @param {Object} The data to be saved, along with success, error and complete callbacks
 * @param {Array}  An array of object store to query
 */
IndexedJS.prototype.add = function(addOptions, storeArray) {
  var options = this.verifyOptions(addOptions);

  if (!storeArray) {
    storeArray = this.opts.store;
    console.warn('IndexedJS.add: No Object Store given; assuming "'+storeArray+'"');
  }

  if (!options.data) {
    console.error('You must specify an object to be saved.');
    console.info('See http://github.com/goodguyry/IndexedDB.js for documentation.');
    return false;
  }

  if (IndexedJS.db) {
    var transaction = IndexedJS.db.transaction(storeArray, 'readwrite');
    var objStore = transaction.objectStore(storeArray);
    var request = objStore.put(options.data);

    request.onsuccess = function(e) {
      result = e.target.result;
      console.log('IndexedJS.add: '+result+' successful');
      if (options.onsuccess) {
        options.onsuccess.call(result);
      }
    };

    request.onerror = function(e) {
      if (options.onerror) {
        options.onerror(e);
      } else {
        console.error(request.errorCode);
      }
    };

    transaction.oncomplete = function(e) {
      console.log('IndexedJS.add: Complete');
      if (options.oncomplete) {
        options.oncomplete();
      }
    };

  }

};

/**
 * IndexedJS.delete
 * Remove data from an object store
 *
 * @param {Object} The data to be removed, along with error and complete callbacks
 * @param {Array}  An array of object store to query
 */
IndexedJS.prototype.delete = function(deleteOptions, storeArray) {
  var options = this.verifyOptions(deleteOptions);

  if (!storeArray) {
    storeArray = this.opts.store;
    console.warn('IndexedJS.delete: No Object Store given; assuming "'+storeArray+'"');
  }

  if (!options.key) {
    console.error('IndexedJS.delete: You must specify a key value for the object to be deleted.');
    console.info('See http://github.com/goodguyry/IndexedDB.js for documentation.');
    return false;
  }

  if (IndexedJS.db) {
    var transaction = IndexedJS.db.transaction(storeArray, 'readwrite');
    var objStore = transaction.objectStore(storeArray);
    var request = objStore.delete(options.key);

    request.onerror = function(e) {
      if (options.onerror) {
        options.onerror(e);
      } else {
        console.error(request.errorCode);
      }
    };

    transaction.oncomplete = function(e) {
      console.log('IndexedJS.delete: Complete');
      if (options.oncomplete) {
        options.oncomplete();
      }
    };

  }

};

IndexedJS
========
A no-frills wrapper for [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
.

**Distributions**

The [production version](https://github.com/goodguyry/IndexedJS/blob/master/dist/IndexedJS.min.js) (1218 bytes gzipped) and [development version](https://github.com/goodguyry/IndexedJS/blob/master/src/IndexedJS.js).

# Usage

**Contents**

- [Creating and opening the database](#creating-and-opening-the-database)
- [DOM Event handlers and ``this``](#dom-event-handlers-and-this)
- [Querying the ObjectStore](#querying-the-objectstore)
  - [Options](#options)
  - [Using a cursor](#using-a-cursor)
  - [Setting a keyRange](#setting-a-keyrange)
  - [Collecting values from the cursor](#collecting-values-from-the-cursor)
- [Adding to/updating the ObjectStore](#adding-toupdating-the-objectstore)
- [Deleting from the ObjectStore](#deleting-from-the-objectstore)
- [Todo](#todo)

## Creating and opening the database

[IDBFactory reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory)

To create a new database, declare an object with properties for each of the required IndexedDB values, as well as additional values based on the desired schema.

### Options

**name**

Type: ``String``

Default: ``null``

The name of the database

**version**

Type: ``Number``

Default: ``null``

The database version number

**store**

Type: ``String``

Default: ``null``

The name given to the ObjectStore

**keyPath**

Type: ``Number`` or ``String``

Default: ``false``

The keyPath tells the browser what to use as the key

**autoIncrement**

Type: ``Boolean``

Default: ``false``

To use an auto-incremented key, rather than manually assign values.

**indexes**

Type: ``Object``

Default: ``null``

The ``index`` object's properties are the index names, and property values are whether or not they should be unique (``Boolean``).

```javascript

/* Initialize the database */

var init = {
  name: "Albums",
  version: 1,
  store: "Rock",
  keyPath: "key",
  indexes: {
    // indexName: Unique
    band: false,
    title: false
  },
  onsuccess: function(e) {
    // onsuccess callback
    console.log('Database open');
  },
  onerror: function(e) {
    // onerror callback
    console.dir(e.target.errorCode);
  }
};
```

Then instantiate a new IndexedJS object, passing in the declared object.

```javascript
var RockAlbums = new IndexedJS(init);
```

After that, it's just a matter of opening the database. Note the ``onsuccess`` and ``onerror`` handlers passed into ``new IndexedJS()`` are used by the ``IndexedJS.open`` method, not fired when the new IndexedJS object is created.

```javascript
RockAlbums.open();
```

## DOM Event handlers and ``this``

**onsuccess**

For queries, ``this`` refers to the object found in the ObjectStore.

**oncomplete**

``this`` refers to the options object passed into ``IndexedJS.query()``.

## Querying the ObjectStore

```javascript
IndexedJS.query(Object [, Array]);
```

Queries are executed via the ``IndexedJS.query`` method. The type of query depends on the object properties passed in.

The ``Array`` passed as the optional second argument is the list of ObjectStores to query. At them moment, there's no support for creating multiple ObjectStores, so there's no need to specify - it's implied (support for multiple ObjectStores in the works).

### Options

**mode**

Type: ``String``

Default: ``"readonly"``

To interact with objects in the ObjectStore, set the mode to ``"readwrite"``.

**key**

Type: ``Number`` or ``String``

Default: ``false``

Queries for the specified key only; overrides ``index`` setting, overridden by ``cursor`` settings

**index**

Type: ``Object``

Default: ``false``

The ``index`` object's property is the index name, and property value is the index value being queried for; ``index`` settings are overridden by ``key`` and ``cursor`` settings.

```javascript
/* IndexedJS.query() by index */

RockAlbums.query({
  mode: "readwrite",
  index: {
    // Find Houses of the Holy by the mighty Zep
    title: "Houses of the Holy"
  },
  onsuccess: function() {
    // request.onsuccess
  },
  oncomplete: function() {
    // transaction.complete
  },
  onerror: function() {
    // request.onerror
  }
});
```

#### Using a cursor

[IDBCursor Reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor)

**cursor**

Type: ``Object``

Default: ``false``

To use a cursor, include the ``cursor`` object in the options passed to the ``IndexedJS.query`` method. The ``cursor`` settings overrides ``key`` and ``index`` queries. The property options are as follows:

**cursor.bound**

Type: ``Boolean``

Default: ``null``

Set the ``bound`` property to ``false`` to cursor over all objects in the ObjectStore with no IDBKeyRange. Set to ``true`` to give yourself something to debug ;)

#### Setting a keyRange

[IDBKeyRange reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange)

To set a lowerBound or upperBound keyRange, set the ``lower`` or ``upper`` property's value to the desired key. Use the ``include`` property to set whether or not to include the passed key in the range.

**cursor.lower**

Type: ``Number`` or ``String``

Default: ``false``

The lowerBound keyRange cursors over all keys _starting with_ the specified key, conditionally including the specified key.

**cursor.upper**

Type: ``Number`` or ``String``

Default: ``false``

The upperBound keyRange cursors over all keys _up to_ the specified key, conditionally including the specified key.

**cursor.include**

Type: ``Boolean``

Default: ``false``

Whether or not to include the specified key in the cursor iteration.

**Cursor between**

To cursor through keys _between_ the lowerBound and upperBound, set both and use an array of values for the ``include`` property; the first of which for the ``lower`` key, the second for the ``upper`` key.

**cursor.only**

Type: ``Number`` or ``String``

Default: ``false``

The ``only`` property only returns the object with the desired key.

```javascript

/* IndexedJS.query - lowerBound */

RockAlbums.query({
  cursor: {
    lower: 1410232894030,
    include: false
  },
  onsuccess: function() {
    // request.onsuccess
  },
  oncomplete: function() {
    // transaction.complete
  },
  onerror: function() {
    // request.onerror
  }
});
```

#### Collecting values from the cursor

It's often important to collect values as the cursor iterates over the keys.


```javascript

/* Collecting values from the cursor */

var opts = {
  // the array in which to collect the titles
  titles: [],
  cursor: {
    // cursor over all keys
    bound: false
  },
  onsuccess: function() {
    // collect the titles
    opts.titles.push(this.title);
  },
  oncomplete: function() {
    // this now refers to the opts object
    for (var i = 0; i < this.titles.length; i++) {
      // do something with the titles
    }
  }
};

RockAlbums.query(opts);
```

Or, of course, an array could be created outside of the function and used in the same manner. As always, do whatever works best for the project.

## Adding to/updating the ObjectStore

```javascript
IndexedJS.add(Object [, Array]);
```

For the ``add`` method, the mode is automatically ``"readwrite"`` and cannot be overridden.

As with the ``IndexedJS.query`` method, the ``Array`` passed as the optional second argument is the list of ObjectStores to query. At them moment, there's no support for creating multiple ObjectStores, so there's no need to specify - it's implied (support for multiple ObjectStores in the works).

### Options

**data**

Type: ``Object``

Default: ``{}``

Add the ``data`` object to the options in order to pass in values to save. For updates, the ``data`` object must contain at least the key for the related object.

```javascript

/* IndexedJS.add() */

// set up the `presence` object with new or updated values
var presence = {};
presence.year = 1976;
presence.key = "7567-92439-2";

RockAlbums.add({
  data: presence,
  onsuccess: function() {
    // handle events
  },
  oncomplete: function() {
    // handle events
  }
});
```

## Deleting from the ObjectStore

```javascript
IndexedJS.delete(Object [, Array]);
```

For the ``delete`` method, the mode is automatically ``"readwrite"`` and cannot be overridden.

As with the ``IndexedJS.query`` method, the ``Array`` passed as the optional second argument is the list of ObjectStores to query. At them moment, there's no support for creating multiple ObjectStores, so there's no need to specify - it's implied (support for multiple ObjectStores in the works).

### Options

**key**

Type: ``Number`` or ``String``

Default: ``false``

Pass the ``key`` for the object to be deleted.

```javascript

/* IndexedJS.delete() */

// delete the 2007 release of "Song Remains the Same" on principle
RockAlbums.add({
  key: "8122-79981-2",
  onsuccess: function() {
    // handle events
  },
  oncomplete: function() {
    // handle events
  }
});
```


## Todo

- Add [IDBVersionChangeRequest.setVersion](https://developer.mozilla.org/en-US/docs/Web/API/IDBVersionChangeRequest.setVersion) support for older WebKit browsers
- Add backward compatibility for [IDBDatabase.transaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase.transaction) (see 'mode' near the bottom of the page)
- Roll the ``open`` method into the instantiation of a ``new IndexedJS()`` object
- Add support for creating and querying more than one ObjectStore at a time
- Add callback support for [onupgradeneeded](https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest.onupgradeneeded)
- Add support for [Cursor methods](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor) (``advance``, ``delete`` and ``update``)
- Change ``this`` for ``cursor.onsuccess`` to gain access to cursor properties (``source``, ``direction``, ``key`` and ``primaryKey``)
- Add support for [IDBObjectStore.openKeyCursor](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore.openKeyCursor)

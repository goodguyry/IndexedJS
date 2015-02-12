IndexedJS
========
A wrapper for [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

Key features include:

- Creating multiple ObjectStores
- Querying, adding to, updating and deleting from ObjectStores
- Querying by cursor, index or key
- Support for cursor properties and methods

**Distributions**

The [production version](https://github.com/goodguyry/IndexedJS/blob/master/dist/IndexedJS.min.js) (1310 bytes minified and gzipped) and [development version](https://github.com/goodguyry/IndexedJS/blob/master/src/IndexedJS.js).

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
- [Changelog](#changelog)

## Creating and opening the database

[IDBFactory reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory)

To create a new database, declare an object with properties for each of the required IndexedDB values, as well as additional values based on the desired schema.

### Options

#### Database options

**name** (_Required_)

Type: `String`

Default: `null`

The name of the database.

**version** (_Required_)

Type: `Number`

Default: `null`

The database version number.

#### ObjectStores

**stores**

Type: `Array`

Default: `null`

Holds an array of ObjectStore options objects.

**stores.name**

Type: `String`

Default: `null`

The name given to the ObjectStore.

**stores.keyPath**

Type: `Number` or `String`

Default: `false`

The keyPath tells IndexedDB what to use as the key; alternative to `stores.autoIncrement`.

**stores.autoIncrement**

Type: `Boolean`

Default: `false`

To use an auto-incremented key; alternative to `stores.keyPath`.

**stores.indexes**

Type: `Object`

Default: `null`

The `index` object's properties are the index names, and property values are whether or not they should be unique (`Boolean`).

```javascript

// Define the ObjectStores
// Separated out for readability
var weeks = {
  name: "Weeks",
  keyPath: "key",
  indexes: {
    project: false,
    hours: false
  }
};

var projects = {
  name: "Projects",
  autoIncrement: true,
  indexes: {
    name: true,
    description: false
  }
};

// The main schema object
var schema = {
  name: "Time Tracker",
  version: 1,
  stores: [projects, weeks],
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

Then instantiate a new IndexedJS object, passing in the `schema` object. Note the `onsuccess` and `onerror` handlers passed into `new IndexedJS()` are used by the `IndexedJS.open` method.

```javascript
var TimeTracker = new IndexedJS(schema);
```

## DOM Event handlers and ``this``

**onsuccess**

_key & index queries_: `this` refers to the object found in the ObjectStore.

_cursor queries_: `this` refers to the `cursor` itself, which give access to the `cursor` [properties and methods](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor).

**oncomplete**

`this` refers to the options object passed into `IndexedJS.query()`.

## Querying the ObjectStore

```javascript
IndexedJS.query(Object, Array);
```

Queries are executed via the `IndexedJS.query` method. The type of query depends on the object properties passed in.

The `Array` passed as the optional second argument is the list of ObjectStores to query.

### Options

**mode**

Type: `String`

Default: `"readonly"`

To interact with objects in the ObjectStore, set the mode to `"readwrite"`.

**key**

Type: `Number` or `String`

Default: `false`

Queries for the specified key only; overrides `index` setting, overridden by `cursor` settings

**index**

Type: `Object`

Default: `false`

The `index` object's property is the index name, and property value is the index value being queried for; `index` settings are overridden by `key` and `cursor` settings.

```javascript
/* IndexedJS.query() by index */

// The query options to be passed
var options = {
  mode: "readwrite",
  index: {
    // Find a project by name
    name: "IndexedJS Documentation",
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
};

TimeTracker.query(options, ['Projects']);
```

#### Using a cursor

[IDBCursor Reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor)

**cursor**

Type: `Object`

Default: `false`

To use a cursor, include the `cursor` object in the options passed to the `IndexedJS.query` method. The `cursor` settings override `key` and `index` queries. The property options are as follows:

**cursor.bound**

Type: `Boolean`

Default: `null`

Set the `bound` property to `false` to cursor over all objects in the ObjectStore with no IDBKeyRange. Set to `true` to give yourself something to debug ;)

**cursor.advance**

Type: `Number`

Default: `false`

Set the `advance` property to advance the cursor by the specified number of places. When not set, the cursor will `continue()`.

#### Setting a keyRange

[IDBKeyRange reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange)

To set a lowerBound or upperBound keyRange, set the `lower` or `upper` property's value to the desired key. Use the `include` property to set whether or not to include the passed key in the range.

**cursor.lower**

Type: `Number` or `String`

Default: `false`

The lowerBound keyRange cursors over all keys _starting with_ the specified key, conditionally including the specified key.

**cursor.upper**

Type: `Number` or `String`

Default: `false`

The upperBound keyRange cursors over all keys _up to_ the specified key, conditionally including the specified key.

**cursor.include**

Type: `Boolean`

Default: `false`

Whether or not to include the specified key in the cursor iteration.

**Cursor between**

To cursor through keys _between_ the lowerBound and upperBound, set both and use an array of values for the `include` property; the first of which for the `lower` key, the second for the `upper` key.

**cursor.only**

Type: `Number` or `String`

Default: `false`

The `only` property only returns the object with the desired key.

```javascript

/* IndexedJS.query - lowerBound */

// The query options
var options = {
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
};

TimeTracker.query(options, ['Weeks']);
```

#### Collecting values from the cursor

It's often important to collect values as the cursor iterates over the keys.


```javascript

/* Collecting values from the cursor */

var options = {
  // The array in which to collect the titles
  projects: [],
  cursor: {
    // Cursor over all keys
    bound: false
  },
  onsuccess: function() {
    // Collect the project projects
    // `this` refers to the cursor
    options.projects.push(this.project);
  },
  oncomplete: function() {
    // `this` now refers to the options object
    for (var i = 0; i < this.projects.length; i++) {
      // Do something with the projects
    }
  }
};

TimeTracker.query(options, ["Weeks"]);
```

Or, of course, an array could be created outside of the function and used in the same manner. As always, do whatever works best for the project.

## Adding to/updating the ObjectStore

```javascript
IndexedJS.add(Object, Array);
```

For the `add` method, the mode is automatically `"readwrite"` and cannot be overridden.

As with the `IndexedJS.query` method, the `Array` passed as the second argument is the list of ObjectStores to query.

### Options

**data**

Type: `Object`

Default: `{}`

Add the `data` object to the options in order to pass in values to save. For updates, the ``data`` object must contain at least the key for the related object.

```javascript

/* IndexedJS.add() */

// Set up the `project` object with new or updated values
var project = {};
project.name = "Company Website";
project.description = "Contact page refresh";

var options = {
  data: project,
  onsuccess: function() {
    // request.onsuccess
  },
  oncomplete: function() {
    // transaction.complete
  }
};

TimeTracker.add(options, ["Projects"]);
```

## Deleting from the ObjectStore

```javascript
IndexedJS.delete(Object, Array);
```

For the `delete` method, the mode is automatically `"readwrite"` and cannot be overridden.

As with the `IndexedJS.query` method, the `Array` passed as the second argument is the list of ObjectStores to query.

### Options

**key**

Type: `Number` or `String`

Default: `false`

Pass the `key` referencing the object to be deleted.

```javascript

/* IndexedJS.delete() */

// Delete the project whose auto-incrementing key is 12
var options = {
  key: 12,
  onsuccess: function() {
    // request.onsuccess
  },
  oncomplete: function() {
    // transaction.complete
  }
};

TimeTracker.delete(options, ["Projects"]);
```

### Changelog:

**v1.1.0**

- Multiple ObjectStore creation

**v1.0.0**

- It is no longer necessary to call the `IndexedJS.open()` method after instantiation.
- Added backward compatibility for IDBDatabase.transaction
- Changed `this` for `cursor.onsuccess` to refer to the cursor itself to gain access to cursor properties (`source`, `direction`, `key` and `primaryKey`)
- Added support for `cursor.advance` method
- Added support for `cursor.delete` and `cursor.update` methods

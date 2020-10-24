const fs = require('fs');

/**
 *  @param {string} string - The string to check
 *  @return {boolean} - Return wether the string is valid JSON
 */
function isValidJson(string) {
  try {
    JSON.parse(string);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 *  @param {Object} obj - The Object to check
 *  @return {boolean} - Return wether the string is valid DBON
 */
function isValidDBON(obj) {
  if (typeof obj['name'] != 'string') return false;
  else if (typeof obj['numOfTables'] != 'number') return false;
  else if (!('tables' in obj)) return false;

  for (const table of obj['tables']) {
    if (typeof table['cols'] != 'object') {
      return false;
    } else if (typeof table['numOfCols'] != 'number' ||
      table['cols'].length != table['numOfCols']) {
      return false;
    } else if (typeof table['keys'] != 'object') {
      return false;
    } else if (typeof table['numOfKeys'] != 'number' ||
      table['keys'].length != table['numOfKeys']) {
      return false;
    } else if (!('values' in table)) {
      return false;
    }

    const values = table['values'];
    if (values.length != table['numOfKeys']) return false;
    for (const value of values) {
      if (typeof value != 'object' || value.length != table['numOfCols']) {
        return false;
      }
    }
    if (table['isRelational'] && (typeof table['relations'] != 'object' ||
      table['relations'].length != 'numOfCols')) {
      return false;
    }
  }

  return true;
}

// eslint-disable-next-line require-jsdoc
async function saveDatabase(obj, path) {
  fs.writeFileSync(path, JSON.stringify(obj), (err) => {
    if (err) throw err;
  });
}

/**
  * Creates a valid mode 1 database for Databasetify
  * @param {string} name - Name you want to give to the database
  * @param {string} path - Path of the JSON file for the database
  */
async function newDatabase(name, path) {
  fs.writeFile(path, `{"name": ${name}, "numOfTables": 0, tables: []}`,
      (err) => {
        if (err) throw err;
      });
}

/**
 * Main databasetify class.
 * Opens a file as a database,
 * performs operations on it adding or deleting elements
 * and finding for data
 */
class Databasetify {
  /**
  *
  * @callback finder
  * @param {string} value - Currently checking value
  * @param {string} key - Key relative to the current value
  * @param {string} column - Column relative to the current value
  * @param {string} counter - An increasing counter,
  *                           from 0 to the number of values
  */
  /**
  * @typedef foundValue
  * @type {Object}
  * @property {?any} value - Found value
  * @property {?string} key - Key of the found value
  * @property {?string} column - Column of the found value
  * @property {?number} counter - Count of elements checked
  */

  /**
  * Opens a file and initialize the database.
  * @param {string} path - Path of the json file to databasetify.
  * @param {number} mode - 0 or 1. 0 opens the file in simple mode,
  *                        1 opens the file in strict mode.
  */
  constructor(path, mode) {
    if (!fs.existsSync(path)) {
      throw new Error('Incorrect path');
    }

    const fileString = fs.readFileSync(path);
    if (!isValidJson(fileString)) {
      throw new Error('File is not in valid JSON format');
    }

    const obj = JSON.parse(fileString);
    if (mode == 1 && !isValidDBON(obj)) {
      throw new Error('File is not in valid DBON format');
    }

    this.mode = mode;
    this.path = path;
    this.db = obj;
    this.tables = [];
  }

  /**
  * Adds a table to the currently open database.
  * @param {string} name - Name of the table.
  * @param {Array} columns - Array of columns.
  *                          Check the right structure in the documentation.
  */
  addTable(name, columns) {
    if (this.mode === 0) {
      if (!(name in this.db)) {
        this.db[name] = {};
        this.tables.push({'name': name, 'columns': columns.map(
            (v) => {
              return (typeof v == 'string' ? v : null);
            }).filter(
            (v) => v != null),
        });
      }
    } else {
      for (const table of this.db.tables) {
        if (table.name == name) {
          throw Error(`Table ${name} already exists.`);
        }
      }
      const columnNames = []; const relations = [];
      for (const column of columns) {
        if (!('name' in column)) {
          throw new Error('Columns array invalid. Missing name.');
        }
        columnNames.push(column.name);
        if ('relation' in column && column.relation) {
          relations.push(column.relation);
        } else {
          relations.push(null);
        }
      }
      this.db.tables.push({
        'name': name,
        'cols': columnNames,
        'numOfCols': columnNames.length,
        'keys': [],
        'numOfKeys': 0,
        'values': [],
        'isRelational': relations.every((val) => !val === null),
        'relations': relations,
      });
      this.db.numOfTables++;
    }

    saveDatabase(this.db, this.path);
  }
  /**
  * Adds a value to an existent table.
  * @param {string} tableName - Name of the table where you want
  *                             to insert values
  * @param {string} key - Name of the key.
  * @param {Object.<string, any>} value - Object of values,
  *                                       with columns' names as keys
  */
  insert(tableName, key, value) {
    if (this.mode === 0) {
      if (!this.db[tableName]) {
        return;
      }
      this.db[tableName][key] = value;
    } else {
      let tableIndex = -1;
      let count = 0;
      for (const table of this.db.tables) {
        if (tableName == table.name) {
          tableIndex = count;
        }
        count++;
      }
      if (tableIndex === -1) {
        throw Error(`Table ${tableName} does not exist`);
      }

      if (!this.db.tables[tableIndex].keys.includes(key)) {
        this.db.tables[tableIndex].numOfKeys++;
        this.db.tables[tableIndex].keys.push(key);
      }

      const valueIndexArray = [];
      valueIndexArray.length = this.db.tables[tableIndex].numOfCols;
      for (let i = 0; i < Object.keys(value).length; i++) {
        const keyV = Object.keys(value)[i];
        if (this.db.tables[tableIndex].cols.includes(keyV)) {
          const currentIndex = this.db.tables[tableIndex].cols.indexOf(keyV);
          if (currentIndex >= 0) {
            valueIndexArray[currentIndex] = value[keyV];
          }
        }
      }
      if (this.db.tables[tableIndex].keys.includes(key)) {
        this.db.tables[tableIndex].values[
            this.db.tables[tableIndex].keys.indexOf(key)] = valueIndexArray;
      } else {
        this.db.tables[tableIndex].values.push(valueIndexArray);
      }
    }

    saveDatabase(this.db, this.path);
  }
  /**
  * Set a different value given the table, the key and the column names.
  * @param {string} tableName - Name of the table where you
  *                             want to insert values
  * @param {string} key - Name of the key to modify
  * @param {string} column - Name of the column
  * @param {any} value - Value to set at given table, key and column
  */
  set(tableName, key, column, value) {
    if (this.mode === 0) {
      if (!this.db[tableName]) {
        return;
      } else if (!this.db[tableName][key]) {
        this.db[tableName][key] = {};
      }
      this.db[tableName][key][column] = value;
    } else {
      let tableIndex = -1;
      let count = 0;
      for (const table of this.db.tables) {
        if (table.name == tableName) {
          tableIndex = count;
        }
        count++;
      }
      if (tableIndex === -1) {
        throw Error(`Table ${tableName} does not exist`);
      }
      let colIndex = -1;
      count = 0;
      for (const col of this.db.tables[tableIndex].cols) {
        if (col == column) {
          colIndex = count;
        }
        count++;
      }
      if (colIndex === -1) {
        throw Error(`Column ${column} does not exist in table ${tableName}`);
      }
      let keyIndex = -1;
      count = 0;
      for (const tkey of this.db.tables[tableIndex].keys) {
        if (tkey == key) {
          keyIndex = count;
        }
        count++;
      }
      if (keyIndex === -1) {
        throw Error(`Key ${key} does not exist in table ${tableName}`);
      }
      this.db.tables[tableIndex].values[keyIndex][colIndex] = value;
    }

    saveDatabase(this.db, this.path);
  }
  /**
  * Removes the specified key in the specified table
  * @param {string} tableName - Name of the table where you
  *                             want to remove key
  * @param {string} key - Key to remove
  */
  removeKey(tableName, key) {
    if (this.mode === 0) {
      delete this.db[tableName][key];
    } else {
      let tableIndex = -1;
      let count = 0;
      for (const table of this.db.tables) {
        if (table.name == tableName) {
          tableIndex = count;
        }
        count++;
      }
      if (tableIndex === -1) {
        throw Error(`Table ${tableName} does not exist`);
      }
      let keyIndex = -1;
      count = 0;
      for (const tkey of this.db.tables[tableIndex].keys) {
        if (tkey == key) {
          keyIndex = count;
        }
        count++;
      }
      if (keyIndex === -1) {
        throw Error(`Key ${key} does not exist in table ${tableName}`);
      }
      this.db.tables[tableIndex].numOfKeys--;
      this.db.tables[tableIndex].values.splice(keyIndex, 1);
      this.db.tables[tableIndex].keys.splice(keyIndex, 1);
    }

    saveDatabase(this.db, this.path);
  }
  /**
  * Get a value from the database, given the table name, the key and the column
  * @param {string} tableName - Table of the value you want to get
  * @param {string} key - Key of the value you want to get
  * @param {string} column - Column of the value you want to get
  * @return {?any} - Value at specified Table, Key and Column, if it exists.
  *                  If not, returns null
  */
  get(tableName, key, column) {
    if (this.mode === 0) {
      if (!this.db[tableName]) {
        return null;
      } else if (!this.db[tableName][key]) {
        return null;
      } else if (!this.db[tableName][key][column]) {
        return null;
      }
      return this.db[tableName][key][column];
    } else {
      let tableIndex = -1;
      let count = 0;
      for (const table of this.db.tables) {
        if (table.name == tableName) {
          tableIndex = count;
        }
        count++;
      }
      if (tableIndex === -1) {
        throw Error(`Table ${tableName} does not exist`);
      }
      let colIndex = -1;
      count = 0;
      for (const col of this.db.tables[tableIndex].cols) {
        if (col == column) {
          colIndex = count;
        }
        count++;
      }
      if (colIndex === -1) {
        throw Error(`Column ${column} does not exist in table ${tableName}`);
      }
      let keyIndex = -1;
      count = 0;
      for (const tkey of this.db.tables[tableIndex].keys) {
        if (tkey == key) {
          keyIndex = count;
        }
        count++;
      }
      if (keyIndex === -1) {
        throw Error(`Key ${key} does not exist in table ${tableName}`);
      }

      return this.db.tables[tableIndex].values[keyIndex][colIndex];
    }
  }
  /**
  * Returns the first element that makes the finder function true
  * @param {string} tableName - Name of the table where you want to search
  * @param {finder} finder - The function to filter all the values
  * @return {foundValue} Object with the value, the key, the column
  *                      and the counter relatives to the value
  */
  find(tableName, finder) {
    let counter = 0;
    if (this.mode === 0) {
      if (this.db[tableName]) {
        for (const key of Object.keys(this.db[tableName])) {
          for (const col of Object.keys(this.db[tableName][key])) {
            if (finder(this.db[tableName][key][col], key, col, counter)) {
              return {
                value: this.db[tableName][key][col],
                key: key,
                column: col,
                counter: counter,
              };
            }
            counter++;
          }
        }
      }
      return {
        value: null,
        key: null,
        column: null,
        counter: null,
      };
    } else {
      let tableIndex = -1;
      let count = 0;
      for (const table of this.db.tables) {
        if (table.name == tableName) {
          tableIndex = count;
        }
        count++;
      }
      if (tableIndex === -1) {
        throw Error(`Table ${tableName} does not exist`);
      }
      for (let k = 0; k < this.db.tables[tableIndex].numOfKeys; k++) {
        for (let c = 0; c < this.db.tables[tableIndex].numOfCols; c++) {
          const value = this.db.tables[tableIndex].values[k][c];
          const key = this.db.tables[tableIndex].keys[k];
          const col = this.db.tables[tableIndex].cols[c];
          if (finder(value, key, col, counter)) {
            return {
              value: value,
              key: key,
              column: col,
              counter: counter,
            };
          }
          counter++;
        }
      }
      return {
        value: null,
        key: null,
        column: null,
        counter: null,
      };
    }
  }
  /**
  * Returns all the elements that makes the finder function true
  * @param {string} tableName - Name of the table where you want to search
  * @param {finder} finder - The function to filter all the values
  * @return {Array<foundValue>} Array of Objects with the value, the key, the
  *                             column and the counter relatives to the value
  */
  findAll(tableName, finder) {
    const returnArray = [];
    let counter = 0;
    if (this.mode === 0) {
      if (this.db[tableName]) {
        for (const key of Object.keys(this.db[tableName])) {
          for (const col of Object.keys(this.db[tableName][key])) {
            if (finder(this.db[tableName][key][col], key, col, counter)) {
              returnArray.push({
                value: this.db[tableName][key][col],
                key: key,
                column: col,
                counter: counter,
              });
            }
            counter++;
          }
        }
      }
      return returnArray;
    } else {
      let tableIndex = -1;
      let count = 0;
      for (const table of this.db.tables) {
        if (table.name == tableName) {
          tableIndex = count;
        }
        count++;
      }
      if (tableIndex === -1) {
        throw Error(`Table ${tableName} does not exist`);
      }
      for (let k = 0; k < this.db.tables[tableIndex].numOfKeys; k++) {
        for (let c = 0; c < this.db.tables[tableIndex].numOfCols; c++) {
          const value = this.db.tables[tableIndex].values[k][c];
          const key = this.db.tables[tableIndex].keys[k];
          const col = this.db.tables[tableIndex].cols[c];
          if (finder(value, key, col, counter)) {
            returnArray.push({
              value: value,
              key: key,
              column: col,
              counter: counter,
            });
          }
          counter++;
        }
      }
      return returnArray;
    }
  }
}

module.exports = {
  Databasetify: Databasetify,
  newDatabase: newDatabase,
};

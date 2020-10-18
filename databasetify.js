
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
  fs.writeFile(path, JSON.stringify(obj), (err) => {
    if (err) throw err;
  });
}

/**
 * Main databasetify class.
 * Opens a file as a database,
 * performs operations on it adding or deleting elements
 * and finding for data
 */
export class Databasetify {
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

    this.mode = mode == 0 ? false : true;
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
        this.tables.push({'name': name, 'columns': columns});
      }
    } else {
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
      this.db['tables'].push({
        'name': name,
        'cols': columnNames,
        'numOfCols': columnNames.length,
        'keys': [],
        'numOfKeys': 0,
        'values': [],
        'isRelational': relations.every((val) => !val === null),
        'relations': relations,
      });
    }

    saveDatabase(this.db, this.path);
  }
}


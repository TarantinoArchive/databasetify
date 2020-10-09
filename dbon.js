import fs from "fs"

function isValidJson(string) {
    try {
        JSON.parse(string);
    } catch (e) {
        return false;
    }
    return true;
}

function isValidDBON(obj) {

    if (typeof obj["name"] != "string") return false;
    else if (typeof obj["numOfTables"] != "number") return false;
    else if (!("tables" in obj)) return false;

    for (let table of obj["tables"]) {
        if (typeof table["cols"] != "object") return false;
        else if (typeof table["numOfCols"] != "number" || table["cols"].length != table["numOfCols"]) return false;
        else if (typeof table["keys"] != "object") return false;
        else if (typeof table["numOfKeys"] != "number" || table["keys"].length != table["numOfKeys"]) return false;
        else if (!("values" in table)) return false;

        values = table["values"];
        if (values.length != table["numOfKeys"]) return false;
        for (let value of values) if (typeof value != "object" || value.length != table["numOfCols"]) return false;
        if (table["isRelational"] && (typeof table["relations"] != "object" || table["relations"].length != "numOfCols")) return false;
    }

    return true;
}

class DBON {

    constructor(path, mode) {
        
        if (!fs.existsSync(path)) {
            throw "Incorrect path";
        }

        let fileString = fs.readFileSync(path);
        if (!isValidJson(fileString)) {
            throw "File is not in valid JSON format"    
        }

        let obj = JSON.parse(fileString);
        if (mode == 1 && !isValidDBON(obj)) {
            throw "File is not in valid DBON format"
        }

        this.mode = mode == 0 ? false : true;
        this.path = path;
        this.db = obj;
    }

}
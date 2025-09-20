"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDataTypes = void 0;
const database_ts_1 = require("../config/database.ts");
const getAllDataTypes = async () => {
    const result = await database_ts_1.pool.query('SELECT id, name, display_name, unit FROM data_types ORDER BY display_name');
    return result.rows;
};
exports.getAllDataTypes = getAllDataTypes;
//# sourceMappingURL=dataTypeService.js.map
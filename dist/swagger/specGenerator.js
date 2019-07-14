"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SpecGenerator = /** @class */ (function () {
    function SpecGenerator(metadata, config) {
        this.metadata = metadata;
        this.config = config;
    }
    SpecGenerator.prototype.buildAdditionalProperties = function (type) {
        return this.getSwaggerType(type);
    };
    SpecGenerator.prototype.getOperationId = function (methodName) {
        return methodName.charAt(0).toUpperCase() + methodName.substr(1);
    };
    SpecGenerator.prototype.getSwaggerType = function (type) {
        var swaggerType = this.getSwaggerTypeForPrimitiveType(type);
        if (swaggerType) {
            return swaggerType;
        }
        if (type.dataType === 'array') {
            return this.getSwaggerTypeForArrayType(type);
        }
        if (type.dataType === 'enum') {
            return this.getSwaggerTypeForEnumType(type);
        }
        return this.getSwaggerTypeForReferenceType(type);
    };
    SpecGenerator.prototype.getSwaggerTypeForReferenceType = function (referenceType) {
        return {};
    };
    SpecGenerator.prototype.getSwaggerTypeForPrimitiveType = function (type) {
        var map = {
            any: { type: 'object' },
            binary: { type: 'string', format: 'binary' },
            boolean: { type: 'boolean' },
            buffer: { type: 'string', format: 'byte' },
            byte: { type: 'string', format: 'byte' },
            date: { type: 'string', format: 'date' },
            datetime: { type: 'string', format: 'date-time' },
            double: { type: 'number', format: 'double' },
            float: { type: 'number', format: 'float' },
            integer: { type: 'integer', format: 'int32' },
            long: { type: 'integer', format: 'int64' },
            object: { type: 'object' },
            string: { type: 'string' },
        };
        return map[type.dataType];
    };
    SpecGenerator.prototype.getSwaggerTypeForArrayType = function (arrayType) {
        return { type: 'array', items: this.getSwaggerType(arrayType.elementType) };
    };
    SpecGenerator.prototype.getSwaggerTypeForEnumType = function (enumType) {
        return { type: 'string', enum: enumType.enums.map(function (member) { return String(member); }) };
    };
    return SpecGenerator;
}());
exports.SpecGenerator = SpecGenerator;
//# sourceMappingURL=specGenerator.js.map
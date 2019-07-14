"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var pathUtils_1 = require("./../utils/pathUtils");
var specGenerator_1 = require("./specGenerator");
var SpecGenerator2 = /** @class */ (function (_super) {
    __extends(SpecGenerator2, _super);
    function SpecGenerator2(metadata, config) {
        var _this = _super.call(this, metadata, config) || this;
        _this.metadata = metadata;
        _this.config = config;
        return _this;
    }
    SpecGenerator2.prototype.GetSpec = function () {
        var spec = {
            basePath: pathUtils_1.normalisePath(this.config.basePath, '/', undefined, false),
            consumes: ['application/json'],
            definitions: this.buildDefinitions(),
            info: {
                title: '',
            },
            paths: this.buildPaths(),
            produces: ['application/json'],
            swagger: '2.0',
        };
        spec.securityDefinitions = this.config.securityDefinitions
            ? this.config.securityDefinitions
            : {};
        if (this.config.name) {
            spec.info.title = this.config.name;
        }
        if (this.config.version) {
            spec.info.version = this.config.version;
        }
        if (this.config.host) {
            spec.host = this.config.host;
        }
        if (this.config.description) {
            spec.info.description = this.config.description;
        }
        if (this.config.tags) {
            spec.tags = this.config.tags;
        }
        if (this.config.license) {
            spec.info.license = { name: this.config.license };
        }
        if (this.config.spec) {
            this.config.specMerging = this.config.specMerging || 'immediate';
            var mergeFuncs = {
                immediate: Object.assign,
                recursive: require('merge').recursive,
            };
            spec = mergeFuncs[this.config.specMerging](spec, this.config.spec);
        }
        if (this.config.schemes) {
            spec.schemes = this.config.schemes;
        }
        return spec;
    };
    SpecGenerator2.prototype.buildDefinitions = function () {
        var _this = this;
        var definitions = {};
        Object.keys(this.metadata.referenceTypeMap).map(function (typeName) {
            var referenceType = _this.metadata.referenceTypeMap[typeName];
            // Object definition
            if (referenceType.properties) {
                var required = referenceType.properties.filter(function (p) { return p.required; }).map(function (p) { return p.name; });
                definitions[referenceType.refName] = {
                    description: referenceType.description,
                    properties: _this.buildProperties(referenceType.properties),
                    required: required && required.length > 0 ? Array.from(new Set(required)) : undefined,
                    type: 'object',
                };
                if (referenceType.additionalProperties) {
                    definitions[referenceType.refName].additionalProperties = _this.buildAdditionalProperties(referenceType.additionalProperties);
                }
                if (referenceType.example) {
                    definitions[referenceType.refName].example = referenceType.example;
                }
            }
            // Enum definition
            if (referenceType.enums) {
                definitions[referenceType.refName] = {
                    description: referenceType.description,
                    enum: referenceType.enums,
                    type: 'string',
                };
            }
        });
        return definitions;
    };
    SpecGenerator2.prototype.buildPaths = function () {
        var _this = this;
        var paths = {};
        this.metadata.controllers.forEach(function (controller) {
            var normalisedControllerPath = pathUtils_1.normalisePath(controller.path, '/');
            // construct documentation using all methods except @Hidden
            controller.methods.filter(function (method) { return !method.isHidden; }).forEach(function (method) {
                var normalisedMethodPath = pathUtils_1.normalisePath(method.path, '/');
                var path = pathUtils_1.normalisePath("" + normalisedControllerPath + normalisedMethodPath, '/', '', false);
                paths[path] = paths[path] || {};
                _this.buildMethod(controller.name, method, paths[path]);
            });
        });
        return paths;
    };
    SpecGenerator2.prototype.buildMethod = function (controllerName, method, pathObject) {
        var _this = this;
        var pathMethod = pathObject[method.method] = this.buildOperation(controllerName, method);
        pathMethod.description = method.description;
        pathMethod.summary = method.summary;
        pathMethod.tags = method.tags;
        // Use operationId tag otherwise fallback to generated. Warning: This doesn't check uniqueness.
        pathMethod.operationId = method.operationId || pathMethod.operationId;
        if (method.deprecated) {
            pathMethod.deprecated = method.deprecated;
        }
        if (method.security) {
            pathMethod.security = method.security;
        }
        pathMethod.parameters = method.parameters
            .filter(function (p) {
            return !(p.in === 'request' || p.in === 'body-prop');
        })
            .map(function (p) { return _this.buildParameter(p); });
        var bodyPropParameter = this.buildBodyPropParameter(controllerName, method);
        if (bodyPropParameter) {
            pathMethod.parameters.push(bodyPropParameter);
        }
        if (pathMethod.parameters.filter(function (p) { return p.in === 'body'; }).length > 1) {
            throw new Error('Only one body parameter allowed per controller method.');
        }
    };
    SpecGenerator2.prototype.buildOperation = function (controllerName, method) {
        var _this = this;
        var swaggerResponses = {};
        method.responses.forEach(function (res) {
            swaggerResponses[res.name] = {
                description: res.description,
            };
            if (res.schema && res.schema.dataType !== 'void') {
                swaggerResponses[res.name].schema = _this.getSwaggerType(res.schema);
            }
            if (res.examples) {
                swaggerResponses[res.name].examples = { 'application/json': res.examples };
            }
        });
        return {
            operationId: this.getOperationId(method.name),
            produces: ['application/json'],
            responses: swaggerResponses,
        };
    };
    SpecGenerator2.prototype.buildBodyPropParameter = function (controllerName, method) {
        var _this = this;
        var properties = {};
        var required = [];
        method.parameters
            .filter(function (p) { return p.in === 'body-prop'; })
            .forEach(function (p) {
            properties[p.name] = _this.getSwaggerType(p.type);
            properties[p.name].default = p.default;
            properties[p.name].description = p.description;
            if (p.required) {
                required.push(p.name);
            }
        });
        if (!Object.keys(properties).length) {
            return;
        }
        var parameter = {
            in: 'body',
            name: 'body',
            schema: {
                properties: properties,
                title: this.getOperationId(method.name) + "Body",
                type: 'object',
            },
        };
        if (required.length) {
            parameter.schema.required = required;
        }
        return parameter;
    };
    SpecGenerator2.prototype.buildParameter = function (source) {
        var parameter = {
            default: source.default,
            description: source.description,
            in: source.in,
            name: source.name,
            required: source.required,
        };
        var parameterType = this.getSwaggerType(source.type);
        parameter.format = parameterType.format || undefined;
        if (parameter.in === 'query' && parameterType.type === 'array') {
            parameter.collectionFormat = 'multi';
        }
        if (parameterType.$ref) {
            parameter.schema = parameterType;
            return parameter;
        }
        var validatorObjs = {};
        Object.keys(source.validators)
            .filter(function (key) {
            return !key.startsWith('is') && key !== 'minDate' && key !== 'maxDate';
        })
            .forEach(function (key) {
            validatorObjs[key] = source.validators[key].value;
        });
        if (source.in === 'body' && source.type.dataType === 'array') {
            parameter.schema = {
                items: parameterType.items,
                type: 'array',
            };
        }
        else {
            if (source.type.dataType === 'any') {
                if (source.in === 'body') {
                    parameter.schema = { type: 'object' };
                }
                else {
                    parameter.type = 'string';
                }
            }
            else {
                parameter.type = parameterType.type;
                parameter.items = parameterType.items;
                parameter.enum = parameterType.enum;
            }
        }
        if (parameter.schema) {
            parameter.schema = Object.assign({}, parameter.schema, validatorObjs);
        }
        else {
            parameter = Object.assign({}, parameter, validatorObjs);
        }
        return parameter;
    };
    SpecGenerator2.prototype.buildProperties = function (source) {
        var _this = this;
        var properties = {};
        source.forEach(function (property) {
            var swaggerType = _this.getSwaggerType(property.type);
            var format = property.format;
            swaggerType.description = property.description;
            swaggerType.format = format || swaggerType.format;
            if (!swaggerType.$ref) {
                swaggerType.default = property.default;
                Object.keys(property.validators)
                    .filter(function (key) {
                    return !key.startsWith('is') && key !== 'minDate' && key !== 'maxDate';
                })
                    .forEach(function (key) {
                    swaggerType[key] = property.validators[key].value;
                });
            }
            if (!property.required) {
                swaggerType['x-nullable'] = true;
            }
            properties[property.name] = swaggerType;
        });
        return properties;
    };
    SpecGenerator2.prototype.getSwaggerType = function (type) {
        if (type.dataType === 'union' || type.dataType === 'intersection') {
            return { type: 'object' };
        }
        return _super.prototype.getSwaggerType.call(this, type);
    };
    SpecGenerator2.prototype.getSwaggerTypeForReferenceType = function (referenceType) {
        return { $ref: "#/definitions/" + referenceType.refName };
    };
    return SpecGenerator2;
}(specGenerator_1.SpecGenerator));
exports.SpecGenerator2 = SpecGenerator2;
//# sourceMappingURL=specGenerator2.js.map
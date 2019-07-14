import { Tsoa } from '../metadataGeneration/tsoa';
import { SwaggerConfig } from './../config';
import { Swagger } from './swagger';
export declare class SpecGenerator {
    protected readonly metadata: Tsoa.Metadata;
    protected readonly config: SwaggerConfig;
    constructor(metadata: Tsoa.Metadata, config: SwaggerConfig);
    protected buildAdditionalProperties(type: Tsoa.Type): Swagger.Schema;
    protected getOperationId(methodName: string): string;
    protected getSwaggerType(type: Tsoa.Type): Swagger.Schema;
    protected getSwaggerTypeForReferenceType(referenceType: Tsoa.ReferenceType): Swagger.BaseSchema;
    protected getSwaggerTypeForPrimitiveType(type: Tsoa.Type): Swagger.Schema | undefined;
    protected getSwaggerTypeForArrayType(arrayType: Tsoa.ArrayType): Swagger.Schema;
    protected getSwaggerTypeForEnumType(enumType: Tsoa.EnumerateType): Swagger.Schema;
}

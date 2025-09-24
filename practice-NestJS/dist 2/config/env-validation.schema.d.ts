import * as Joi from 'joi';
export declare const envValidationSchema: Joi.ObjectSchema<any>;
export declare function validateEnvironmentVariables(config: Record<string, unknown>): any;

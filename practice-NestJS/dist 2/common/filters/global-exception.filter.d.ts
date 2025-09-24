import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private parseException;
    private parseDatabaseError;
    private logError;
    private buildErrorResponse;
    private sanitizeHeaders;
}

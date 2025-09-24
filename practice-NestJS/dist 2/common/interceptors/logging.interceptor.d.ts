import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private logRequest;
    private logSuccessResponse;
    private logErrorResponse;
    private generateRequestId;
    private sanitizeData;
    private isLowPriorityRequest;
    private calculateResponseSize;
}

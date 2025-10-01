import { Controller, Get, HostParam} from '@nestjs/common';

@Controller({
    path: '/api/',
    host: ':version.api.localhost',
})
export class ApiController {
    @Get()
    index(@HostParam('version') version: string) : string {
        return `Hello, Api ${version}`;
    }

}

function HandlerError() {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("target: \n" + target);
        console.log("propertyKey: \n" + propertyKey);
        console.log("descriptor: \n" + descriptor);

        const method = descriptor.value;
        descriptor.value = function() {
            try{
                method()
            } catch(e) {
                console.log("error: " + e);
            }
        }
    };
}

class Greeter {
    @HandlerError()
    hello() {
        throw new Error("테스트 에러")
    }
}

const t = new Greeter();
t.hello();
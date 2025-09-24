interface EnhancerOptions {
  url: string;
  prefix?: string;
}

function reportDecorator(options: EnhancerOptions) {
  console.log("진입점 1");
  return function internalDecorator<T extends {new (...args: any[]) : {}}> (constructor: T) {
    console.log("진입점 2");
    return class extends constructor {
      reportingURL: string;

      constructor(...args: any[]) {
        console.log("진입점 3");
        const prefix = options.prefix || `[${constructor.name}]`;
        // const preefix = options.prefix ?? `[${constructor.name}]`;
        super(...args);
        this.reportingURL = prefix;
        console.log("진입점 6");
      }
    }
  }
}

@reportDecorator({
  url: "http://www.example.com/",
  prefix: "[Test]"
})
class BugReport {
  type = 'report';
  title: string;

  constructor(title: string) {
    console.log("진입점 4");
    this.title = title;
    console.log("진입점 5");
  }
}

const instance = new BugReport('test report');
console.log(instance);


// // 1. 데코레이터에 전달할 설정값의 타입을 정의합니다.
// interface EnhancerOptions {
//   url: string;
//   logPrefix?: string; // 로그 접두사는 선택사항으로 지정
// }
//
// // 2. 데코레이터 팩토리: 설정값(options)을 받습니다.
// function Enhancer(options: EnhancerOptions) {
//   // 3. 실제 데코레이터: 원본 생성자를 받습니다.
//   return function <T extends { new (...args: any[]): {} }>(originalConstructor: T) {
//     // 4. 원본을 확장한 새로운 클래스를 반환합니다.
//     return class extends originalConstructor {
//       // 새로운 속성을 추가할 수 있습니다.
//       reportingURL: string;
//
//       // 5. 새로운 생성자: 인자를 가로챕니다.
//       constructor(...args: any[]) {
//         const prefix = options.logPrefix || `[${originalConstructor.name}]`;
//         console.log(`${prefix} 생성 시작... 인자:`, args);
//
//         // 6. (필수) 원본 생성자를 호출합니다.
//         super(...args);
//
//         // 7. 원본 생성자 실행 후 추가 작업을 수행합니다.
//         this.reportingURL = options.url;
//         console.log(`${prefix} 생성 완료! 리포팅 URL: ${this.reportingURL}`);
//       }
//     };
//   };
// }
import { Anonymizer } from './anonymizer';

export class SimpleAnonymizer implements Anonymizer {
  maskFields<T extends object>(obj: T, fields: (string | RegExp)[]): T {
    const fieldsToMask = fields.map((x) =>
      typeof x === 'string' ? new RegExp(x.toLowerCase(), 'i') : x,
    );
    const clone = this.createClone(obj);
    const result = this.applyMaskToFields(clone, fieldsToMask);
    return result;
  }

  private createClone(obj: object) {
    const properties = JSON.parse(JSON.stringify(obj));
    return { ...obj, ...properties };
  }

  private applyMaskToFields(obj: any, fields: RegExp[]) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.applyMaskToFields(item, fields));
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (fields.some((x) => x.test(key))) {
          obj[key] = '*****';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          obj[key] = this.applyMaskToFields(obj[key], fields);
        }
      }
    }

    return obj;
  }
}

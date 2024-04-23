export interface Anonymizer {
  maskFields<T extends object>(obj: T, fields: (string | RegExp)[]): T;
}

export class RegExpAnonymizer implements Anonymizer {
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

export class NestedPropertiesAnonymizer implements Anonymizer {
  maskFields<T extends object>(obj: T, fields: string[]): T {
    const clone = this.createClone(obj);
    const result = this.applyMaskToFields(clone, fields);
    return result;
  }

  private createClone(obj: object) {
    const properties = JSON.parse(JSON.stringify(obj));
    return { ...obj, ...properties };
  }

  private applyMaskToFields(obj: any, fields: string[]) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.applyMaskToFields(item, fields));
    }

    fields.forEach((property) => {
      const keys = property.split('.');
      let current = obj;
      for (const key of keys) {
        if (current.hasOwnProperty(key)) {
          if (keys.indexOf(key) === keys.length - 1) {
            current[key] = '*****';
          } else {
            current = current[key];
          }
        } else {
          break;
        }
      }
    });

    return obj;
  }
}

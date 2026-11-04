import { PipeTransform, UnprocessableEntityException } from '@nestjs/common';

/** Parses legacy numeric route parameters while retaining the API's 422 error. */
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  constructor(private readonly fieldName = 'id') {}

  transform(value: string): number {
    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new UnprocessableEntityException(
        `${this.fieldName} không hợp lệ`,
      );
    }

    return parsed;
  }
}

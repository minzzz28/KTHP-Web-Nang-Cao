import { UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';

type DtoConstructor<T extends object> = new () => T;

type ValidationIssue = {
  field: string;
  message: string;
};

function validationIssues(
  errors: ValidationError[],
  parent = '',
): ValidationIssue[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const ownIssues = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));
    const childIssues = validationIssues(error.children ?? [], field);

    return [...ownIssues, ...childIssues];
  });
}

function invalidPayload(errors: ValidationIssue[]): UnprocessableEntityException {
  return new UnprocessableEntityException({
    message: 'Dữ liệu gửi lên không hợp lệ',
    errors,
  });
}

/**
 * Validates a DTO selected at runtime (for example, by the authenticated
 * account role). Nest's global ValidationPipe cannot infer a union DTO.
 */
export async function validateRequestDto<T extends object>(
  dtoClass: DtoConstructor<T>,
  payload: unknown,
): Promise<T> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw invalidPayload([
      { field: 'body', message: 'Dữ liệu gửi lên không hợp lệ' },
    ]);
  }

  const dto = plainToInstance(dtoClass, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
  });

  if (errors.length) throw invalidPayload(validationIssues(errors));
  return dto;
}

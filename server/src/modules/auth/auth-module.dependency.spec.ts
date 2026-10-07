import { MODULE_METADATA } from '@nestjs/common/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';

describe('AuthModule repository boundary', () => {
  it('re-exports the User repository boundary required by JwtAuthGuard consumers', () => {
    const exportedModules = Reflect.getMetadata(
      MODULE_METADATA.EXPORTS,
      AuthModule,
    ) as unknown[];

    expect(exportedModules).toContain(TypeOrmModule);
  });
});

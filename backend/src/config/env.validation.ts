import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsOptional()
  @IsIn(Object.values(Environment))
  NODE_ENV?: Environment;

  @IsNotEmpty({ message: 'DATABASE_URL is required' })
  @IsString()
  DATABASE_URL!: string;

  @IsNotEmpty({ message: 'JWT_SECRET is required' })
  @IsString()
  JWT_SECRET!: string;

  @IsNotEmpty({ message: 'JWT_REFRESH_SECRET is required' })
  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  OPENAI_MODEL?: string;

  @IsOptional()
  @IsString()
  AI_SYSTEM_PROMPT?: string;

  @IsOptional()
  @IsNumberString()
  AI_MAX_CONTEXT_MESSAGES?: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;
}

/**
 * Validates process.env at boot time (wired via ConfigModule.forRoot({ validate })).
 * Fails fast with a clear error instead of letting the app boot silently misconfigured.
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .filter(Boolean)
      .join('; ');
    throw new Error(`Environment validation failed: ${details}`);
  }

  return validatedConfig;
}

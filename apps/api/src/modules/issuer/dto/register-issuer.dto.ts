import { IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class RegisterIssuerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  name!: string;

  @IsString()
  legalName!: string;

  @IsString()
  country!: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}

import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

const DEGREE_TYPES = ['bachelor', 'master', 'doctorate', 'certificate', 'diploma'] as const;
export type DegreeType = (typeof DEGREE_TYPES)[number];

export class IssueCredentialDto {
  @IsString()
  subjectDid!: string;

  @IsString()
  givenName!: string;

  @IsString()
  familyName!: string;

  @IsIn(DEGREE_TYPES)
  degreeType!: DegreeType;

  @IsString()
  degreeName!: string;

  @IsString()
  institution!: string;

  @IsISO8601()
  graduationDate!: string;

  @IsOptional()
  @IsString()
  honors?: string;

  @IsOptional()
  @IsISO8601()
  expirationDate?: string;
}

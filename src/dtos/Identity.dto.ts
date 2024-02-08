import { IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class IdentityDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  phoneNumber?: string;
}

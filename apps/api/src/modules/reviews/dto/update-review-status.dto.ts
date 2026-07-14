import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatus } from '../../../common/enums';

export class UpdateReviewStatusDto {
  @ApiProperty({ enum: [ReviewStatus.APPROVED, ReviewStatus.REJECTED] })
  @IsEnum(ReviewStatus)
  status: ReviewStatus.APPROVED | ReviewStatus.REJECTED;
}

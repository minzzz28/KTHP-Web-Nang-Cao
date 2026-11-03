import { IsIn } from 'class-validator';
import { RoommateRequestStatus } from '../../../database/enums/domain.enums';

/** Compatibility body for the legacy PATCH /roommate-requests/:id route. */
export class UpdateRoommateRequestStatusDto {
  @IsIn([
    RoommateRequestStatus.ACCEPTED,
    RoommateRequestStatus.REJECTED,
    RoommateRequestStatus.CANCELLED,
  ])
  status!:
    | RoommateRequestStatus.ACCEPTED
    | RoommateRequestStatus.REJECTED
    | RoommateRequestStatus.CANCELLED;
}

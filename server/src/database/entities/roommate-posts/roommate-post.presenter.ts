import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { RoommatePost } from '../../database/entities';

function presentUniversitySummary(
  university: NonNullable<
    RoommatePost['student']['studentProfile']
  >['university'] | null | undefined,
) {
  if (!university) return null;

  return {
    id: university.id,
    code: university.code,
    name: university.name,
  };
}

/**
 * Keeps the response compatible with the previous Prisma route while
 * deliberately omitting account contact data and password hashes.
 */
export function presentRoommatePost(post: RoommatePost) {
  const student = post.student
    ? {
        ...presentPublicUserSummary(post.student),
        university: presentUniversitySummary(
          post.student.studentProfile?.university,
        ),
      }
    : null;
  const room = post.room
    ? {
        id: post.room.id,
        name: post.room.name,
        code: post.room.code,
        price: post.room.price,
        status: post.room.status,
        property: post.room.property
          ? {
              name: post.room.property.name,
              address: post.room.property.address,
            }
          : null,
      }
    : null;

  return {
    id: post.id,
    studentId: post.studentId,
    roomId: post.roomId,
    title: post.title,
    content: post.content,
    area: post.area,
    budgetPerPerson: post.budgetPerPerson,
    neededPeople: post.neededPeople,
    preferredGender: post.preferredGender,
    moveInDate: post.moveInDate,
    requirements: post.requirements,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    student,
    room,
  };
}

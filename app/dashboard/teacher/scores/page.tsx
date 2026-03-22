import { redirect } from 'next/navigation';

export default function TeacherScoresRedirectPage() {
  redirect('/dashboard/teacher/scoring');
}

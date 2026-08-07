import type { Semester } from '../types';

interface Props {
  semester: Semester;
}

export default function SessionsTab({ semester }: Props) {
  return <p>Sessions placeholder for {semester.name}</p>;
}

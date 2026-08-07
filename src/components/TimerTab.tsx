import type { Semester } from '../types';

interface Props {
  semester: Semester;
}

export default function TimerTab({ semester }: Props) {
  return <p>Timer placeholder for {semester.name}</p>;
}

import type { Semester } from '../types';

interface Props {
  semester: Semester;
}

export default function StatsTab({ semester }: Props) {
  return <p>Stats placeholder for {semester.name}</p>;
}

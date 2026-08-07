import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { listSkills, type ListSkillsQuery } from "../../../services/skills"

export function useSkills(params: ListSkillsQuery = {}) {
  return useQuery({
    queryKey: ["skills", params],
    queryFn: () => listSkills(params),
    placeholderData: keepPreviousData,
  })
}

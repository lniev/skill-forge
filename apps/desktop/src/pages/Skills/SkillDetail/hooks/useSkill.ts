import { useQuery } from "@tanstack/react-query"
import { getSkill, getSkillVersions } from "../../../../services/skills"

export function useSkill(id: string | undefined) {
  return useQuery({
    queryKey: ["skill", id],
    queryFn: () => {
      if (!id) throw new Error("Skill id is required")
      return getSkill(id)
    },
    enabled: !!id,
  })
}

export function useSkillVersions(id: string | undefined) {
  return useQuery({
    queryKey: ["skill-versions", id],
    queryFn: () => {
      if (!id) throw new Error("Skill id is required")
      return getSkillVersions(id)
    },
    enabled: !!id,
  })
}

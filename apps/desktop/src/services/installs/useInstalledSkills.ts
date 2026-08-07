import { useQuery } from "@tanstack/react-query"
import { listInstalledSkills } from "."

export function useInstalledSkills() {
  return useQuery({
    queryKey: ["installed-skills"],
    queryFn: listInstalledSkills,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

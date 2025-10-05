import DashboardCard from "@/components/dashboard/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EducationRanking } from "@/types/dashboard"
import Image from "next/image"

interface DepartmentActivityProps {
  departments: EducationRanking[]
}

export default function DepartmentActivity({ departments }: DepartmentActivityProps) {
  return (
    <DashboardCard title="DEPARTMENT ACTIVITY" intent="default" addon={<Badge variant="outline-warning">LIVE</Badge>}>
      <div className="space-y-4">
        {departments.map((dept) => (
          <div key={dept.id} className="flex items-center justify-between">
            <div className="flex items-center gap-1 w-full">
              <div
                className={cn(
                  "flex items-center justify-center rounded text-sm font-bold px-1.5 mr-1 md:mr-2",
                  dept.featured
                    ? "h-10 bg-primary text-primary-foreground"
                    : "h-8 bg-secondary text-secondary-foreground",
                )}
              >
                {dept.id}
              </div>
              <div
                className={cn(
                  "rounded-lg overflow-hidden bg-muted",
                  dept.featured ? "size-14 md:size-16" : "size-10 md:size-12",
                )}
              >
                {dept.avatar ? (
                  <Image
                    src={dept.avatar || "/placeholder.svg"}
                    alt={dept.name}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div
                className={cn(
                  "flex flex-1 h-full items-center justify-between py-2 px-2.5 rounded",
                  dept.featured && "bg-accent",
                )}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn("font-display", dept.featured ? "text-xl md:text-2xl" : "text-lg md:text-xl")}
                      >
                        {dept.name}
                      </span>
                      <span className="text-muted-foreground text-xs md:text-sm">{dept.handle}</span>
                    </div>
                    <Badge variant={dept.featured ? "default" : "secondary"}>{dept.points} DOCS</Badge>
                  </div>
                  {dept.subtitle && <span className="text-sm text-muted-foreground italic">{dept.subtitle}</span>}
                  {dept.streak && !dept.featured && (
                    <span className="text-sm text-muted-foreground italic">{dept.streak}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

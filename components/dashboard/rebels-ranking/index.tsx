import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EducationRanking } from "@/types/dashboard";
import Image from "next/image";

interface EducationRankingProps {
  education: EducationRanking[];
}

export default function EducationRanking({ education }: EducationRankingProps) {
  return (
    <DashboardCard
      title="EDUCATION RANKING"
      intent="default"
      addon={<Badge variant="outline-warning">2 NEW</Badge>}
    >
      <div className="space-y-4">
        {education.map((educator) => (
          <div key={educator.id} className="flex items-center justify-between">
            <div className="flex items-center gap-1 w-full">
              <div
                className={cn(
                  "flex items-center justify-center rounded text-sm font-bold px-1.5 mr-1 md:mr-2",
                  educator.featured
                    ? "h-10 bg-primary text-primary-foreground"
                    : "h-8 bg-secondary text-secondary-foreground"
                )}
              >
                {educator.id}
              </div>
              <div
                className={cn(
                  "rounded-lg overflow-hidden bg-muted",
                  educator.featured ? "size-14 md:size-16" : "size-10 md:size-12"
                )}
              >
                {educator.avatar ? (
                  <Image
                    src={educator.avatar}
                    alt={educator.name}
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
                  educator.featured && "bg-accent"
                )}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "font-display",
                          educator.featured
                            ? "text-xl md:text-2xl"
                            : "text-lg md:text-xl"
                        )}
                      >
                        {educator.name}
                      </span>
                      <span className="text-muted-foreground text-xs md:text-sm">
                        {educator.handle}
                      </span>
                    </div>
                    <Badge variant={educator.featured ? "default" : "secondary"}>
                      {educator.points} POINTS
                    </Badge>
                  </div>
                  {educator.subtitle && (
                    <span className="text-sm text-muted-foreground italic">
                      {educator.subtitle}
                    </span>
                  )}
                  {educator.streak && !educator.featured && (
                    <span className="text-sm text-muted-foreground italic">
                      {educator.streak}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

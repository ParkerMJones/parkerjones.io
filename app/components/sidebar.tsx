import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "~/components/ui/sidebar";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

const quarters = [
  { year: 2025, quarter: 1 },
  { year: 2025, quarter: 2 },
  { year: 2025, quarter: 3 },
  { year: 2025, quarter: 4 },
  { year: 2024, quarter: 4 },
  { year: 2024, quarter: 3 },
];

export function Sidebar() {
  return (
    <SidebarComponent>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tracks by Quarter</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quarters.map(({ year, quarter }) => (
                <Collapsible key={`${year}-Q${quarter}`}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        Q{quarter} {year}
                        <ChevronDown className="ml-auto h-4 w-4" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <a href={`#${year}-Q${quarter}`}>View Tracks</a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarComponent>
  );
}

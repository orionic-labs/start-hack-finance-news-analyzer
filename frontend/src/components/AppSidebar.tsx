import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  BarChart3,
  Newspaper,
  ClipboardList,
  Headphones,
  Users,
  Building2,
  Rss,
  LogOut,
  ChevronDown,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const allItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    submenu: [
      { title: "Overview", url: "/overview", icon: Eye },
      { title: "All News", url: "/news", icon: Newspaper },
      { title: "Reports", url: "/reports", icon: ClipboardList },
      { title: "Podcasts", url: "/dashboard/podcasts", icon: Headphones },
    ],
  },
  { title: "Accounts", url: "/accounts", icon: Users },
  { title: "Clients", url: "/clients", icon: Building2 },
  { title: "Sources", url: "/sources", icon: Rss },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Dashboard"]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    const active = isActive(path);
    return active
      ? "bg-dashboard-primary text-primary-foreground font-medium hover:bg-[#3D4450] hover:!text-primary-foreground"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  const toggleMenu = (title: string) => {
    if (collapsed) return;
    setExpandedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="border-r border-dashboard-primary/10">
        <div className="p-4 border-b border-dashboard-primary/10">
          <div className="flex items-center justify-start h-8 w-full">
            <img
              src={collapsed ? "/WPlogo.png" : "/wplogoful.png"}
              alt={collapsed ? "Logo" : "Company Logo"}
              className="max-h-14 w-auto object-contain transition-all duration-500 ease-in-out"
            />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <div key={item.title}>
                  {item.submenu ? (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          className="h-10"
                          onClick={() => toggleMenu(item.title)}
                        >
                          <div className="flex gap-1 items-center w-full">
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            {!collapsed && (
                              <>
                                <span className="flex-1 text-left">
                                  {item.title}
                                </span>
                                {expandedMenus.includes(item.title) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {expandedMenus.includes(item.title) && !collapsed && (
                        <div className="ml-6 space-y-1">
                          {item.submenu.map((subItem) => (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton asChild className="h-8">
                                <NavLink
                                  to={subItem.url}
                                  className={getNavClasses(subItem.url)}
                                >
                                  <subItem.icon className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-sm">
                                    {subItem.title}
                                  </span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="h-10">
                        <NavLink
                          to={item.url}
                          className={getNavClasses(item.url)}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto p-4 border-t border-dashboard-primary/10">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

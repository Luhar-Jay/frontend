import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Building2,
  ShieldCheck,
  UserCircle2,
  UserRound,
  Trash2,
  MessageCircle,
  BriefcaseBusiness,
} from "lucide-react";
import logo from "@/assets/Mainlogo.png";
import toast from "react-hot-toast";
import { useCreateProject, useDeleteProject, useProjectsList, type CreateProjectInput } from "@/apis/api/projects";
import { useUserById } from "@/apis/api/auth";
import { ApiError } from "@/apis/apiService";
import { resolveProfileImageUrl } from "@utils/mediaUrl";
import { SidebarProjectsSkeleton } from "@components/UI/Skeleton";
import type { Project } from "@/types/project.types";
import Modal from "@components/UI/Model";
import Input from "@components/UI/Input";
import Button from "@components/UI/Button";
import { getStoredUserRoles } from "@utils/moduleAccess";
import { useActiveOrg, type OrgMode } from "@/contexts/ActiveOrgContext";
import type { Organization } from "@/apis/api/organization";
import { useChatNotifications } from "@/contexts/ChatNotificationContext";
import { useChatUsers } from "@/apis/api/chat";
import { getUserId } from "@utils/session";

const PROJECT_ACCENTS = [
  "bg-violet-500","bg-sky-500","bg-emerald-500","bg-amber-500",
  "bg-rose-500","bg-indigo-500","bg-teal-500","bg-fuchsia-500",
];

function accentForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PROJECT_ACCENTS[Math.abs(h) % PROJECT_ACCENTS.length];
}

export type NavItem =
  | {
      type?: never;
      path: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      end?: boolean;
      badge?: "chat";
    }
  | { type: "projects"; path?: never; label?: never; icon?: never; end?: never; badge?: never };

interface SidebarShellProps {
  navItems: NavItem[];
  /** base path prefix used to build project task links */
  tasksBasePath: string;
  /** base path for notes page fullscreen detection */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const linkCls = (isActive: boolean, nested = false) =>
  [
    "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden",
    nested ? "pl-9 pr-3 py-2" : "px-3 py-2.5",
    isActive
      ? "bg-gradient-to-r from-violet-600/10 to-indigo-600/5 text-violet-800 shadow-[0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-violet-500/15"
      : "text-gray-600 hover:bg-gray-100/90 hover:text-gray-900",
  ].join(" ");

const SidebarShell = ({ navItems, tasksBasePath, mobileOpen, onMobileClose }: SidebarShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMode, setActiveMode, ownedOrg, memberOrg, hasBoth, noOrg } = useActiveOrg();
  const { data: projects = [], isLoading: projectsLoading } = useProjectsList(100, activeMode);
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const userId = getUserId();
  const { data: user } = useUserById(userId);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState<CreateProjectInput>({ projectName: "", description: "" });
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const profileOrgRef = useRef<HTMLDivElement>(null);

  const { unreadCounts } = useChatNotifications();
  const { data: orgChatUsers = [] } = useChatUsers(activeMode);
  const orgChatUserIds = useMemo(() => new Set(orgChatUsers.map((u) => u._id)), [orgChatUsers]);
  const totalUnread = Object.entries(unreadCounts)
    .filter(([id]) => orgChatUserIds.has(id))
    .reduce((s, [, c]) => s + c, 0);

  const userRoles = (user?.role?.length ? user.role : getStoredUserRoles()) ?? [];
  const effectiveRoles: string[] = hasBoth && activeMode === "member" ? ["employee"] : userRoles;
  const canCreateProjects = effectiveRoles.some((r) => ["admin", "manager", "super-admin"].includes(r));

  const orgSwitcherOptions = useMemo(() => {
    const opts: { mode: OrgMode; org: Organization; subtitle: string; Icon: typeof ShieldCheck }[] = [];
    if (ownedOrg) opts.push({ mode: "owned", org: ownedOrg, subtitle: "Organization you own", Icon: ShieldCheck });
    if (memberOrg) opts.push({ mode: "member", org: memberOrg, subtitle: "Member access", Icon: UserCircle2 });
    return opts;
  }, [ownedOrg, memberOrg]);

  useEffect(() => {
    if (!orgMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (profileOrgRef.current && !profileOrgRef.current.contains(e.target as Node)) setOrgMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOrgMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [orgMenuOpen]);

  const activeOrg = activeMode === "member" ? memberOrg : ownedOrg;
  const roleLabel = user?.role?.[0] ?? "Member";
  const initials = user?.name?.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const sidebarProfileUrl = useMemo(() => resolveProfileImageUrl(user?.profileImage), [user?.profileImage]);

  const selectedProjectId = useMemo(() => new URLSearchParams(location.search).get("project"), [location.search]);
  const isTasksRoute = location.pathname.includes("/tasks");

  const switchOrgMode = (mode: OrgMode) => {
    setActiveMode(mode);
    setOrgMenuOpen(false);
    onMobileClose();
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProjectMutation.mutateAsync({ id: deleteTarget._id, orgContext: activeMode });
      toast.success("Project deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not delete project");
    }
  };

  const handleSubmitCreateProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createProjectMutation.mutateAsync({ ...projectForm, orgContext: activeMode });
      toast.success("Project created");
      setCreateProjectOpen(false);
      setProjectsOpen(true);
      onMobileClose();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not create project");
    }
  };

  const shell = (
    <>
      {/* Logo */}
      <div
        className="flex h-16 items-center gap-2 border-b border-gray-200/80 px-4 cursor-pointer"
        onClick={() => navigate("/")}
        role="presentation"
      >
        <img src={logo} alt="TMS" className="h-9 w-auto object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-gray-900">TMS</p>
          <p className="truncate text-xs text-gray-500">Task Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item, idx) => {
          if (item.type === "projects") {
            return (
              <div key="projects-section" className="pt-1">
                <div className="flex items-center gap-0.5 pr-1">
                  <button
                    type="button"
                    onClick={() => setProjectsOpen((o) => !o)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100/90"
                  >
                    <span className="flex truncate "><BriefcaseBusiness className="h-5 w-5 shrink-0 text-gray-400 mr-2" /> Projects</span>
                    {projectsOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
                  </button>
                  {canCreateProjects && (
                    <button
                      type="button"
                      onClick={() => { setCreateProjectOpen(true); setProjectsOpen(true); }}
                      className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-violet-50 hover:text-violet-700"
                      title="New project"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {projectsOpen && (
                  <div className="mt-1 space-y-0.5 border-l border-gray-200/80 ml-4 pl-2">
                    {projectsLoading ? (
                      <SidebarProjectsSkeleton />
                    ) : projects.length === 0 ? (
                      <p className="px-2 py-2 text-xs text-gray-500">No projects yet</p>
                    ) : (
                      projects.map((p: Project) => {
                        const active = isTasksRoute && selectedProjectId === p._id;
                        return (
                          <div key={p._id} className="group/proj flex items-center">
                            <NavLink
                              to={`${tasksBasePath}?project=${p._id}`}
                              onClick={onMobileClose}
                              className={() => linkCls(active, true) + " flex-1 min-w-0"}
                            >
                              <span className={`h-2 w-2 shrink-0 rounded-full ${accentForId(p._id)} shadow-sm ring-2 ring-white`} />
                              <span className="truncate">{p.projectName}</span>
                            </NavLink>
                            {canCreateProjects && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                                className="ml-1 flex-shrink-0 rounded p-1 text-slate-300 opacity-0 group-hover/proj:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          }

          const { path, label, icon: Icon, end, badge } = item;
          const isChat = badge === "chat";
          return (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={onMobileClose}
              className={({ isActive }) => linkCls(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
                  )}
                  <Icon className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-gray-700" />
                  <span className="flex-1 truncate">{label}</span>
                  {isChat && totalUnread > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Org + Profile footer */}
      <div ref={profileOrgRef} className="relative border-t border-gray-200/80 p-3">
        {orgMenuOpen && (
          <div
            className="absolute bottom-full left-3 right-3 z-20 mb-2 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.12)]"
            role="menu"
          >
            <p className="border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Organizations</p>
            <div className="max-h-[min(50vh,14rem)] space-y-0.5 overflow-y-auto p-2">
              {orgSwitcherOptions.length === 0 ? (
                <div className="rounded-xl px-3 py-3 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">No organization yet</p>
                  <p className="mt-1 text-xs text-gray-500">Create or join one to get started.</p>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                    onClick={() => { navigate("/admin/organization"); setOrgMenuOpen(false); onMobileClose(); }}
                  >
                    Go to Organization
                  </button>
                </div>
              ) : (
                orgSwitcherOptions.map(({ mode, org, subtitle, Icon }) => {
                  const selected = activeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => switchOrgMode(mode)}
                      className={[
                        "group relative flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                        selected
                          ? "bg-gradient-to-r from-violet-600/10 to-indigo-600/5 text-violet-900 shadow-[0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-violet-500/15"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                      ].join(" ")}
                    >
                      {selected && <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />}
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{org.name}</span>
                        <span className="mt-0.5 block truncate text-xs font-normal text-gray-500">{subtitle}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                onClick={() => { navigate("/profile"); setOrgMenuOpen(false); onMobileClose(); }}
              >
                <UserRound className="h-4 w-4 shrink-0 text-gray-500" />
                Profile settings
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOrgMenuOpen((o) => !o)}
          aria-expanded={orgMenuOpen}
          className="flex w-full items-center gap-3 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50 p-3 text-left shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-semibold text-white shadow-inner">
            {sidebarProfileUrl ? (
              <img src={sidebarProfileUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="select-none">{initials ?? "—"}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{user?.name ?? "Account"}</p>
            <p className="truncate text-xs capitalize text-gray-500">
              {noOrg ? "No Organization" : hasBoth && activeMode === "member" ? "Employee" : roleLabel}
            </p>
            {activeOrg && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-violet-600">
                <Building2 className="h-3 w-3 shrink-0" />
                {activeOrg.name}
              </p>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${orgMenuOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Modals */}
      <Modal isOpen={createProjectOpen} onClose={() => setCreateProjectOpen(false)} title="New project">
        <form onSubmit={handleSubmitCreateProject} className="mt-1 flex flex-col gap-3">
          <Input label="Project name" name="projectName" value={projectForm.projectName} onChange={(e) => setProjectForm((s) => ({ ...s, projectName: e.target.value }))} required placeholder="e.g. Website redesign" />
          <Input label="Description" name="description" type="textarea" value={projectForm.description} onChange={(e) => setProjectForm((s) => ({ ...s, description: e.target.value }))} required placeholder="Short summary" />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setCreateProjectOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>{createProjectMutation.isPending ? "Creating…" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete project">
        <p className="text-sm text-slate-600">Delete <span className="font-semibold">{deleteTarget?.projectName}</span>? This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" size="sm" disabled={deleteProjectMutation.isPending} onClick={handleDeleteProject}>
            {deleteProjectMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>

      {/* Unused import prevent */}
      <span className="hidden"><MessageCircle /></span>
    </>
  );

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
        onClick={onMobileClose}
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200/80 bg-white/40 shadow-[4px_0_24px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {shell}
      </aside>
    </>
  );
};

export default SidebarShell;

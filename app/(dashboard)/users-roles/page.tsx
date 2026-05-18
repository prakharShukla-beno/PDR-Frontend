"use client"

// ─────────────────────────────────────────────
// Users & Roles Page
// Reference: akshayji.lovable.app/app/users
// Backend mein user management API nahi hai abhi
// Current logged-in user dikhao + static permissions matrix
// API: GET /api/auth/me (agar ho) ya AuthContext se
// ─────────────────────────────────────────────

import { useState } from "react"
import { Plus, Mail, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useAuth } from "@/context/AuthContext"

// Static team members — backend API nahi hai abhi
const TEAM_MEMBERS = [
  { initials: "RS", name: "Rajat Sharma", email: "rajat@beno.io", role: "Admin", status: "active" },
  { initials: "PS", name: "Pavan Sengar", email: "pavan@beno.io", role: "Admin", status: "active" },
  { initials: "PR", name: "Prashant Kumar", email: "prashant@beno.io", role: "Sales", status: "active" },
  { initials: "AR", name: "Anjali Rao", email: "anjali@beno.io", role: "Sales", status: "active" },
  { initials: "PV", name: "Priya Verma", email: "priya@beno.io", role: "Marketing", status: "active" },
  { initials: "DL", name: "Diego López", email: "diego@beno.io", role: "Analyst", status: "invited" },
]

// Permissions matrix
const PERMISSIONS = [
  { label: "View accounts", admin: true, sales: true, marketing: true, analyst: true, viewer: true },
  { label: "Edit accounts", admin: true, sales: true, marketing: false, analyst: false, viewer: false },
  { label: "Create campaigns", admin: true, sales: true, marketing: true, analyst: false, viewer: false },
  { label: "Manage segments", admin: true, sales: true, marketing: true, analyst: false, viewer: false },
  { label: "Approve AI fields", admin: true, sales: false, marketing: false, analyst: true, viewer: false },
  { label: "Manage users", admin: true, sales: false, marketing: false, analyst: false, viewer: false },
  { label: "Configure sources", admin: true, sales: false, marketing: false, analyst: false, viewer: false },
]

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-purple-100 text-purple-700",
  Sales: "bg-blue-100 text-blue-700",
  Marketing: "bg-green-100 text-green-700",
  Analyst: "bg-yellow-100 text-yellow-700",
  Viewer: "bg-gray-100 text-gray-600",
}

export default function UsersRolesPage() {
  const { user } = useAuth()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Sales")
  const [inviteMsg, setInviteMsg] = useState("")

  // Current user ko team mein add karo
  const currentUser = user ? {
    initials: user.name?.slice(0, 2).toUpperCase() ?? "U",
    name: user.name ?? "User",
    email: user.email ?? "",
    role: "Admin",
    status: "active"
  } : null

  // Combine current user with static team
  const allMembers = currentUser
    ? [currentUser, ...TEAM_MEMBERS.filter(m => m.email !== user?.email)]
    : TEAM_MEMBERS

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      setInviteMsg("❌ Email zaroori hai.")
      return
    }
    setInviteMsg(`✅ Invite bhej diya — ${inviteEmail}`)
    setTimeout(() => {
      setShowInviteModal(false)
      setInviteMsg("")
      setInviteEmail("")
    }, 1500)
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Admin · BR-03
          </p>
          <h1 className="text-2xl font-bold">Users & Roles</h1>
          <p className="text-sm text-muted-foreground">
            Team members aur permissions manage karo.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowInviteModal(true)}>
          <Plus className="h-4 w-4" />Invite User
        </Button>
      </div>

      {/* ── Team Members ── */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Team Members ({allMembers.length})</h3>
          </div>
          <div className="divide-y">
            {allMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                    {member.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{member.name}</p>
                      {member.email === user?.email && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {member.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] || ROLE_COLORS.Viewer}`}>
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Permissions Matrix ── */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Permissions Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 text-left font-medium">Permission</th>
                  {["Admin", "Sales", "Marketing", "Analyst", "Viewer"].map(role => (
                    <th key={role} className="p-4 text-center font-medium">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${ROLE_COLORS[role]}`}>
                        {role}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.label} className="hover:bg-muted/20">
                    <td className="p-4 text-sm">{perm.label}</td>
                    {[perm.admin, perm.sales, perm.marketing, perm.analyst, perm.viewer].map((allowed, i) => (
                      <td key={i} className="p-4 text-center">
                        {allowed
                          ? <Check className="h-4 w-4 text-green-500 mx-auto" />
                          : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Invite Modal ── */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Team member ko workspace mein invite karo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Analyst">Analyst</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteMsg && (
              <div className="text-sm px-3 py-2 rounded-lg border">{inviteMsg}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button onClick={handleInvite} className="gap-2">
              <Mail className="h-4 w-4" />Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
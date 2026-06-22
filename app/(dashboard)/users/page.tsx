"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/apiClient"
import { useRouter, usePathname } from "next/navigation"

interface TeamUser {
  _id: string
  name: string
  email: string
  role: "admin" | "editor" | "viewer"
  isActive: boolean
  inviteAccepted: boolean
  lastLoginAt: string | null
  createdAt: string
}

export default function UsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor")
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState("")

  const currentUserId = user?.id ?? user?._id

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(""), 3000)
    return () => clearTimeout(timer)
  }, [message])

  const isErrorMessage = (text: string) => {
    const lower = text.toLowerCase()
    return (
      lower.includes("fail") ||
      lower.includes("error") ||
      lower.includes("already") ||
      text.includes("❌")
    )
  }

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.get<{ success: boolean; data: TeamUser[] }>("/users")
      if (data.success) setUsers(data.data)
    } catch {
      console.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === "admin") {
      setLoading(true)
      fetchUsers()
    }
  }, [user, pathname, fetchUsers])

  useEffect(() => {
    const onFocus = () => {
      if (user?.role === "admin") fetchUsers()
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [user, fetchUsers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setMessage("")

    try {
      const data = await api.post<{
        success: boolean
        message?: string
        data?: { resent?: boolean }
      }>("/users/invite", {
        email: inviteEmail,
        role: inviteRole,
      })

      if (data.success) {
        setMessage(data.message || `Invite sent to ${inviteEmail}`)
        setInviteEmail("")
        await fetchUsers()
      } else {
        setMessage(data.message || "Invite failed")
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to send invite")
    } finally {
      setInviting(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const data = await api.put<{ success: boolean; message?: string }>(
        `/users/${userId}/role`,
        { role: newRole }
      )
      if (data.success) {
        setMessage(data.message || `Role updated to ${newRole}`)
        await fetchUsers()
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to update role")
    }
  }

  const handleRemove = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Remove ${userName} from the team? They will lose access immediately but their data history will be preserved.`
      )
    ) {
      return
    }

    try {
      const data = await api.delete<{ success: boolean; message?: string }>(`/users/${userId}`)
      if (data.success) {
        setMessage(data.message || `${userName} has been removed from the team`)
        await fetchUsers()
      } else {
        setMessage(data.message || "Failed to remove user")
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove user")
    }
  }

  const ROLE_COLORS = {
    admin: "bg-purple-100 text-purple-700",
    editor: "bg-blue-100 text-blue-700",
    viewer: "bg-gray-100 text-gray-600",
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading team...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Members</h1>
      <p className="text-gray-500 text-sm mb-8">Manage your team and their access levels</p>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            isErrorMessage(message)
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Invite team member</h2>

        <form onSubmit={handleInvite} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="colleague@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={inviting}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            {inviting ? "Sending..." : "Send invite"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Member</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Role</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Last Login</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const isSelf = String(u._id) === String(currentUserId)
              const isRemoved = u.isActive === false

              return (
                <tr
                  key={u._id}
                  className={`hover:bg-gray-50 transition-colors ${isRemoved ? "opacity-60" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-teal-700 font-medium text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {u.name}
                          {isSelf && (
                            <span className="ml-2 text-xs text-gray-400">(you)</span>
                          )}
                        </p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {isSelf || isRemoved ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}
                      >
                        {u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {!u.isActive ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Removed
                      </span>
                    ) : u.inviteAccepted ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString()
                      : "Never"}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {!isSelf && u.isActive !== false && (
                      <button
                        type="button"
                        onClick={() => handleRemove(u._id, u.name)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
        <p><strong>Admin</strong> — Full access, invite users, manage team</p>
        <p><strong>Editor</strong> — Import, enrich, create ICPs and segments</p>
        <p><strong>Viewer</strong> — Read-only access, can export</p>
      </div>
    </div>
  )
}

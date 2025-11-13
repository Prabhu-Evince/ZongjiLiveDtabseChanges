import  { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
    Bell,
    User,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

const socket = io("http://localhost:5000");

function Users() {
    const [users, setUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState("create");
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ name: "", email: "", status: "active" });

    useEffect(() => {
        fetchUsers();
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        socket.on("connect", () => {
            setIsConnected(true);
            console.log("✅ Connected to server");
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
            console.log("❌ Disconnected from server");
        });

        socket.on("database-change", (change) => handleDatabaseChange(change));

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("database-change");
        };
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/users");
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
            addNotification("Error", "Failed to fetch users", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDatabaseChange = ({ type, data }) => {
        console.log(data)
        if (type === "INSERT") {
            setUsers((prev) => (prev.find((u) => u.id === data.id) ? prev : [data, ...prev]));
            addNotification("✨ New User Added", `${data.name} (${data.email}) joined the system`, "success");
        } else if (type === "UPDATE") {
            setUsers((prev) =>
                prev.map((u) => (u.id === data.id ? { ...u, ...data } : u))
            );
            const changes = [];
            if (data.name !== data.old_name) changes.push(`Name: "${data.old_name}" → "${data.name}"`);
            if (data.email !== data.old_email) changes.push(`Email: "${data.old_email}" → "${data.email}"`);
            if (data.status !== data.old_status) changes.push(`Status: "${data.old_status}" → "${data.status}"`);

            const changeMsg = changes.length
                ? changes.join(", ")
                : "No visible field changes.";

            addNotification(
                `🔄 User Updated (${data.name})`,
                changeMsg,
                "info"
            );
        } else if (type === "DELETE") {
            setUsers((prev) => prev.filter((u) => u.id !== data.id));
            addNotification("🗑️ User Deleted", `${data.name} removed from system`, "error");
        }
        if (!showNotifPanel) setUnreadCount((p) => p + 1);
    };
    const addNotification = (title, message, type) => {
        debugger
        console.log(title, message, type);

        switch (type) {
            case "success": // INSERT
                toast.success(`${title}: ${message}`, {
                    style: { background: "#e6ffed", color: "#007f3b" },
                });
                break;

            case "error": // DELETE
                toast.error(`${title}: ${message}`, {
                    style: { background: "#ffe6e6", color: "#a10000" },
                });
                break;

            case "info": // UPDATE
                toast(`${title}: ${message}`, {
                    style: { background: "#e6f0ff", color: "#0040a1" },
                });
                break;

            default:
                toast(`${title}: ${message}`, {
                    icon: "💡",
                    style: { background: "#f5f5f5", color: "#333" },
                });
                break;
        }
    };


    const openCreateModal = () => {
        setModalMode("create");
        setFormData({ name: "", email: "", status: "active" });
        setShowUserModal(true);
    };

    const openEditModal = (user) => {
        setModalMode("edit");
        setSelectedUser(user);
        setFormData({ name: user.name, email: user.email, status: user.status });
        setShowUserModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = modalMode === "create" ? "POST" : "PUT";
            const url =
                modalMode === "create"
                    ? "http://localhost:5000/api/users"
                    : `http://localhost:5000/api/users/${selectedUser.id}`;
            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            setShowUserModal(false);
        } catch {
            addNotification("Error", "Operation failed", "error");
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete ${name}?`)) return;
        await fetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" });
    };

    const getNotifColor = (type) =>
        type === "success"
            ? "bg-green-50 border-green-400 text-green-700"
            : type === "error"
                ? "bg-red-50 border-red-400 text-red-700"
                : "bg-blue-50 border-blue-400 text-blue-700";

    const getNotifIcon = (type) =>
        type === "success" ? (
            <CheckCircle className="text-green-500" />
        ) : type === "error" ? (
            <XCircle className="text-red-500" />
        ) : (
            <AlertCircle className="text-blue-500" />
        );

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800">
            {/* Header */}
            <header className="flex items-center justify-between bg-white shadow p-4 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <User className="text-blue-600 w-8 h-8" />
                    <div>
                        <h1 className="text-lg font-semibold">User Management</h1>
                        <p className="text-sm text-gray-500">Real-time database monitoring</p>
                    </div>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
                <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
                    <div>
                        <p className="text-gray-500 text-sm">Total Users</p>
                        <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                    <User className="text-blue-500 w-8 h-8" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white m-4 rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">Users List</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-gray-500">
                        <User className="w-10 h-10 mb-2" />
                        <p>No users found</p>
                    </div>
                ) : (
                    <table className="w-full border-t border-gray-200 text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="py-2 px-3 text-left">ID</th>
                                <th className="py-2 px-3 text-left">User</th>
                                <th className="py-2 px-3 text-left">Email</th>
                                <th className="py-2 px-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-t hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-500">#{u.id}</td>
                                    <td className="py-2 px-3 flex items-center gap-2">
                                        <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{u.name}</span>
                                    </td>
                                    <td className="py-2 px-3">{u.email}</td>
                                    <td className="py-2 px-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${u.status === "active"
                                                ? "bg-green-100 text-green-700"
                                                : u.status === "pending"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-200 text-gray-700"
                                                }`}
                                        >
                                            {u.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Notifications Panel */}
            {showNotifPanel && (
                <div className="fixed right-0 top-0 w-80 h-full bg-white shadow-lg border-l p-4 overflow-y-auto z-50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="flex items-center gap-2 font-semibold text-lg">
                            <Bell /> Live Notifications
                        </h3>
                        <button onClick={() => setShowNotifPanel(false)}>
                            <X />
                        </button>
                    </div>

                    {notifications.length > 0 && (
                        <button
                            onClick={() => setNotifications([])}
                            className="text-sm text-blue-600 hover:underline mb-2"
                        >
                            Clear all
                        </button>
                    )}

                    <div className="space-y-2">
                        {notifications.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">
                                <Bell className="w-8 h-8 mx-auto mb-2" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`border-l-4 p-3 rounded-md shadow-sm ${getNotifColor(n.type)}`}
                                >
                                    <div className="flex items-start gap-2">
                                        {getNotifIcon(n.type)}
                                        <div>
                                            <h4 className="font-semibold">{n.title}</h4>
                                            <p className="text-sm">{n.message}</p>
                                            <span className="text-xs text-gray-500">{n.timestamp}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* User Modal */}
            {showUserModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-40 z-40"
                        onClick={() => setShowUserModal(false)}
                    ></div>
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">
                                    {modalMode === "create" ? "Add User" : "Edit User"}
                                </h2>
                                <button onClick={() => setShowUserModal(false)}>
                                    <X />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowUserModal(false)}
                                        className="px-4 py-2 rounded-lg border"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        {modalMode === "create" ? "Create" : "Update"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Users;

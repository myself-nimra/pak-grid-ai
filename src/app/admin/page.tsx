"use client";
import { useState, useEffect } from "react";
import { Trash2, UserPlus, Users, Eye, EyeOff } from "lucide-react";

interface UserAccount {
  name: string;
  email: string;
  passwordHash: string;
  city: string;
  homeType: string;
  billRange: string;
  isGoogleUser?: boolean;
  createdAt: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const storedUsers = localStorage.getItem("pakgrid_users");
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch (e) {
        console.error("Error parsing users", e);
      }
    }
  }, []);

  const saveUsers = (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    localStorage.setItem("pakgrid_users", JSON.stringify(newUsers));
  };

  const addUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;
    
    // Check if email already exists
    if (users.find(u => u.email.toLowerCase() === newEmail.toLowerCase())) {
      alert("User with this email already exists.");
      return;
    }

    const newUser: UserAccount = {
      name: newName,
      email: newEmail,
      passwordHash: newPassword, // Using direct password as 'hash' since the app uses plain text compare
      city: "Lahore", // Default
      homeType: "House / Portion", // Default
      billRange: "Rs. 15,000 - 30,000", // Default
      createdAt: new Date().toISOString(),
    };
    
    saveUsers([...users, newUser]);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    alert("User added successfully!");
  };

  const deleteUser = (email: string) => {
    if (confirm(`Are you sure you want to delete ${email}?`)) {
      saveUsers(users.filter(u => u.email !== email));
    }
  };

  return (
    <div className="pt-20 pb-16 px-4 max-w-5xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Users size={32} className="text-orange-electric" />
        <h1 className="font-heading text-3xl font-bold">Admin Panel</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Add User Form */}
        <div className="md:col-span-1">
          <div className="glass-card p-6">
            <h2 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
              <UserPlus size={20} /> Add New User
            </h2>
            <form onSubmit={addUser} className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-bg-surface border border-white/10 rounded-btn p-2.5 text-sm focus:border-orange-electric/50 outline-none transition-colors"
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-bg-surface border border-white/10 rounded-btn p-2.5 text-sm focus:border-orange-electric/50 outline-none transition-colors"
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-bg-surface border border-white/10 rounded-btn p-2.5 text-sm focus:border-orange-electric/50 outline-none transition-colors pr-10"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full btn-primary py-2.5 flex justify-center items-center gap-2 mt-2"
              >
                <UserPlus size={16} /> Add User
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="md:col-span-2">
          <div className="glass-card p-6">
            <h2 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
              <Users size={20} /> Manage Users
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-muted text-sm">
                    <th className="py-3 px-2 font-medium">Name</th>
                    <th className="py-3 px-2 font-medium">Email</th>
                    <th className="py-3 px-2 font-medium">Joined</th>
                    <th className="py-3 px-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.email} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2 text-sm">{user.name}</td>
                      <td className="py-3 px-2 text-sm text-muted">{user.email}</td>
                      <td className="py-3 px-2 text-sm text-muted">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => deleteUser(user.email)}
                          className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted text-sm">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import {
  Users,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  GraduationCap,
  UserCheck,
  Building,
  Mail,
  Calendar,
  Phone,
} from 'lucide-react';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import { Label } from '@/components/forms';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FormSelect,
  Input,
  SearchInput,
} from '@/components/ui';

import { useAdminStore } from '../store';
import { authApi } from '@/features/auth/services';
import { COLLEGES, getDepartmentsByCollege } from '@/constants';

import type { AdminUser, UserRole, UserStatus } from '../types';

export function UserManagement() {
  const {
    users,
    departments,
    userSearchQuery,
    userRoleFilter,
    userDeptFilter,
    userStatusFilter,
    addUser,
    updateUser,
    deleteUser,
    setUserSearchQuery,
    setUserRoleFilter,
    setUserDeptFilter,
    setUserStatusFilter,
    fetchAdminData,
  } = useAdminStore();

  React.useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  // Modals & Drawers state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null);
  const [viewingUser, setViewingUser] = React.useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [userCollegeFilter, setUserCollegeFilter] = React.useState<string>('ALL');

  // Form State
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student' as UserRole,
    college: 'College of Engineering' as string,
    departmentId: 'dept-se',
    department: 'Software Engineering',
    studentIdentifier: '',
    facultyIdentifier: '',
    nationalId: '',
    phone: '',
    userId: '',
  });

  const handleOpenAddModal = () => {
    const defaultCol = 'College of Engineering';
    const deptsInCol = getDepartmentsByCollege(defaultCol);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'student',
      college: defaultCol,
      departmentId: deptsInCol[0]?.id || '',
      department: deptsInCol[0]?.name || 'Software Engineering',
      studentIdentifier: `STD-${Math.floor(1000 + Math.random() * 9000)}`,
      facultyIdentifier: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      nationalId: '',
      phone: '',
      userId: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: AdminUser) => {
    const foundDept = getDepartmentsByCollege().find((d) => d.name === user.department);
    const userCol = foundDept ? foundDept.college : 'College of Engineering';
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      college: userCol,
      departmentId: foundDept?.id || '',
      department: user.department,
      studentIdentifier: '',
      facultyIdentifier: '',
      nationalId: '',
      phone: user.phone || '',
      userId: user.userId,
    });
  };

  const handleSaveUser = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Missing fields', { description: 'First name, last name, and email are required.' });
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Missing field', { description: 'Password is required for user registration.' });
      return;
    }

    if (formData.role === 'student' && !formData.studentIdentifier) {
      toast.error('Missing field', { description: 'Student identifier is required for Student registration.' });
      return;
    }

    if (formData.role === 'lecturer' && !formData.facultyIdentifier) {
      toast.error('Missing field', { description: 'Faculty identifier is required for Lecturer registration.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        updateUser(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
        });
        toast.success('User updated', { description: `${formData.firstName} ${formData.lastName} account updated successfully.` });
        setEditingUser(null);
      } else {
        await authApi.register({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role.toUpperCase(),
          student_identifier: formData.role === 'student' ? formData.studentIdentifier : undefined,
          faculty_identifier: formData.role === 'lecturer' ? formData.facultyIdentifier : undefined,
          department_id: formData.departmentId || undefined,
          national_id_fan: formData.nationalId || undefined,
        });
        
        addUser({
          userId: formData.userId || `USR-${Date.now()}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          status: 'active',
          phone: formData.phone,
        });
        toast.success('User created', { description: `Account for ${formData.firstName} ${formData.lastName} created.` });
        setIsAddModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to save user', { 
        description: error instanceof Error ? error.message : 'An unexpected error occurred.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (user: AdminUser) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    updateUser(user.id, { status: nextStatus });
    toast.success(`User ${nextStatus}`, { description: `${user.firstName} ${user.lastName} is now ${nextStatus}.` });
  };

  const handleDeleteConfirm = () => {
    if (deletingUser) {
      deleteUser(deletingUser.id);
      toast.success('User deleted', { description: `${deletingUser.firstName} ${deletingUser.lastName} deleted.` });
      setDeletingUser(null);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.userId.toLowerCase().includes(userSearchQuery.toLowerCase());

    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesDept = userDeptFilter === 'ALL' || u.department === userDeptFilter;
    const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all institutional user accounts, access roles, departments, and account status.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddModal}>
          Add New User
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <SearchInput
              placeholder="Search by name, email, ID..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              onClear={() => setUserSearchQuery('')}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="lecturer">Lecturer</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={userCollegeFilter}
              onChange={(e) => {
                setUserCollegeFilter(e.target.value);
                setUserDeptFilter('ALL');
              }}
            >
              <option value="ALL">All Colleges</option>
              {COLLEGES.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={userDeptFilter}
              onChange={(e) => setUserDeptFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {getDepartmentsByCollege(userCollegeFilter).map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">User ID</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Last Login</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{user.userId}</td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          user.role === 'admin'
                            ? 'default'
                            : user.role === 'lecturer'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="capitalize gap-1"
                      >
                        {user.role === 'admin' && <Shield className="h-3 w-3 text-accent" />}
                        {user.role === 'lecturer' && <UserCheck className="h-3 w-3 text-primary" />}
                        {user.role === 'student' && <GraduationCap className="h-3 w-3 text-primary" />}
                        {user.role}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[200px] truncate">
                      {user.department}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          user.status === 'active'
                            ? 'success'
                            : user.status === 'inactive'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="capitalize"
                      >
                        {user.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{user.lastLogin}</td>

                    <td className="px-4 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingUser(user)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEditModal(user)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.status === 'active' ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2 text-accent" /> Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2 text-success" /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingUser(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit User Modal */}
      <Dialog
        open={isAddModalOpen || !!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingUser(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User Account' : 'Add New User Account'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Update user account information and departmental role.'
                : 'Enter the user details below to create a new account.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName" className="text-xs font-medium mb-1.5 block">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Abebe"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs font-medium mb-1.5 block">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Bikila"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-xs font-medium mb-1.5 block">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@aastu.edu.et"
              />
            </div>

            {!editingUser && (
              <div>
                <Label htmlFor="password" className="text-xs font-medium mb-1.5 block">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter initial account password"
                />
              </div>
            )}

            <div>
              <Label htmlFor="role" className="text-xs font-medium mb-1.5 block">
                Role
              </Label>
              <FormSelect
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Administrator</option>
              </FormSelect>
            </div>

            {!editingUser && formData.role === 'student' && (
              <div>
                <Label htmlFor="studentIdentifier" className="text-xs font-medium mb-1.5 block">
                  Student Identifier *
                </Label>
                <Input
                  id="studentIdentifier"
                  value={formData.studentIdentifier}
                  onChange={(e) => setFormData({ ...formData, studentIdentifier: e.target.value })}
                  placeholder="e.g. STD-2026-001"
                />
              </div>
            )}

            {!editingUser && formData.role === 'lecturer' && (
              <div>
                <Label htmlFor="facultyIdentifier" className="text-xs font-medium mb-1.5 block">
                  Faculty Identifier *
                </Label>
                <Input
                  id="facultyIdentifier"
                  value={formData.facultyIdentifier}
                  onChange={(e) => setFormData({ ...formData, facultyIdentifier: e.target.value })}
                  placeholder="e.g. FAC-2026-001"
                />
              </div>
            )}

            <div>
              <Label htmlFor="userCollege" className="text-xs font-medium mb-1.5 block">
                College *
              </Label>
              <FormSelect
                id="userCollege"
                value={formData.college}
                onChange={(e) => {
                  const newCol = e.target.value;
                  const depts = getDepartmentsByCollege(newCol);
                  setFormData({
                    ...formData,
                    college: newCol,
                    departmentId: depts[0]?.id || '',
                    department: depts[0]?.name || '',
                  });
                }}
              >
                {COLLEGES.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <Label htmlFor="department" className="text-xs font-medium mb-1.5 block">
                Department *
              </Label>
              <FormSelect
                id="department"
                value={formData.departmentId}
                onChange={(e) => {
                  const deptId = e.target.value;
                  const deptObj = getDepartmentsByCollege(formData.college).find((d) => d.id === deptId);
                  setFormData({
                    ...formData,
                    departmentId: deptId,
                    department: deptObj ? deptObj.name : formData.department,
                  });
                }}
              >
                {getDepartmentsByCollege(formData.college).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <Label htmlFor="nationalId" className="text-xs font-medium mb-1.5 block">
                National ID / FAN (Optional)
              </Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="e.g. FAN-123456"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Details Drawer/Modal */}
      {viewingUser && (
        <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> User Profile Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
                  {viewingUser.firstName[0]}
                  {viewingUser.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {viewingUser.firstName} {viewingUser.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5" /> {viewingUser.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="capitalize">{viewingUser.role}</Badge>
                    <Badge variant={viewingUser.status === 'active' ? 'success' : 'secondary'}>
                      {viewingUser.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> System User ID:
                  </span>
                  <span className="font-mono font-medium">{viewingUser.userId}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> Academic Department:
                  </span>
                  <span className="font-medium text-right max-w-[200px]">{viewingUser.department}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Last Login:
                  </span>
                  <span className="font-medium">{viewingUser.lastLogin}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone Number:
                  </span>
                  <span className="font-medium">{viewingUser.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setViewingUser(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Confirmation */}
      {deletingUser && (
        <ConfirmationDialog
          open={!!deletingUser}
          onOpenChange={(open) => {
            if (!open) setDeletingUser(null);
          }}
          title="Delete User Account"
          description={`Are you sure you want to permanently delete account for ${deletingUser.firstName} ${deletingUser.lastName} (${deletingUser.userId})? This action cannot be undone.`}
          confirmLabel="Delete Account"
          destructive
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
}

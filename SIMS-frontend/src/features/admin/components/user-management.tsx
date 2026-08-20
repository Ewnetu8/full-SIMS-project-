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
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';
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

import type { AdminUser, UserRole, UserStatus } from '../types';

export function UserManagement() {
  const {
    users,
    isLoadingUsers,
    usersError,
    departments,
    colleges,
    userSearchQuery,
    userRoleFilter,
    userDeptFilter,
    userStatusFilter,
    fetchUsers,
    fetchDepartments,
    fetchColleges,
    addUser,
    updateUser,
    deleteUser,
    setUserSearchQuery,
    setUserRoleFilter,
    setUserDeptFilter,
    setUserStatusFilter,
  } = useAdminStore();

  // Modals & Drawers state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null);
  const [viewingUser, setViewingUser] = React.useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userCollegeFilter, setUserCollegeFilter] = React.useState<string>('ALL');

  const filteredDepartments = React.useMemo(() => {
    if (!userCollegeFilter || userCollegeFilter === 'ALL') return departments;
    return departments.filter(
      (d) =>
        d.college === userCollegeFilter ||
        (colleges.find((c) => c.name === userCollegeFilter || c.code === userCollegeFilter)?.id === d.college)
    );
  }, [departments, colleges, userCollegeFilter]);

  React.useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchColleges();
  }, [fetchUsers, fetchDepartments, fetchColleges]);

  // Form State matching UserRegisterRequest
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student' as UserRole,
    studentIdentifier: '',
    facultyIdentifier: '',
    departmentId: '',
    nationalId: '',
    phone: '',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'student',
      studentIdentifier: '',
      facultyIdentifier: '',
      departmentId: departments[0]?.id || '',
      nationalId: '',
      phone: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: AdminUser) => {
    setFieldErrors({});
    setEditingUser(user);
    const userDept = departments.find((d) => d.name === user.department || d.id === user.department);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      studentIdentifier: user.studentIdentifier || '',
      facultyIdentifier: user.facultyIdentifier || '',
      departmentId: userDept?.id || '',
      nationalId: '',
      phone: user.phone || '',
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!editingUser) {
      if (!formData.password) {
        errors.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long.';
      }
    }

    if (formData.role === 'student' && !formData.studentIdentifier.trim()) {
      errors.studentIdentifier = "Please enter the student's ID before creating the account.";
      errors.student_identifier = "Please enter the student's ID before creating the account.";
    }

    if (formData.role === 'lecturer' && !formData.facultyIdentifier.trim()) {
      errors.facultyIdentifier = "Please enter the lecturer's faculty ID before creating the account.";
      errors.faculty_identifier = "Please enter the lecturer's faculty ID before creating the account.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const selectedDept = departments.find((d) => d.id === formData.departmentId);
        await updateUser(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          department: selectedDept?.name || editingUser.department,
          phone: formData.phone || editingUser.phone,
        });
        toast.success('User account updated successfully.');
        setEditingUser(null);
      } else {
        await addUser({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role.toUpperCase() as 'STUDENT' | 'LECTURER' | 'ADMIN',
          student_identifier: formData.role === 'student' ? formData.studentIdentifier : undefined,
          faculty_identifier: formData.role === 'lecturer' ? formData.facultyIdentifier : undefined,
          department_id: (formData.role === 'student' || formData.role === 'lecturer') && formData.departmentId ? formData.departmentId : null,
        });
        toast.success('User created successfully.');
        setIsAddModalOpen(false);
      }
    } catch (error: any) {
      const parsedFields = parseFieldErrors(error);
      setFieldErrors(parsedFields);
      const friendlyMessage = getUserFriendlyErrorMessage(error);
      toast.error(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUser(user.id, { status: nextStatus });
      toast.success(`User status updated to ${nextStatus}.`);
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error));
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingUser) {
      try {
        await deleteUser(deletingUser.id);
        toast.success('User account deleted successfully.');
        setDeletingUser(null);
      } catch (error) {
        toast.error(getUserFriendlyErrorMessage(error));
      }
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.userId && u.userId.toLowerCase().includes(userSearchQuery.toLowerCase()));

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
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.code})
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
              {filteredDepartments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.code})
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

      {/* Error State Banner */}
      {usersError && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 flex items-center justify-between">
          <div className="flex items-center gap-3 text-destructive">
            <XCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{usersError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchUsers()}>
            Retry
          </Button>
        </Card>
      )}

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
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading user accounts...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">User Management Data Unavailable</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        User management data is currently unavailable because the backend does not provide a user list endpoint.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/80">
                        You can still provision new student, lecturer, and administrator accounts using the button below.
                      </p>
                      <Button
                        className="mt-5"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={handleOpenAddModal}
                      >
                        Add New User
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0 uppercase">
                          {(user.firstName && user.firstName[0]) || 'U'}
                          {(user.lastName && user.lastName[0]) || ''}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {user.firstName || ''} {user.lastName || ''}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                      {user.studentIdentifier || user.facultyIdentifier || user.userId || user.id}
                    </td>

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
                      {user.department || 'Not assigned'}
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
                        {user.status || 'active'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{user.lastLogin || 'Never'}</td>

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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold">
              {editingUser ? 'Edit User Account' : 'Add New User Account'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Modify user account details and assigned role.'
                : 'Create a new user account for the university. Assign a role and enter the required information.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="firstName" required>
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Abebe"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.first_name && <p className="text-xs text-destructive mt-1">{fieldErrors.first_name}</p>}
              </div>

              <div>
                <Label htmlFor="lastName" required>
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Kebede"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.last_name && <p className="text-xs text-destructive mt-1">{fieldErrors.last_name}</p>}
              </div>

              <div>
                <Label htmlFor="email" required>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@aastu.edu.et"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
              </div>

              {!editingUser && (
                <div>
                  <Label htmlFor="password" required>
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  />
                  {fieldErrors.password && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
                </div>
              )}

              <div>
                <Label htmlFor="role" required>
                  Institutional Role
                </Label>
                <select
                  id="role"
                  className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <option value="student">STUDENT</option>
                  <option value="lecturer">LECTURER</option>
                  <option value="admin">ADMIN</option>
                </select>
                {fieldErrors.role && <p className="text-xs text-destructive mt-1">{fieldErrors.role}</p>}
              </div>
            </div>

            {/* Dynamic Role-Specific Fields */}
            {formData.role === 'student' && (
              <div className="space-y-4 p-4 rounded-xl border border-[#102A7A]/15 bg-accent/15">
                <div>
                  <Label htmlFor="studentIdentifier" required>
                    Student Identifier (ID)
                  </Label>
                  <Input
                    id="studentIdentifier"
                    value={formData.studentIdentifier}
                    onChange={(e) => setFormData({ ...formData, studentIdentifier: e.target.value })}
                    placeholder="e.g. ETS0123/14"
                    className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  />
                  {fieldErrors.studentIdentifier && <p className="text-xs text-destructive mt-1">{fieldErrors.studentIdentifier}</p>}
                  {fieldErrors.student_identifier && <p className="text-xs text-destructive mt-1">{fieldErrors.student_identifier}</p>}
                </div>

                <div>
                  <Label htmlFor="studentDepartment">Department</Label>
                  <select
                    id="studentDepartment"
                    className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.departmentId && <p className="text-xs text-destructive mt-1">{fieldErrors.departmentId}</p>}
                  {fieldErrors.department_id && <p className="text-xs text-destructive mt-1">{fieldErrors.department_id}</p>}
                </div>
              </div>
            )}

            {formData.role === 'lecturer' && (
              <div className="space-y-4 p-4 rounded-xl border border-[#102A7A]/15 bg-accent/15">
                <div>
                  <Label htmlFor="facultyIdentifier" required>
                    Faculty Identifier (ID)
                  </Label>
                  <Input
                    id="facultyIdentifier"
                    value={formData.facultyIdentifier}
                    onChange={(e) => setFormData({ ...formData, facultyIdentifier: e.target.value })}
                    placeholder="e.g. FAC-2026-01"
                    className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  />
                  {fieldErrors.facultyIdentifier && <p className="text-xs text-destructive mt-1">{fieldErrors.facultyIdentifier}</p>}
                  {fieldErrors.faculty_identifier && <p className="text-xs text-destructive mt-1">{fieldErrors.faculty_identifier}</p>}
                </div>

                <div>
                  <Label htmlFor="lecturerDepartment">Department</Label>
                  <select
                    id="lecturerDepartment"
                    className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.departmentId && <p className="text-xs text-destructive mt-1">{fieldErrors.departmentId}</p>}
                  {fieldErrors.department_id && <p className="text-xs text-destructive mt-1">{fieldErrors.department_id}</p>}
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingUser(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={isSubmitting}
              className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : editingUser ? (
                'Update User'
              ) : (
                'Create User'
              )}
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
                  <span className="font-mono font-medium">{viewingUser.userId || viewingUser.id}</span>
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
                  <span className="font-medium">{viewingUser.lastLogin || 'Never'}</span>
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
          description={`Are you sure you want to permanently delete account for ${deletingUser.firstName} ${deletingUser.lastName} (${deletingUser.userId || deletingUser.id})? This action cannot be undone.`}
          confirmLabel="Delete Account"
          destructive
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
}
